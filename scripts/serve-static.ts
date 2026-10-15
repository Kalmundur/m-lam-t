// Serves the static export in out/, the same way a static host would, for local
// previews and the end-to-end tests. Run `npm run build` first.
//
//   npm run serve                  # http://localhost:3000
//   npm run serve -- --port 3100

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { port: { type: "string", default: "3000" }, dir: { type: "string", default: "out" } },
});
const root = path.resolve(values.dir);
if (!existsSync(path.join(root, "index.html"))) {
  console.error(`No static build in ${values.dir}/. Run \`npm run build\` first.`);
  process.exit(1);
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

/** Maps /aefing to aefing.html and / to index.html, like most static hosts. */
function resolveFile(url: string): string | null {
  const urlPath = decodeURIComponent(new URL(url, "http://localhost").pathname);
  for (const candidate of [urlPath, `${urlPath}.html`, path.posix.join(urlPath, "index.html")]) {
    const file = path.join(root, candidate);
    if (!file.startsWith(root)) return null;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");
  const target = file ?? path.join(root, "404.html");
  res.writeHead(file ? 200 : 404, {
    "Content-Type": CONTENT_TYPES[path.extname(target)] ?? "application/octet-stream",
  });
  createReadStream(target).pipe(res);
}).listen(Number(values.port), () => {
  console.log(`Serving ${values.dir}/ at http://localhost:${values.port}`);
});
