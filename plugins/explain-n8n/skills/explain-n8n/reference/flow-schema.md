# flow.json · schema `explain-flow/1`

Read this every `/explain-n8n` run before writing `flow.json`. `build.py` enforces every rule marked
**error**; a **warning** is worth fixing but does not stop the build.

## Shape

```ts
type Flow = {
  schema: "explain-flow/1";
  title: string;                 // header H1, <= 80
  pageTitle: string;             // <title> and gallery name: 2 to 4 words, a name, never "X: explainer"
  summary: string;               // 2 to 4 plain sentences
  takeaway: string;              // one sentence; also goes in the chat reply
  source: { repo: string;        // shown in the header, e.g. "my-app" or "my-app · billing service"
            root?: string;       // folder the code refs are relative to; omit for a concept page.
                                 // Absolute, starting with ~, or relative to the folder that holds
                                 // flow.json (e.g. "../src"). Never published: build.py drops it.
            readFiles: string[]; // every file read while building the page
            branch?, commit?, dirty? };          // filled by build.py, never by hand
  entry: CanvasId;               // the canvas shown first
  canvases: Canvas[];            // 1..10
  glossary: Term[];              // every [[Term]] used must exist here
  outOfScope?: string[];         // what the page deliberately leaves out
};
type Canvas = { id: CanvasId;    // ^[a-z][a-z0-9-]{0,30}$
  title: string; intro: string;
  nodes: Node[];                 // 1..20 (warning above 12)
  edges: Edge[]; stickies?: Sticky[];
  tour: TourStep[];              // <= nodes + 4
  runs?: Run[] };                // <= 4
type Node = {
  id: NodeId;                    // ^[a-z][a-z0-9-]{0,40}$, unique across the whole page
  type: "trigger"|"action"|"decision"|"loop"|"merge"|"data"|"external"|"ai"|"wait"|"subflow"|"end";
  name: string;                  // <= 40, what the step does in a few words
  subtitle?: string;             // <= 40, e.g. the command, file or endpoint
  icon?: IconName;               // default per type, list below
  col: number;                   // 0..7, whole numbers
  lane: number;                  // -2..5, steps of 0.5
  inputs?: Port[];               // default [{id:"main"}]; trigger []; merge [{id:"in1"},{id:"in2"}]
  outputs?: Port[];              // default [{id:"main"}]; loop [{id:"done"},{id:"loop"}]; end []
                                 // decision: required, at least 2 (yes/no, or one per Switch case)
  errorOutput?: boolean;         // adds a red "error" output
  subflow?: CanvasId;            // required when type is "subflow", forbidden otherwise
  assumed?: { why: string };     // not read in code: dashed border
  disabled?: { why: string };    // switched off or a dead path: greyed
  explain: { what: string;       // <= 200
             why: string;
             how: string[];      // 1..8 steps
             n8n?: string;       // the n8n node it behaves like, and how
             gotchas?: string[] };// 0..6
  code?: CodeRef[];              // 0..4; required unless assumed, type end, or a concept page
  data?: { input?: Json; output?: Json; note?: string };   // made up, <= 2 KB each
};
type Port = { id: string; label?: string /* <= 12 */ };
type CodeRef = { file: string;   // relative to source.root, forward slashes
  lines: [number, number];       // first and last line, span <= 40
  symbol?: string;               // text that must appear in those lines (build.py checks it)
  note?: string };               // snippet, lang, changed, redacted: build.py only
type Edge = { from: NodeId; out?: string; to: NodeId; in?: string;
  kind?: "main"|"error"|"async"; label?: string /* <= 30 */ };
type Sticky = { col: number; lane: number; w: number; h: number;     // w and h in columns and lanes
  color?: "yellow"|"blue"|"green"|"pink"|"grey"; text: string };
type TourStep = { node?: NodeId; title: string /* <= 60 */; text: string /* <= 600 */ };
type Run = { id: string; name: string; steps: RunStep[] };
type RunStep = { node: NodeId; out?: string; items?: number; note?: string;
  data?: { input?: Json; output?: Json } };
type Term = { term: string; plain: string; example?: string; n8n?: string };
```

**Markup** in any text field: `**bold**`, `` `code` ``, `[[Term]]` (opens the glossary), `[[#node-id]]`
(jumps to that node, on any canvas), and line breaks. Nothing else; HTML is shown as text.

## Rules that shape a good page

- **One canvas reads in one look.** 6 to 12 nodes; detail goes into a `subflow` node with its own
  canvas (3 levels at most). The main canvas is the story; sub-workflows are the "how".
