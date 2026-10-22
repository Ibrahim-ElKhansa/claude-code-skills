#!/usr/bin/env node
// Checks a site after netlify-bot-shield: every probe path must answer 403 with an empty body,
// every real page must still answer 200, and every lookalike path must not be blocked.
// Node 18 or later, no dependencies.
//
//   node probe.mjs <base-url> [--real /,/about] [--extra /old-admin/.env] [--safe /blog/my.envoy] [--json]
//
// --real   pages that must answer 200 (default: /)
// --extra  more probe paths that must answer 403
// --safe   lookalike paths that must NOT answer 403 (any other status passes)
// --full   against a live site, send every probe path anyway (see below)
//
// Against anything but localhost it is gentle by default: 4 probe paths, 1.5 seconds apart. A burst of
// scanner-looking requests is exactly what Netlify's edge protection blocks: on 2026-10-22 two full runs against
// one live site (about 60 requests in seconds) cut the sender's IP off from every Netlify-hosted site for a while.
//
// In Git Bash on Windows, run it with MSYS_NO_PATHCONV=1, or Git Bash turns "/" into a folder path.
// Exits 1 when any check fails, so it can gate a deploy.

const PROBES = [
  "/.env",
  "/.env.local",
  "/.env.production",
  "/config/.env",
  "/laravel/.env",
  "/src/.env.dev",
  "/frontend/.env.bak",
  "/.aws/credentials",
  "/.ssh/id_rsa",
  "/.git/config",
  "/app/.git/HEAD",
  "/.svn/entries",
  "/.vscode/sftp.json",
  "/.DS_Store",
  "/xmlrpc.php",
  "/info.php",
  "/wp-login.php",
  "/wp-admin/setup-config.php",
  "/wp-content/plugins/hellopress/wp_filemanager.php",
  "/wp-includes/wlwmanifest.xml",
  "/phpmyadmin/",
  "/backup.sql",
  "/db.bak",
  "/cgi-bin/test.cgi",
  "/server-status",
  "/actuator/env",
  "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
];

function parseArgs(argv) {
  const out = { base: null, real: ["/"], extra: [], safe: [], json: false, full: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--full") out.full = true;
    else if (a === "--real") out.real = argv[++i].split(",").filter(Boolean);
    else if (a === "--extra") out.extra = argv[++i].split(",").filter(Boolean);
    else if (a === "--safe") out.safe = argv[++i].split(",").filter(Boolean);
    else if (a === "--json") out.json = true;
    else if (!out.base) out.base = a.replace(/\/+$/, "");
  }
  return out;
}

async function hit(base, path) {
  try {
    const res = await fetch(base + path, { redirect: "manual", headers: { "user-agent": "netlify-bot-shield-probe" } });
    const body = await res.text();
    return { status: res.status, bytes: body.length };
  } catch (err) {
    return { status: 0, bytes: 0, error: String(err.cause?.code || err.message) };
  }
}

const args = parseArgs(process.argv.slice(2));
if (!args.base) {
  console.error("usage: node probe.mjs <base-url> [--real /,/about] [--extra /a,/b] [--safe /c,/d] [--json]");
  process.exit(2);
}

const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(args.base);
const gentle = !local && !args.full;
const GENTLE = ["/.env", "/config/.env", "/.git/config", "/wp-login.php"];
const pause = () => new Promise((r) => setTimeout(r, gentle ? 1500 : 0));
if (gentle) console.log(`live site: gentle mode, ${GENTLE.length} probe paths 1.5 s apart (--full sends all)\n`);

const rows = [];
for (const path of [...(gentle ? GENTLE : PROBES), ...args.extra]) {
  const r = await hit(args.base, path);
  rows.push({ kind: "probe", path, ...r, pass: r.status === 403 && r.bytes === 0 });
  await pause();
}
for (const path of args.real) {
  const r = await hit(args.base, path);
  rows.push({ kind: "real", path, ...r, pass: r.status === 200 });
}
for (const path of args.safe) {
  const r = await hit(args.base, path);
  rows.push({ kind: "safe", path, ...r, pass: r.status !== 0 && r.status !== 403 });
}

const failed = rows.filter((r) => !r.pass);
if (args.json) {
  console.log(JSON.stringify({ base: args.base, rows, failed: failed.length }, null, 2));
} else {
  const w = Math.max(...rows.map((r) => r.path.length));
  for (const r of rows) {
    const want = { probe: "403", real: "200", safe: "not 403" }[r.kind];
    const got = r.error ? `error ${r.error}` : `${r.status} (${r.bytes} bytes)`;
    console.log(`${r.pass ? "pass" : "FAIL"}  ${r.kind.padEnd(5)}  ${r.path.padEnd(w)}  want ${want}, got ${got}`);
  }
  console.log(`\n${rows.length - failed.length} of ${rows.length} passed against ${args.base}`);
}
process.exit(failed.length ? 1 : 0);
