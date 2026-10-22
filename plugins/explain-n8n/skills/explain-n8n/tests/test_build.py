"""Tests for the /explain-n8n build: python -m unittest discover -s tests (from the skill folder).

Bad inputs are made by changing a small valid flow in code, and fake tokens are joined from pieces
at run time, so no secret-shaped string or personal data ever sits in a file (secret scanners such
as GitHub push protection would flag it).
"""

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import build  # noqa: E402

EXAMPLES = HERE.parent / "examples"


def explain(name):
    return {"what": f"{name} does a thing.", "why": "Because the flow needs it.", "how": ["One step."]}


def base():
    """A small valid concept flow: trigger, IF, action, end."""
    nodes = [
        {"id": "t", "type": "trigger", "name": "Start", "col": 0, "lane": 0, "explain": explain("Start")},
        {"id": "d", "type": "decision", "name": "Check", "col": 1, "lane": 0, "outputs": [{"id": "yes"}, {"id": "no"}], "explain": explain("Check")},
        {"id": "a", "type": "action", "name": "Act", "col": 2, "lane": 0, "explain": explain("Act")},
        {"id": "e", "type": "end", "name": "Stop", "col": 3, "lane": 0.5, "explain": explain("Stop")},
    ]
    return {
        "schema": "explain-flow/1", "title": "A small flow", "pageTitle": "Small Test Flow",
        "summary": "A tiny flow used by the tests, with a [[Term]].", "takeaway": "It builds.",
        "source": {"repo": "concept"}, "entry": "main",
        "canvases": [{
            "id": "main", "title": "Main", "intro": "The only canvas.", "nodes": nodes,
            "edges": [{"from": "t", "to": "d"}, {"from": "d", "out": "yes", "to": "a"}, {"from": "d", "out": "no", "to": "e"}, {"from": "a", "to": "e"}],
            "tour": [{"node": n["id"], "title": n["name"], "text": "Step."} for n in nodes],
            "runs": [{"id": "r", "name": "Yes path", "steps": [{"node": "t"}, {"node": "d", "out": "yes"}, {"node": "a"}, {"node": "e"}]}],
        }],
        "glossary": [{"term": "Term", "plain": "A word."}],
    }


def run(flow, base=None):
    rep = build.Report()
    built = build.process(flow, rep, base=base)
    return built, rep


# Fake tokens of each built-in shape, joined at run time so no file holds one.
FAKE_TOKENS = {
    "github": "ghp" + "_" + "a1B2" * 9,
    "github fine-grained": "github" + "_pat_" + "11ABCDEFG0" * 3,
    "anthropic": "sk" + "-ant-" + "api03-" + "x" * 30,
    "openai": "sk" + "-proj-" + "Ab3" * 10,
    "aws": "AK" + "IA" + "ABCDEFGHIJ234567",
    "slack": "xo" + "xb-" + "1234567890-abcdefghij",
    "google": "AI" + "za" + "Sy" + "A" * 33,
    "private key": "-----BEGIN " + "RSA PRIVATE" + " KEY-----\nMIIEow\n-----END " + "RSA PRIVATE" + " KEY-----",
    "jwt": "ey" + "J" + "hbGciOiJIUzI1NiJ9" + ".ey" + "J" + "zdWIiOiIxMjM0In0" + "." + "abcdefghijklmnop",
}


class Examples(unittest.TestCase):
    def test_sample_builds_from_real_code(self):
        built, rep = run(json.loads((EXAMPLES / "sample-flow.json").read_text(encoding="utf-8")), base=EXAMPLES)
        self.assertEqual(rep.errors, [])
        snippets = [cr for c in built["canvases"] for n in c["nodes"] for cr in n.get("code") or []]
        self.assertTrue(snippets and all(cr["snippet"] for cr in snippets))
        self.assertTrue(all(cr["lang"] == "python" for cr in snippets))
        self.assertNotIn("root", built["source"])
        page = build.render(built)
        self.assertIn("<title>Trim Clip Flow</title>", page)
        self.assertNotIn("/*FLOW_JSON*/", page)
        self.assertIn("-sseof", page)

    def test_sample_root_is_relative_to_the_flow_file(self):
        flow = json.loads((EXAMPLES / "sample-flow.json").read_text(encoding="utf-8"))
        self.assertFalse(Path(flow["source"]["root"]).is_absolute())
        built, rep = run(flow, base=EXAMPLES / "missing-folder")
        self.assertIsNone(built)
        self.assertTrue(any(e.startswith("E_CODE  source.root") for e in rep.errors), rep.errors)

    def test_stress_builds_with_its_warnings(self):
        built, rep = run(json.loads((EXAMPLES / "stress-flow.json").read_text(encoding="utf-8")))
        self.assertEqual(rep.errors, [])
        joined = "\n".join(rep.warnings)
        for code in ("W_BIG", "W_SKIP", "W_TOUR"):
            self.assertIn(code, joined)

    def test_base_is_clean(self):
        built, rep = run(base())
        self.assertEqual(rep.errors, [])
        self.assertEqual(rep.warnings, [])


