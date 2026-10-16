import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { pipeline } from "node:stream";

// Serves a static export the way a static host would: /aefing → aefing.html,
// / → index.html, anything else → 404.html with status 404.

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

export function startStaticServer({ dir, port }: { dir: string; port: number }): Promise<Server> {
  const root = path.resolve(dir);
  if (!existsSync(path.join(root, "index.html"))) {
    throw new Error(`No static build in ${dir}/. Run \`npm run build\` first.`);
  }

  function resolveFile(url: string): string | null {
    const urlPath = decodeURIComponent(new URL(url, "http://localhost").pathname);
    for (const candidate of [urlPath, `${urlPath}.html`, path.posix.join(urlPath, "index.html")]) {
      const file = path.join(root, candidate);
      if (!file.startsWith(root)) return null;
      if (existsSync(file) && statSync(file).isFile()) return file;
    }
    return null;
  }

  const server = createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    const target = file ?? path.join(root, "404.html");
    res.writeHead(file ? 200 : 404, {
      "Content-Type": CONTENT_TYPES[path.extname(target)] ?? "application/octet-stream",
    });
    // pipeline (unlike pipe) closes the file if the browser aborts the request, e.g. a cancelled prefetch.
    pipeline(createReadStream(target), res, () => {});
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => resolve(server));
  });
}
