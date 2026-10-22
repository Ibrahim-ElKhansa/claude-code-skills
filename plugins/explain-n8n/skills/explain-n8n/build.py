"""Build an /explain-n8n page: check flow.json, copy the code snippets from the real files, write page.html.

    python build.py <flow.json>             check, fill, build (flow.built.json, page.html, preview.html beside it)
    python build.py <flow.json> --check     check and report only
    python build.py <flow.json> --layout    fill missing col/lane, write them back into flow.json, then build
    python build.py <flow.json> --out DIR   write the outputs somewhere else

source.root may be absolute, start with ~, or be relative to the folder that holds flow.json.
Prints every error (E_*) and warning (W_*) with where it is. Exit 1 while any error remains.
Never prints a secret: a hit is reported by field, and in code it is replaced by <redacted>.
The schema is in reference/flow-schema.md. Standard library only.
"""

import argparse
import copy
import html
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE / "template.html"

TYPES = {"trigger", "action", "decision", "loop", "merge", "data", "external", "ai", "wait", "subflow", "end"}
ICONS = set("""zap play git-branch repeat merge database globe sparkles clock layers flag file mail terminal code folder
check x search filter send download upload key lock user calendar bell cpu server table list trash edit shield link
image message refresh film hard-drive copy hash""".split())
CANVAS_ID = re.compile(r"^[a-z][a-z0-9-]{0,30}$")
NODE_ID = re.compile(r"^[a-z][a-z0-9-]{0,40}$")
LINK = re.compile(r"\[\[([^\]]+)\]\]")
LIMITS = dict(canvases=10, nodes_total=100, nodes_canvas=20, nodes_warn=12, cols=8, lane_min=-2, lane_max=5,
              depth=3, snippet=40, data=2048, runs=4, page_warn=300_000, page_max=600_000, code_refs=4, how=8, gotchas=6)
LANG = {".py": "python", ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript", ".jsx": "javascript",
        ".ts": "typescript", ".tsx": "typescript", ".sh": "bash", ".bash": "bash", ".ps1": "powershell",
        ".psm1": "powershell", ".json": "json", ".md": "markdown", ".sql": "sql", ".yaml": "yaml", ".yml": "yaml",
        ".html": "xml", ".xml": "xml", ".svg": "xml", ".css": "css", ".scss": "scss", ".go": "go", ".rs": "rust",
        ".java": "java", ".kt": "kotlin", ".cs": "csharp", ".php": "php", ".rb": "ruby", ".toml": "ini",
        ".ini": "ini", ".cfg": "ini", ".env.example": "ini", ".cmd": "dos", ".bat": "dos", ".txt": "plaintext"}
HLJS_EXTRA = {"powershell", "dos", "dockerfile", "nginx"}  # not in highlight.js's common bundle
HLJS = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/{}.min.js"

# Token shapes that are secrets wherever they appear. Built in, so the check needs no extra files.
SECRET_SHAPES = [re.compile(p) for p in (
    r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}",                    # GitHub tokens
    r"\bgithub_pat_[A-Za-z0-9_]{22,}",                                 # GitHub fine-grained tokens
    r"\bsk-ant-[A-Za-z0-9_-]{20,}",                                    # Anthropic API keys
    r"\bsk-[A-Za-z0-9_-]{20,}",                                        # OpenAI-style keys
    r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b",                                  # AWS access key ids
    r"\bxox[abpr]-[A-Za-z0-9-]{10,}",                                  # Slack tokens
    r"\bAIza[0-9A-Za-z_-]{35}",                                        # Google API keys
    r"-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z0-9]+ )*PRIVATE KEY-----|\Z)",
    r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",  # JWTs
)]

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
PHONE = re.compile(r"(?<![\w.])\+?\d[\d ()-]{7,}\d(?![\w.])")
IBAN = re.compile(r"\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,4})?\b")
EMIRATES_ID = re.compile(r"\b784-?\d{4}-?\d{7}-?\d\b")
CARD = re.compile(r"\b(?:\d[ -]?){13,19}\b")


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def err(self, code, where, msg):
        self.errors.append(f"{code}  {where}: {msg}")

    def warn(self, code, where, msg):
        self.warnings.append(f"{code}  {where}: {msg}")


# ------------------------------------------------------------------ ports, same rules as the template

def inputs_of(n):
    if "inputs" in n:
        return n["inputs"]
    return [] if n["type"] == "trigger" else [{"id": "in1"}, {"id": "in2"}] if n["type"] == "merge" else [{"id": "main"}]


