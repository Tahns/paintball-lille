// Aperçu local du site généré : node serve.mjs puis http://localhost:8080
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("site");
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain",
};

http
  .createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(ROOT)) file = path.join(ROOT, "404.html");
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    let status = 200;
    if (!fs.existsSync(file)) { file = path.join(ROOT, "404.html"); status = 404; }
    res.writeHead(status, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Aperçu : http://localhost:${PORT}`));
