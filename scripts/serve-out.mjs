import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, extname, normalize, sep, relative } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "out");
const preferredPort = Number(process.env.PORT) || 3000;
const maxAttempts = 10;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function resolvePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname === "/") pathname = "/index.html";
  else if (pathname.endsWith("/")) pathname += "index.html";

  const relativePath = pathname.replace(/^\//, "").replace(/\//g, sep);
  let filePath = normalize(join(root, relativePath));

  if (existsSync(filePath) && !extname(filePath)) {
    const withIndex = join(filePath, "index.html");
    if (existsSync(withIndex)) filePath = withIndex;
  }

  const rel = relative(root, filePath);
  if (rel.startsWith("..") || normalize(rel).startsWith("..")) return null;
  return filePath;
}

async function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const data = await readFile(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(data);
}

const requestHandler = async (req, res) => {
  try {
    const rawUrl = req.url?.split("?")[0] ?? "/";

    if (rawUrl === "/deneme") {
      res.writeHead(301, { Location: "/deneme/" });
      res.end();
      return;
    }

    const filePath = resolvePath(rawUrl);

    if (!filePath || !existsSync(filePath)) {
      const fallback = join(root, "404.html");
      if (existsSync(fallback)) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(await readFile(fallback));
        return;
      }
      res.writeHead(404).end("Not Found");
      return;
    }

    await sendFile(res, filePath);
  } catch {
    res.writeHead(500).end("Internal Server Error");
  }
};

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = createServer(requestHandler);
    server.once("error", reject);
    server.once("listening", () => resolve({ server, port }));
    server.listen(port);
  });
}

if (!existsSync(root)) {
  console.error('Hata: "out" klasörü yok. Önce "npm run build" çalıştırın.');
  process.exit(1);
}

let boundPort = null;
for (let i = 0; i < maxAttempts; i++) {
  const port = preferredPort + i;
  try {
    await tryListen(port);
    boundPort = port;
    break;
  } catch (err) {
    if (err.code !== "EADDRINUSE" || i === maxAttempts - 1) {
      console.error(
        `Hata: ${preferredPort}–${preferredPort + maxAttempts - 1} portları dolu.`
      );
      console.error("Arka plandaki süreci kapatın veya: $env:PORT=3005; npm start");
      console.error("Günlük geliştirme: npm run dev");
      process.exit(1);
    }
  }
}

if (boundPort !== preferredPort) {
  console.warn(`⚠ Port ${preferredPort} dolu — ${boundPort} kullanılıyor.`);
}
console.log(`Statik site: http://localhost:${boundPort}`);
console.log("Son değişiklikler için: npm run build && npm start");
console.log("Geliştirme modu: npm run dev");