def outputs_of(n):
    if "outputs" in n:
        outs = list(n["outputs"])
    else:
        outs = [] if n["type"] == "end" else [{"id": "done"}, {"id": "loop"}] if n["type"] == "loop" else [{"id": "main"}]
    if n.get("errorOutput"):
        outs.append({"id": "error", "label": "error"})
    return outs


# ------------------------------------------------------------------ checks on the shape

def need(rep, where, obj, key, kind, maxlen=None):
    v = obj.get(key)
    if not isinstance(v, kind) or (isinstance(v, str) and not v.strip()):
        rep.err("E_FIELD", where, f"'{key}' is missing or empty")
        return None
    if maxlen and isinstance(v, str) and len(v) > maxlen:
        rep.err("E_LIMIT", where, f"'{key}' is {len(v)} characters, the limit is {maxlen}")
    return v


def validate(flow, rep, concept):
    if flow.get("schema") != "explain-flow/1":
        rep.err("E_SCHEMA", "flow", "schema must be \"explain-flow/1\"")
    need(rep, "flow", flow, "title", str, 80)
    title = need(rep, "flow", flow, "pageTitle", str)
    if title and not 2 <= len(title.split()) <= 4:
        rep.err("E_TITLE", "flow.pageTitle", f"must be 2 to 4 words, it has {len(title.split())}")
    need(rep, "flow", flow, "summary", str)
    need(rep, "flow", flow, "takeaway", str)
    canvases = flow.get("canvases")
    if not isinstance(canvases, list) or not canvases:
        rep.err("E_FIELD", "flow", "'canvases' is missing or empty")
        return {}, {}
    if len(canvases) > LIMITS["canvases"]:
        rep.err("E_LIMIT", "flow", f"{len(canvases)} canvases, the limit is {LIMITS['canvases']}")

    by_canvas, node_canvas, nodes = {}, {}, {}
    for c in canvases:
        cid = c.get("id", "?")
        if not CANVAS_ID.match(str(cid)):
            rep.err("E_FIELD", f"canvas {cid}", "id must match ^[a-z][a-z0-9-]{0,30}$")
        if cid in by_canvas:
            rep.err("E_DUP_ID", f"canvas {cid}", "two canvases share this id")
        by_canvas[cid] = c
        need(rep, f"canvas {cid}", c, "title", str, 80)
        need(rep, f"canvas {cid}", c, "intro", str)
        cn = c.get("nodes") or []
        if not cn:
            rep.err("E_FIELD", f"canvas {cid}", "has no nodes")
        if len(cn) > LIMITS["nodes_canvas"]:
            rep.err("E_LIMIT", f"canvas {cid}", f"{len(cn)} nodes, the limit is {LIMITS['nodes_canvas']}; move detail into a subflow")
        elif len(cn) > LIMITS["nodes_warn"]:
            rep.warn("W_BIG", f"canvas {cid}", f"{len(cn)} nodes; above {LIMITS['nodes_warn']} reads poorly on a phone")
        for n in cn:
            nid = n.get("id", "?")
            if not NODE_ID.match(str(nid)):
                rep.err("E_FIELD", f"node {nid}", "id must match ^[a-z][a-z0-9-]{0,40}$")
            if nid in nodes:
                rep.err("E_DUP_ID", f"node {nid}", "two nodes share this id (ids are unique across the page)")
            nodes[nid] = n
            node_canvas[nid] = cid
    if sum(len(c.get("nodes") or []) for c in canvases) > LIMITS["nodes_total"]:
        rep.err("E_LIMIT", "flow", f"more than {LIMITS['nodes_total']} nodes in total")
    if flow.get("entry") not in by_canvas:
        rep.err("E_REF", "flow.entry", "names no canvas")

    for c in canvases:
        cid = c.get("id")
        cn = c.get("nodes") or []
        for n in cn:
            w = f"node {n.get('id')}"
            t = n.get("type")
            if t not in TYPES:
                rep.err("E_FIELD", w, f"type '{t}' is not one of {sorted(TYPES)}")
                continue
            need(rep, w, n, "name", str, 40)
            if "icon" in n and n["icon"] not in ICONS:
                rep.err("E_FIELD", w, f"icon '{n['icon']}' is not in the sprite (see reference/flow-schema.md)")
            if "subtitle" in n and len(str(n["subtitle"])) > 40:
                rep.err("E_LIMIT", w, "subtitle is over 40 characters")
            col, lane = n.get("col"), n.get("lane")
            if not isinstance(col, int) or not 0 <= col < LIMITS["cols"]:
                rep.err("E_LAYOUT", w, f"col must be a whole number 0 to {LIMITS['cols'] - 1} (run with --layout to fill it)")
            if not isinstance(lane, (int, float)) or not LIMITS["lane_min"] <= lane <= LIMITS["lane_max"] or (lane * 2) % 1:
                rep.err("E_LAYOUT", w, f"lane must be {LIMITS['lane_min']} to {LIMITS['lane_max']} in steps of 0.5 (run with --layout to fill it)")
            ex = n.get("explain")
            if not isinstance(ex, dict):
                rep.err("E_EXPLAIN", w, "'explain' is missing")
            else:
                need(rep, w + ".explain", ex, "what", str, 200)
                need(rep, w + ".explain", ex, "why", str)
                how = ex.get("how")
                if not isinstance(how, list) or not how or not all(isinstance(s, str) and s.strip() for s in how):
                    rep.err("E_EXPLAIN", w + ".explain", "'how' needs 1 to 8 steps")
                elif len(how) > LIMITS["how"]:
                    rep.err("E_LIMIT", w + ".explain", f"'how' has {len(how)} steps, the limit is {LIMITS['how']}")
                if len(ex.get("gotchas") or []) > LIMITS["gotchas"]:
                    rep.err("E_LIMIT", w + ".explain", f"more than {LIMITS['gotchas']} gotchas")
            if t == "subflow":
                if n.get("subflow") not in by_canvas:
                    rep.err("E_SUBFLOW", w, "a subflow node needs 'subflow' naming an existing canvas")
                elif n.get("subflow") == cid:
                    rep.err("E_SUBFLOW", w, "a subflow cannot open its own canvas")
            elif "subflow" in n:
                rep.err("E_SUBFLOW", w, "'subflow' is only for type subflow")
            if t == "decision" and len(n.get("outputs") or []) < 2:
                rep.err("E_DECISION", w, "a decision needs 'outputs' with at least 2 ports")
            for p in (n.get("outputs") or []) + (n.get("inputs") or []):
                if len(str(p.get("label", ""))) > 12:
                    rep.err("E_LIMIT", w, f"port label '{p.get('label')}' is over 12 characters")
            if len(set(p.get("id") for p in outputs_of(n))) != len(outputs_of(n)):
                rep.err("E_PORT", w, "two outputs share an id")
            code = n.get("code") or []
            if concept and code:
                rep.err("E_CODE", w, "a concept page (no source.root) cannot carry code refs")
            if not concept and not code and t != "end" and not n.get("assumed"):
                rep.err("E_CODE", w, "needs at least one code ref, or 'assumed' with a reason")
            if len(code) > LIMITS["code_refs"]:
                rep.err("E_LIMIT", w, f"more than {LIMITS['code_refs']} code refs")
            for k in ("assumed", "disabled"):
                if k in n and not (isinstance(n[k], dict) and str(n[k].get("why", "")).strip()):
                    rep.err("E_FIELD", w, f"'{k}' needs a 'why'")
            data = n.get("data") or {}
            for k in ("input", "output"):
                if k in data and len(json.dumps(data[k], ensure_ascii=False)) > LIMITS["data"]:
                    rep.err("E_LIMIT", w, f"example {k} is over {LIMITS['data']} bytes")

        # lanes in one column must sit at least one lane apart
        for i, a in enumerate(cn):
            for b in cn[i + 1:]:
                if a.get("col") == b.get("col") and isinstance(a.get("lane"), (int, float)) and isinstance(b.get("lane"), (int, float)) \
                        and abs(a["lane"] - b["lane"]) < 1:
                    rep.err("E_LANE", f"canvas {cid}", f"nodes {a.get('id')} and {b.get('id')} overlap in column {a.get('col')}")

        local = {n.get("id"): n for n in cn}
        linked = set()
        for i, e in enumerate(c.get("edges") or []):
            w = f"canvas {cid} edge {i} ({e.get('from')} > {e.get('to')})"
            a, b = local.get(e.get("from")), local.get(e.get("to"))
            if not a or not b:
                rep.err("E_REF", w, "from and to must be nodes on this canvas")
                continue
            if a.get("type") not in TYPES or b.get("type") not in TYPES:
                continue
            linked.update([a["id"], b["id"]])
            outs, ins = [p["id"] for p in outputs_of(a)], [p["id"] for p in inputs_of(b)]
            if not outs:
                rep.err("E_PORT", w, f"{a['id']} has no outputs")
            elif "out" in e:
                if e["out"] not in outs:
                    rep.err("E_PORT", w, f"{a['id']} has no output '{e['out']}' (it has {outs})")
            elif len(outs) > 1:
                rep.err("E_PORT", w, f"{a['id']} has {len(outs)} outputs; say which one with 'out'")
            if not ins:
                rep.err("E_PORT", w, f"{b['id']} takes no input (a trigger starts a flow)")
            elif "in" in e and e["in"] not in ins:
                rep.err("E_PORT", w, f"{b['id']} has no input '{e['in']}' (it has {ins})")
            if e.get("kind", "main") not in ("main", "error", "async"):
                rep.err("E_FIELD", w, "kind must be main, error or async")
            if len(str(e.get("label", ""))) > 30:
                rep.err("E_LIMIT", w, "label is over 30 characters")
            if isinstance(a.get("col"), int) and isinstance(b.get("col"), int):
                if b["col"] <= a["col"] and a is not b and b["type"] != "loop" and not e.get("label"):
                    rep.warn("W_BACKEDGE", w, "goes back to an earlier column; give it a label saying why")
                if b["col"] > a["col"] + 1 and a.get("lane") == b.get("lane") and any(
                        a["col"] < n.get("col", -1) < b["col"] and n.get("lane") == a.get("lane") for n in cn):
                    rep.warn("W_SKIP", w, "skips over a node in the same lane; it is drawn lifted, a different lane may read better")
        for n in cn:
            if n.get("type") == "decision":
                used = {e.get("out") for e in c.get("edges") or [] if e.get("from") == n.get("id")}
                for p in n.get("outputs") or []:
                    if p.get("id") not in used and p.get("label") != "unused":
                        rep.err("E_DECISION", f"node {n.get('id')}", f"output '{p.get('id')}' leads nowhere (label it \"unused\" if that is the point)")
            if len(cn) > 1 and n.get("id") not in linked:
                rep.warn("W_ORPHAN", f"node {n.get('id')}", "has no edges")

        tour = c.get("tour") or []
        if len(tour) > len(cn) + 4:
            rep.err("E_LIMIT", f"canvas {cid}", f"tour has {len(tour)} steps, the limit is nodes + 4")
        toured = set()
        for i, t in enumerate(tour):
            w = f"canvas {cid} tour {i}"
            need(rep, w, t, "title", str, 60)
            need(rep, w, t, "text", str, 600)
            if "node" in t:
                if t["node"] not in local:
                    rep.err("E_REF", w, f"node '{t['node']}' is not on this canvas")
                toured.add(t["node"])
        for n in cn:
            if n.get("id") not in toured:
                rep.warn("W_TOUR", f"node {n.get('id')}", "is not in the walkthrough")

        runs = c.get("runs") or []
        if len(runs) > LIMITS["runs"]:
            rep.err("E_LIMIT", f"canvas {cid}", f"more than {LIMITS['runs']} runs")
        if not runs and any(n.get("type") in ("decision", "loop") for n in cn):
            rep.warn("W_NORUN", f"canvas {cid}", "has a decision or loop but no example run")
        edges = c.get("edges") or []
        for r in runs:
            steps = r.get("steps") or []
            need(rep, f"canvas {cid} run {r.get('id')}", r, "name", str)
            for i, s in enumerate(steps):
                w = f"canvas {cid} run {r.get('id')} step {i}"
                n = local.get(s.get("node"))
                if not n:
                    rep.err("E_REF", w, f"node '{s.get('node')}' is not on this canvas")
                    continue
                if n.get("type") not in TYPES:
                    continue
                outs = [p["id"] for p in outputs_of(n)]
                if "out" in s and s["out"] not in outs:
                    rep.err("E_RUN", w, f"{n['id']} has no output '{s['out']}'")
                if "out" not in s and len(outs) > 1 and i < len(steps) - 1:
                    rep.err("E_RUN", w, f"{n['id']} has {len(outs)} outputs; say which one the run took with 'out'")
                if i and not any(
                        e.get("from") == steps[j].get("node") and e.get("to") == s.get("node")
                        and e.get("out", first_out(local.get(steps[j].get("node")))) == steps[j].get("out", first_out(local.get(steps[j].get("node"))))
                        for j in range(i) for e in edges):
                    rep.err("E_RUN", w, f"{n['id']} cannot be reached from an earlier step through the output it took")
                for k in ("input", "output"):
                    if k in (s.get("data") or {}) and len(json.dumps(s["data"][k], ensure_ascii=False)) > LIMITS["data"]:
                        rep.err("E_LIMIT", w, f"example {k} is over {LIMITS['data']} bytes")

    # subflow depth, loops and stray canvases
    def walk(cid, path):
        if len(path) > LIMITS["depth"]:
            rep.err("E_DEPTH", f"canvas {cid}", f"sits {len(path)} levels deep, the limit is {LIMITS['depth']}")
            return
        for n in by_canvas[cid].get("nodes") or []:
            sub = n.get("subflow")
            if n.get("type") == "subflow" and sub in by_canvas:
                if sub in path:
                    rep.err("E_SUBFLOW", f"node {n.get('id')}", "opens a canvas that leads back to itself")
                    continue
                reached.add(sub)
                walk(sub, path + [sub])
    reached = {flow.get("entry")}
    if flow.get("entry") in by_canvas:
        walk(flow["entry"], [flow["entry"]])
    for cid, c in by_canvas.items():
        if cid not in reached:
            rep.warn("W_STRAY", f"canvas {cid}", "no subflow node opens it")
        elif cid != flow.get("entry") and not any(n.get("type") == "trigger" for n in c.get("nodes") or []):
            rep.warn("W_NO_TRIGGER", f"canvas {cid}", "a sub-workflow reads better when it starts with a trigger")

    # glossary and links
    gl = [g.get("term", "") for g in flow.get("glossary") or []]
    if len({g.lower() for g in gl}) != len(gl):
        rep.err("E_DUP_ID", "glossary", "two entries share a term")
    terms = {g.lower() for g in gl}
    for where, text in prose(flow):
        for m in LINK.finditer(text):
            target = m.group(1)
            if target.startswith("#"):
                if target[1:] not in nodes:
                    rep.err("E_LINK", where, f"[[{target}]] names no node")
            elif target.lower() not in terms:
                rep.err("E_LINK", where, f"[[{target}]] is not in the glossary")
    return nodes, node_canvas