class Errors(unittest.TestCase):
    def expect(self, code, change):
        flow = base()
        change(flow)
        built, rep = run(flow)
        self.assertIsNone(built)
        self.assertTrue(any(e.startswith(code) for e in rep.errors), f"{code} not in {rep.errors}")

    def test_dangling_edge(self):
        self.expect("E_REF", lambda f: f["canvases"][0]["edges"].append({"from": "a", "to": "ghost"}))

    def test_secret_in_prose(self):
        for kind, token in FAKE_TOKENS.items():
            with self.subTest(kind=kind):
                self.expect("E_SECRET", lambda f: f.update(summary="Token " + token + " here."))

    def test_secret_value_is_never_printed(self):
        flow = base()
        flow["takeaway"] = "Uses " + FAKE_TOKENS["github"]
        _, rep = run(flow)
        self.assertTrue(rep.errors)
        self.assertNotIn(FAKE_TOKENS["github"], "\n".join(rep.errors + rep.warnings))

    def test_plain_words_are_not_secrets(self):
        self.assertEqual(build.find_secrets("A task-runner-for-long-hyphenated-names and a risk-assessment-checklist-item."), [])

    def test_title_words(self):
        self.expect("E_TITLE", lambda f: f.update(pageTitle="A title that is far too long"))

    def test_duplicate_node(self):
        self.expect("E_DUP_ID", lambda f: f["canvases"][0]["nodes"].append(dict(f["canvases"][0]["nodes"][2], col=4)))

    def test_decision_one_output(self):
        def change(f):
            f["canvases"][0]["nodes"][1]["outputs"] = [{"id": "yes"}]
            f["canvases"][0]["edges"] = [e for e in f["canvases"][0]["edges"] if e.get("out") != "no"]
            f["canvases"][0]["runs"] = []
        self.expect("E_DECISION", change)

    def test_decision_output_leads_nowhere(self):
        self.expect("E_DECISION", lambda f: f["canvases"][0].update(edges=[e for e in f["canvases"][0]["edges"] if e.get("out") != "no"]))

    def test_lane_clash(self):
        self.expect("E_LANE", lambda f: f["canvases"][0]["nodes"][2].update(col=1, lane=0.5))

    def test_personal_email(self):
        self.expect("E_PII", lambda f: f["canvases"][0]["nodes"][2].update(data={"input": {"to": "someone" + "@company.test"}}))

    def test_missing_how(self):
        self.expect("E_EXPLAIN", lambda f: f["canvases"][0]["nodes"][2]["explain"].pop("how"))

    def test_unreachable_run_step(self):
        self.expect("E_RUN", lambda f: f["canvases"][0]["runs"][0]["steps"].insert(1, {"node": "a"}))

    def test_unknown_term(self):
        self.expect("E_LINK", lambda f: f.update(summary="See [[Nowhere]]."))

    def test_code_on_concept_page(self):
        self.expect("E_CODE", lambda f: f["canvases"][0]["nodes"][2].update(code=[{"file": "x.py", "lines": [1, 2]}]))

    def test_subflow_loop(self):
        def change(f):
            sub = {"id": "sub", "title": "Sub", "intro": "Loops back.", "nodes": [
                {"id": "s", "type": "subflow", "subflow": "main", "name": "Back", "col": 0, "lane": 0, "explain": explain("Back")}], "edges": [], "tour": []}
            f["canvases"].append(sub)
            f["canvases"][0]["nodes"].append({"id": "go", "type": "subflow", "subflow": "sub", "name": "Go", "col": 4, "lane": 0, "explain": explain("Go")})
        self.expect("E_SUBFLOW", change)

    def test_too_deep(self):
        def change(f):
            for i in range(1, 4):
                nxt = f"l{i + 1}"
                f["canvases"].append({"id": f"l{i}", "title": f"Level {i}", "intro": "Down.", "edges": [], "tour": [], "nodes": [
                    {"id": f"n{i}", "type": "subflow" if i < 3 else "action", "name": f"Level {i}", "col": 0, "lane": 0, "explain": explain("Down"),
                     **({"subflow": nxt} if i < 3 else {})}]})
            f["canvases"][-1]["nodes"][0].pop("subflow", None)
            f["canvases"].append({"id": "l4", "title": "Level 4", "intro": "Bottom.", "edges": [], "tour": [], "nodes": [
                {"id": "n4", "type": "action", "name": "Bottom", "col": 0, "lane": 0, "explain": explain("Bottom")}]})
            f["canvases"][3]["nodes"][0].update(type="subflow", subflow="l4")
            f["canvases"][0]["nodes"].append({"id": "go", "type": "subflow", "subflow": "l1", "name": "Go", "col": 4, "lane": 0, "explain": explain("Go")})
        self.expect("E_DEPTH", change)


