// netlify-bot-shield: answers vulnerability-scanner probes (/.env, /.git/config, /wp-login.php ...)
// with an empty 403 before the site's own code or files are reached.
//
// It runs only on the paths listed below, never on normal pages, so real visitors never touch it.
// 403 rather than 404 keeps the probes out of Netlify's "Top resources not found" panel, and the
// empty body means they cost no bandwidth.
//
// Before adding a path, check that the site never serves a real file or page that matches it.

const botShield = () => new Response(null, { status: 403 });

export default botShield;

export const config = {
  path: [
    // Environment and secret files, at the root or in any folder: /.env, /config/.env.production
    "/*.env",
    "/*.env.*",
    "/*.aws/*",
    "/*.ssh/*",
    // Version control and editor folders
    "/*.git",
    "/*.git/*",
    "/*.svn/*",
    "/*.vscode/*",
    "/*.DS_Store",
    // WordPress and PHP (Netlify already drops some PHP scans; this covers the rest)
    "/*.php",
    "/*.php7",
    "/wp-admin/*",
    "/wp-content/*",
    "/wp-includes/*",
    "/wp-login*",
    "/xmlrpc*",
    "/phpmyadmin*",
    // Dumps and backups
    "/*.sql",
    "/*.bak",
    // Server panels of other stacks
    "/cgi-bin/*",
    "/server-status",
    "/actuator/*",
    "/vendor/*",
  ],
  onError: "bypass",
};