def first_out(n):
    if not n or n.get("type") not in TYPES:
        return "main"
    outs = outputs_of(n)
    return outs[0]["id"] if outs else "main"


# ------------------------------------------------------------------ every piece of text a reader sees

def prose(flow):
    for k in ("title", "pageTitle", "summary", "takeaway"):
        if isinstance(flow.get(k), str):
            yield f"flow.{k}", flow[k]
    for i, s in enumerate(flow.get("outOfScope") or []):
        yield f"flow.outOfScope {i}", str(s)
    for g in flow.get("glossary") or []:
        for k in ("term", "plain", "example", "n8n"):
            if g.get(k):
                yield f"glossary {g.get('term')}.{k}", str(g[k])
    for c in flow.get("canvases") or []:
        cid = c.get("id")
        for k in ("title", "intro"):
            if c.get(k):
                yield f"canvas {cid}.{k}", str(c[k])
        for i, s in enumerate(c.get("stickies") or []):
            yield f"canvas {cid} sticky {i}", str(s.get("text", ""))
        for i, t in enumerate(c.get("tour") or []):
            yield f"canvas {cid} tour {i}", f"{t.get('title', '')}\n{t.get('text', '')}"
        for i, e in enumerate(c.get("edges") or []):
            if e.get("label"):
                yield f"canvas {cid} edge {i}", str(e["label"])
        for r in c.get("runs") or []:
            yield f"canvas {cid} run {r.get('id')}", str(r.get("name", ""))
            for i, s in enumerate(r.get("steps") or []):
                if s.get("note"):
                    yield f"canvas {cid} run {r.get('id')} step {i}", str(s["note"])
                if s.get("data"):
                    yield f"canvas {cid} run {r.get('id')} step {i} data", json.dumps(s["data"], ensure_ascii=False)
        for n in c.get("nodes") or []:
            w = f"node {n.get('id')}"
            for k in ("name", "subtitle"):
                if n.get(k):
                    yield f"{w}.{k}", str(n[k])
            ex = n.get("explain") or {}
            for k in ("what", "why", "n8n"):
                if ex.get(k):
                    yield f"{w}.explain.{k}", str(ex[k])
            for k in ("how", "gotchas"):
                for i, s in enumerate(ex.get(k) or []):
                    yield f"{w}.explain.{k} {i}", str(s)
            for k in ("assumed", "disabled"):
                if isinstance(n.get(k), dict):
                    yield f"{w}.{k}", str(n[k].get("why", ""))
            for p in (n.get("inputs") or []) + (n.get("outputs") or []):
                if p.get("label"):
                    yield f"{w} port {p.get('id')}", str(p["label"])
            for i, cr in enumerate(n.get("code") or []):
                for k in ("note", "symbol"):
                    if cr.get(k):
                        yield f"{w}.code {i}.{k}", str(cr[k])
            if n.get("data"):
                yield f"{w}.data", json.dumps(n["data"], ensure_ascii=False)