class Build(unittest.TestCase):
    def test_layout_fills_missing_places(self):
        flow = base()
        for n in flow["canvases"][0]["nodes"]:
            n.pop("col"), n.pop("lane")
        self.assertEqual(build.layout(flow), 8)
        cols = {n["id"]: n["col"] for n in flow["canvases"][0]["nodes"]}
        self.assertEqual(cols, {"t": 0, "d": 1, "a": 2, "e": 3})
        self.assertEqual(run(flow)[1].errors, [])

    def test_script_text_cannot_escape_the_data_block(self):
        flow = base()
        flow["canvases"][0]["nodes"][2]["data"] = {"output": {"html": "</script><script>alert(1)</script>"}}
        built, rep = run(flow)
        self.assertEqual(rep.errors, [])
        page = build.render(built)
        data = page.split('<script id="flow-data" type="application/json">', 1)[1].split("</script>", 1)[0]
        self.assertNotIn("<", data)
        self.assertEqual(json.loads(data)["canvases"][0]["nodes"][2]["data"]["output"]["html"], "</script><script>alert(1)</script>")

    def test_defaults_are_spelled_out(self):
        built, _ = run(copy.deepcopy(base()))
        edge = built["canvases"][0]["edges"][0]
        self.assertEqual((edge["out"], edge["in"]), ("main", "main"))

    def code_flow(self, root, lines):
        flow = base()
        flow["source"] = {"repo": "test", "root": root, "readFiles": ["app.py"]}
        for n in flow["canvases"][0]["nodes"]:
            if n["type"] != "end":
                n["code"] = [{"file": "app.py", "lines": [1, lines]}]
        return flow

    def test_relative_root_and_secrets_in_code_are_redacted(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "src"
            src.mkdir()
            (src / "app.py").write_text("KEY = '" + FAKE_TOKENS["aws"] + "'\nprint(KEY)\n", encoding="utf-8")
            flows = Path(tmp) / "flows"
            flows.mkdir()
            built, rep = run(self.code_flow("../src", 2), base=flows)
            self.assertEqual(rep.errors, [])
            snippet = built["canvases"][0]["nodes"][0]["code"][0]["snippet"]
            self.assertNotIn(FAKE_TOKENS["aws"], snippet)
            self.assertIn("KEY = '<redacted>'", snippet)
            self.assertTrue(any(w.startswith("W_REDACTED") for w in rep.warnings))

    def test_absolute_root_still_works(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "app.py").write_text("print('hello')\nprint('bye')\n", encoding="utf-8")
            built, rep = run(self.code_flow(str(Path(tmp).resolve()), 2), base=Path(tmp) / "elsewhere")
            self.assertEqual(rep.errors, [])
            self.assertIn("hello", built["canvases"][0]["nodes"][0]["code"][0]["snippet"])


if __name__ == "__main__":
    unittest.main()