- **Layout.** `col` is the step order left to right; `lane` stacks branches (0 the main path, 1 and
  up below, negative above). Nodes in one column sit at least one lane apart. A merge between two
  branches can use a half lane. `build.py --layout` fills any missing `col`/`lane` and writes them
  back; read them and adjust.
- **Edges.** Say `out` whenever the source has more than one output. An edge back to an earlier
  column is a loop: point it at a `loop` node, or give it a `label` that says why it goes back.
- **Decision outputs** are named by what they mean (`yes`/`no`, `match`/`problem`); every output
  leads somewhere, or carries the label `"unused"`.
- **Runs** are example scenarios, one per interesting path (happy path, the retry, the failure).
  Each step must be reachable from an earlier step through the `out` it took; a loop or a Switch
  that sends items several ways appears once per way, with `items` counts.
- **Tour** steps follow the story, one per node plus up to four without a node (an opening idea,
  a summary). Every node should be in the tour.
- **Code refs** point at the lines that do the step: 3 to 15 lines is ideal, 40 the limit. Give a
  `symbol` so a moved line fails the build instead of showing the wrong code.
- **Example data** is invented and short. Never a real person, address, phone, email (use
  `@example.com`), account or ID. Paths use `C:/Users/you/...`.
- **Text** is plain, written to the reader ("you"). A term the reader may not know goes in the
  glossary and is linked once.

## Icons

zap, play, git-branch, repeat, merge, database, globe, sparkles, clock, layers, flag, file, mail,
terminal, code, folder, check, x, search, filter, send, download, upload, key, lock, user, calendar,
bell, cpu, server, table, list, trash, edit, shield, link, image, message, refresh, film,
hard-drive, copy, hash. Defaults: trigger zap, action play, decision git-branch, loop repeat, merge
merge, data database, external globe, ai sparkles, wait clock, subflow layers, end flag.

## What build.py reports

| Code | Meaning |
|---|---|
| E_JSON | flow.json does not parse (line and column given) |
| E_SCHEMA, E_FIELD | wrong schema, a field missing, empty or of the wrong kind, an unknown icon |
| E_DUP_ID | two canvases, nodes or glossary terms share an id |
| E_REF | an edge, tour or run step names a node not on that canvas; a bad `entry` |
| E_PORT | an output or input that does not exist; an edge from a multi-output node without `out` |
| E_LAYOUT, E_LANE | col or lane missing or out of range; two nodes overlapping in a column |
| E_DECISION | a decision with fewer than 2 outputs, or an output that leads nowhere |
| E_SUBFLOW, E_DEPTH | a bad subflow target, a loop of sub-workflows, more than 3 levels |
| E_EXPLAIN | what, why or how missing |
| E_CODE | no code ref, `source.root` not a folder, a file outside root or missing, lines out of range, symbol not found |
| E_RUN | a run step that cannot be reached, or a missing `out` on a multi-output step |
| E_LINK | `[[...]]` pointing at nothing |
| E_LIMIT | any size limit |
| E_SECRET | a token-shaped secret in text or data (the value is never printed); see below |
| E_PII | personal data in text or example data |
| E_TITLE | pageTitle not 2 to 4 words |
| W_BIG, W_SKIP, W_BACKEDGE, W_ORPHAN, W_TOUR, W_NORUN, W_STRAY, W_NO_TRIGGER, W_SIZE | readability hints |
| W_REDACTED | a secret or personal value in real code was replaced by `<redacted>` |
| W_DIRTY, W_NOGIT | the code has uncommitted changes, or is not in git |

**Secrets and personal data.** `build.py` needs no extra files for these checks. E_SECRET looks for
these token shapes: GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`, `github_pat_`), Anthropic
keys (`sk-ant-`), OpenAI-style keys (`sk-`), AWS access key ids (`AKIA`, `ASIA`), Slack tokens
(`xoxa-`, `xoxb-`, `xoxp-`, `xoxr-`), Google API keys (`AIza`), private key blocks
(`-----BEGIN ... PRIVATE KEY-----`) and JWTs (`eyJ...`). E_PII looks for email addresses (other
than `@example.com`, `.org`, `.net`), phone numbers, IBANs, card numbers (Luhn-checked) and
Emirates ID numbers. In the text you write, a hit is an error. In code copied from the real files,
the value is replaced by `<redacted>` and W_REDACTED says how many. A shape check is a safety net,
not a guarantee: a secret with no known shape is not caught, so never read secret files at all.