def personal_data(text):
    """Names of the kinds of personal data found in text (never the data)."""
    found = []
    for m in EMAIL.finditer(text):
        dom = m.group(1).lower()
        if not (dom in ("example.com", "example.org", "example.net") or dom.endswith(".example")):
            found.append("an email address (use @example.com)")
            break
    for m in PHONE.finditer(text):
        digits = re.sub(r"\D", "", m.group(0))
        if 9 <= len(digits) <= 15 and (m.group(0).startswith("+") or re.search(r"[ ()-]", m.group(0))) \
                and not re.fullmatch(r"\d{4}-\d{2}-\d{2}.*", m.group(0)):
            found.append("a phone number")
            break
    if any(len(m.group(0).replace(" ", "")) >= 15 for m in IBAN.finditer(text)):
        found.append("an IBAN")
    if EMIRATES_ID.search(text):
        found.append("an Emirates ID")
    for m in CARD.finditer(text):
        if luhn(re.sub(r"\D", "", m.group(0))):
            found.append("a card number")
            break
    return found


def luhn(d):
    if not 13 <= len(d) <= 19:
        return False
    total = 0
    for i, ch in enumerate(reversed(d)):
        x = int(ch) * (2 if i % 2 else 1)
        total += x - 9 if x > 9 else x
    return total % 10 == 0


