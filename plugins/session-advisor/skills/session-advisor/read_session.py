#!/usr/bin/env python3
"""Read another Claude Code session's log, read only, for the session-advisor skill.

    python3 read_session.py list  <project-dir> [--skip ID]          the project's sessions, newest first
    python3 read_session.py read  <project-dir> <ID> [--since T] [--width N]
    python3 read_session.py open  <project-dir> <ID>                 questions asked and not yet answered

<project-dir> is the project's folder. Its logs are found under ~/.claude/projects (or $CLAUDE_CONFIG_DIR/projects) by
Claude Code's folder naming, matched without regard to case. <ID> may be the first characters of a session id.
--since takes a local time today (14:05) or an ISO time in UTC (2026-10-29T12:00). Times printed are local.

It never writes anything. Its output is UTF-8 whatever the console's own encoding.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECTS = Path(os.environ.get("CLAUDE_CONFIG_DIR") or Path.home() / ".claude") / "projects"


def local(ts: str) -> str:
    if not ts:
        return "--:--"
    return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone().strftime("%d %b %H:%M")


def project_logs(project: str) -> Path:
    want = "".join(c if c.isalnum() else "-" for c in project.rstrip("\\/")).lower()
    for d in PROJECTS.iterdir():
        if d.is_dir() and d.name.lower() == want:
            return d
    sys.exit(f"no log folder for {project} under {PROJECTS} (looked for {want})")


def rows_of(path: Path) -> list:
    out = []
    for line in path.open(encoding="utf-8"):
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue  # a line still being written
    return out


def find(folder: Path, sid: str) -> Path:
    hits = sorted(folder.glob(sid + "*.jsonl"))
    if len(hits) != 1:
        sys.exit(f"{len(hits)} logs match {sid!r} in {folder}")
    return hits[0]


def context_of(rows: list) -> int:
    for r in reversed(rows):
        u = (r.get("message") or {}).get("usage")
        if u:
            return u.get("input_tokens", 0) + u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0)
    return 0


def first_prompt(rows: list) -> str:
    for r in rows:
        c = (r.get("message") or {}).get("content") if r.get("type") == "user" else None
        texts = [c] if isinstance(c, str) else [b["text"] for b in c or [] if b.get("type") == "text"]
        for t in texts:
            t = t.strip()
            if t.startswith("<pasted_content"):
                t = t.split(">", 1)[-1].strip()
            if t and not t.startswith(("<", "Base directory")):
                return t
    return ""


def since_utc(arg: str) -> str:
    if "T" in arg:
        return arg
    hh, mm = map(int, arg.split(":"))
    mark = datetime.now().astimezone().replace(hour=hh, minute=mm, second=0, microsecond=0)
    return mark.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


def cmd_list(folder: Path, skip: str) -> None:
    logs = sorted(folder.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    for p in logs[:12]:
        if skip and p.name.startswith(skip):
            continue
        rows = rows_of(p)
        last = next((r.get("timestamp") for r in reversed(rows) if r.get("timestamp")), "")
        print(f"{p.stem[:8]}  last {local(last)}  context {context_of(rows):>9,}  {first_prompt(rows)[:110]!r}")


def cmd_read(path: Path, since: str, width: int) -> None:
    rows = rows_of(path)
    for r in rows:
        ts = r.get("timestamp") or ""
        if since and ts < since:
            continue
        content = (r.get("message") or {}).get("content")
        if r.get("type") == "assistant" and isinstance(content, list):
            for b in content:
                if b.get("type") == "text":
                    print(f"\n[{local(ts)}] SAYS\n{b['text']}")
                elif b.get("type") == "tool_use" and b.get("name") == "AskUserQuestion":
                    print(f"\n[{local(ts)}] ASKS\n{json.dumps(b.get('input'), ensure_ascii=False, indent=1)}")
                elif b.get("type") == "tool_use":
                    print(f"[{local(ts)}] tool {b.get('name')} {json.dumps(b.get('input'), ensure_ascii=False)[:width]}")
        elif r.get("type") == "user":
            blocks = [{"type": "text", "text": content}] if isinstance(content, str) else (content or [])
            for b in blocks:
                if b.get("type") == "text" and not b["text"].startswith(("<system", "<task-notification", "Base directory")):
                    print(f"\n[{local(ts)}] PERSON SAYS\n{b['text'][:4 * width]}")
                elif b.get("type") == "tool_result":
                    c = b.get("content")
                    s = c if isinstance(c, str) else json.dumps(c, ensure_ascii=False)
                    if "questions have been answered" in s:
                        print(f"\n[{local(ts)}] PERSON ANSWERED\n{s}")
                    elif b.get("is_error"):
                        print(f"[{local(ts)}] ERROR {s[:width]}")
    print(f"\ncontext now {context_of(rows):,} tokens")


def cmd_open(path: Path) -> None:
    asked, answered = {}, set()
    for r in rows_of(path):
        content = (r.get("message") or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if b.get("type") == "tool_use" and b.get("name") == "AskUserQuestion":
                asked[b["id"]] = (r.get("timestamp") or "", b.get("input"))
            elif b.get("type") == "tool_result":
                answered.add(b.get("tool_use_id"))
    waiting = [(ts, q) for i, (ts, q) in asked.items() if i not in answered]
    if not waiting:
        print("no question waiting")
    for ts, q in waiting:
        print(f"[{local(ts)}] WAITING\n{json.dumps(q, ensure_ascii=False, indent=1)}")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    opts = {a: args[i + 1] for i, a in enumerate(args) if a.startswith("--") and i + 1 < len(args)}
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or not args[i - 1].startswith("--"))]
    if len(pos) < 2 or pos[0] not in ("list", "read", "open"):
        sys.exit(__doc__)
    folder = project_logs(pos[1])
    if pos[0] == "list":
        cmd_list(folder, opts.get("--skip", ""))
    elif pos[0] == "read":
        cmd_read(find(folder, pos[2]), since_utc(opts["--since"]) if "--since" in opts else "", int(opts.get("--width", 200)))
    else:
        cmd_open(find(folder, pos[2]))


if __name__ == "__main__":
    main()