def find_secrets(text):
    """(start, end) spans of secret-shaped values in text, sorted and never overlapping."""
    spans = sorted((m.start(), m.end()) for rx in SECRET_SHAPES for m in rx.finditer(text))
    merged = []
    for a, b in spans:
        if merged and a < merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], b))
        else:
            merged.append((a, b))
    return merged


def screen_text(flow, rep):
    """Secrets and personal data in everything a reader sees."""
    for where, text in prose(flow):
        if find_secrets(text):
            rep.err("E_SECRET", where, "holds something that looks like a secret (value not shown); remove it")
        for kind in personal_data(text):
            rep.err("E_PII", where, f"holds {kind}; example data must be made up")


# ------------------------------------------------------------------ code: read from the real files

def git(root, *args):
    r = subprocess.run(["git", "-C", str(root)] + list(args), capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    return r.stdout.strip() if r.returncode == 0 else None


def resolve_root(raw, base):
    """source.root as a folder: absolute, ~ expanded, or relative to the folder that holds flow.json."""
    root = Path(str(raw)).expanduser()
    if not root.is_absolute():
        root = Path(base or Path.cwd()) / root
    return root.resolve()


def fill_code(flow, rep, base=None):
    src = flow.setdefault("source", {})
    root = resolve_root(src["root"], base)
    if not root.is_dir():
        rep.err("E_CODE", "source.root", "is not a folder (a relative root is read from the folder that holds flow.json)")
        return
    usable = git(root, "rev-parse", "--show-toplevel") is not None
    if usable:
        src["branch"] = git(root, "rev-parse", "--abbrev-ref", "HEAD")
        src["commit"] = git(root, "rev-parse", "--short", "HEAD")
        status = git(root, "status", "--porcelain", "--", ".")
        src["dirty"] = bool(status)
        if src["dirty"]:
            rep.warn("W_DIRTY", "source", "the code has uncommitted changes; line refs match the files on disk")
    else:
        rep.warn("W_NOGIT", "source.root", "not in a git repo; the page shows no commit")
    for c in flow.get("canvases") or []:
        for n in c.get("nodes") or []:
            for i, cr in enumerate(n.get("code") or []):
                w = f"node {n.get('id')}.code {i}"
                f = (root / str(cr.get("file", ""))).resolve()
                try:
                    f.relative_to(root.resolve())
                except ValueError:
                    rep.err("E_CODE", w, "file is outside source.root")
                    continue
                if not f.is_file():
                    rep.err("E_CODE", w, f"file '{cr.get('file')}' does not exist under source.root")
                    continue
                lines = f.read_text(encoding="utf-8", errors="replace").splitlines()
                ab = cr.get("lines")
                if not (isinstance(ab, list) and len(ab) == 2 and all(isinstance(x, int) for x in ab)
                        and 1 <= ab[0] <= ab[1] <= len(lines)):
                    rep.err("E_CODE", w, f"lines must be [first, last] within 1 to {len(lines)}")
                    continue
                if ab[1] - ab[0] + 1 > LIMITS["snippet"]:
                    rep.err("E_CODE", w, f"spans {ab[1] - ab[0] + 1} lines, the limit is {LIMITS['snippet']}")
                    continue
                snippet = "\n".join(lines[ab[0] - 1:ab[1]]).expandtabs(4)
                if cr.get("symbol") and cr["symbol"] not in snippet:
                    rep.err("E_CODE", w, f"'{cr['symbol']}' is not in lines {ab[0]} to {ab[1]} of {cr.get('file')}")
                hits = find_secrets(snippet)
                for a, b in reversed(hits):
                    snippet = snippet[:a] + "<redacted>" + snippet[b:]
                hidden = len(hits)
                for rx in (EMAIL, PHONE, IBAN, EMIRATES_ID):
                    def mask(m):
                        nonlocal hidden
                        t = m.group(0)
                        if rx is EMAIL and m.group(1).lower() in ("example.com", "example.org", "example.net"):
                            return t
                        if rx is PHONE and not personal_data(t):
                            return t
                        hidden += 1
                        return "<redacted>"
                    snippet = rx.sub(mask, snippet)
                if hidden:
                    rep.warn("W_REDACTED", w, f"{hidden} value(s) in the code were replaced by <redacted>")
                cr["snippet"], cr["redacted"] = snippet, hidden
                name = f.name.lower()
                cr["lang"] = "dockerfile" if name == "dockerfile" else LANG.get(f.suffix.lower(), "plaintext")
                if usable:
                    cr["changed"] = bool(git(f.parent, "status", "--porcelain", "--", f.name))


# ------------------------------------------------------------------ layout for nodes without col/lane

def layout(flow):
    filled = 0
    for c in flow.get("canvases") or []:
        cn = c.get("nodes") or []
        ids = {n["id"]: n for n in cn if "id" in n}
        succ = {i: [] for i in ids}
        for e in c.get("edges") or []:
            if e.get("from") in ids and e.get("to") in ids:
                succ[e["from"]].append(e["to"])
        back, state = set(), {}

        def dfs(u):
            state[u] = 1
            for v in succ[u]:
                if state.get(v) == 1:
                    back.add((u, v))
                elif v not in state:
                    dfs(v)
            state[u] = 2
        starts = [i for i, n in ids.items() if n.get("type") == "trigger"] + list(ids)
        for s in starts:
            if s not in state:
                dfs(s)
        depth = {i: 0 for i in ids}
        for _ in range(len(ids)):
            for u in ids:
                for v in succ[u]:
                    if (u, v) not in back and depth[v] < depth[u] + 1:
                        depth[v] = depth[u] + 1
        for i, n in ids.items():
            if not isinstance(n.get("col"), int):
                n["col"] = min(depth[i], LIMITS["cols"] - 1)
                filled += 1
        parents = {i: [u for u in ids for v in succ[u] if v == i and (u, v) not in back] for i in ids}
        for col in sorted({n["col"] for n in cn}):
            here = [n for n in cn if n["col"] == col]
            taken = {n["lane"] for n in here if isinstance(n.get("lane"), (int, float))}
            todo = [n for n in here if not isinstance(n.get("lane"), (int, float))]
            todo.sort(key=lambda n: sum(ids[p].get("lane", 0) for p in parents[n["id"]]) / max(1, len(parents[n["id"]])))
            lane = 0
            for n in todo:
                while any(abs(lane - t) < 1 for t in taken):
                    lane += 1
                n["lane"] = lane
                taken.add(lane)
                filled += 1
    return filled


# ------------------------------------------------------------------ build

def normalise(flow):
    """Spell out the default ports so the page never has to guess."""
    for c in flow.get("canvases") or []:
        local = {n.get("id"): n for n in c.get("nodes") or []}
        for e in c.get("edges") or []:
            a, b = local.get(e.get("from")), local.get(e.get("to"))
            if a and "out" not in e:
                e["out"] = first_out(a)
            if b and "in" not in e and b.get("type") in TYPES and inputs_of(b):
                e["in"] = inputs_of(b)[0]["id"]
        for r in c.get("runs") or []:
            for s in r.get("steps") or []:
                if "out" not in s:
                    s["out"] = first_out(local.get(s.get("node")))
    flow.get("source", {}).pop("root", None)


# The Artifact host wraps page.html in a skeleton like this one; preview.html lets a local look match it.
PREVIEW = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
body{{margin:0;font:14px system-ui,sans-serif;background:#fafafa}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head><body>
{page}
</body></html>
"""


def render(flow):
    template = TEMPLATE.read_text(encoding="utf-8")
    for mark in ("__PAGE_TITLE__", "/*FLOW_JSON*/", "<!--HLJS_LANGS-->"):
        if template.count(mark) != 1:
            raise RuntimeError(f"template must hold {mark} exactly once")
    data = json.dumps(flow, ensure_ascii=False, separators=(",", ":"))
    for a, b in (("<", "\\u003c"), (">", "\\u003e"), ("&", "\\u0026"), (" ", "\\u2028"), (" ", "\\u2029")):
        data = data.replace(a, b)
    langs = sorted({cr.get("lang") for c in flow["canvases"] for n in c["nodes"] for cr in n.get("code") or []} & HLJS_EXTRA)
    tags = "\n".join(f'<script src="{HLJS.format(l)}"></script>' for l in langs)
    return (template.replace("__PAGE_TITLE__", html.escape(flow.get("pageTitle", "Explain")))
            .replace("/*FLOW_JSON*/", data).replace("<!--HLJS_LANGS-->", tags))


def process(flow, rep, do_layout=False, base=None):
    """Check and fill a flow in memory. Returns the built flow, or None when errors remain.

    base is the folder a relative source.root is read from: the folder that holds flow.json.
    """
    built = copy.deepcopy(flow)
    if do_layout:
        layout(built)
    concept = not (built.get("source") or {}).get("root")
    validate(built, rep, concept)
    screen_text(built, rep)
    if not concept and not rep.errors:
        fill_code(built, rep, base)
    if rep.errors:
        return None
    normalise(built)
    return built


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="Build an /explain-n8n page from flow.json.")
    ap.add_argument("flow")
    ap.add_argument("--check", action="store_true", help="check only, write nothing")
    ap.add_argument("--layout", action="store_true", help="fill missing col/lane and write them back to flow.json")
    ap.add_argument("--out", help="output folder (default: beside flow.json)")
    a = ap.parse_args()
    src = Path(a.flow)
    rep = Report()
    try:
        flow = json.loads(src.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"E_JSON  {src.name}: line {e.lineno}, column {e.colno}: {e.msg}")
        return 1
    if a.layout:
        n = layout(flow)
        src.write_text(json.dumps(flow, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"layout: filled {n} col/lane value(s) in {src.name}")
    built = process(flow, rep, base=src.resolve().parent)
    for w in rep.warnings:
        print(w)
    for e in rep.errors:
        print(e)
    nodes = sum(len(c.get("nodes") or []) for c in flow.get("canvases") or [])
    assumed = sum(1 for c in flow.get("canvases") or [] for n in c.get("nodes") or [] if n.get("assumed"))
    counts = f"{len(flow.get('canvases') or [])} canvases, {nodes} nodes, {assumed} assumed"
    if built is None:
        print(f"build: {len(rep.errors)} error(s), {len(rep.warnings)} warning(s) · {counts} · nothing written")
        return 1
    if a.check:
        print(f"check: clean, {len(rep.warnings)} warning(s) · {counts}")
        return 0
    page = render(built)
    size = len(page.encode("utf-8"))
    if size > LIMITS["page_max"]:
        print(f"E_LIMIT  page: {size // 1000} KB, the limit is {LIMITS['page_max'] // 1000} KB")
        return 1
    if size > LIMITS["page_warn"]:
        print(f"W_SIZE  page: {size // 1000} KB; above {LIMITS['page_warn'] // 1000} KB loads slowly on a phone")
    out = Path(a.out) if a.out else src.parent
    out.mkdir(parents=True, exist_ok=True)
    (out / "flow.built.json").write_text(json.dumps(built, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out / "page.html").write_text(page, encoding="utf-8")
    (out / "preview.html").write_text(PREVIEW.format(page=page), encoding="utf-8")
    print(f"built {out / 'page.html'} ({size // 1000} KB) · {counts} · {len(rep.warnings)} warning(s)")
    print(f"local look: serve {out} and open preview.html (page.html is what gets published)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
