// Génère site-demo/ : une maquette de démonstration du site, avec nom, adresse et
// coordonnées fictifs, pages à plat et liens relatifs, pour la montrer sans qu'elle
// puisse passer pour le vrai site. À lancer après node build.mjs.
import fs from "node:fs";
import path from "node:path";

const IN = "site";
const OUT = "site-demo";
const DEMO_NAME = "Paintball Démo";

const replacements = [
  ["Paintball <em>Lille</em>", "Paintball <em>Démo</em>"],
  ["Paintball Lille", DEMO_NAME],
  ["https://www.paintball-lille.fr", "https://example.com"],
  ["Impasse Jean Jaurès", "1 chemin de l'Exemple"],
  ["59175", "59000"],
  ["Vendeville", "Villedémo"],
  ["06 65 62 66 54", "06 39 98 00 01"],
  ["+33665626654", "+33639980001"],
  ["07 66 63 34 60", "06 39 98 00 02"],
  ["+33766633460", "+33639980002"],
  ["paintball.lille@gmail.com", "contact@example.com"],
  ["https://www.facebook.com/paintball.lille", "#"],
  ["https://www.instagram.com/paintball.lille/", "#"],
  ["https://www.tiktok.com/@paintball.lille", "#"],
];

const banner = `<div style="background:#e0312b;color:#fff;text-align:center;font:600 14px/1.4 system-ui,sans-serif;padding:8px 16px">Maquette de démonstration : nom, adresse, numéros et e-mail sont fictifs.</div>`;

// /paintball/?x → paintball.html?x ; / → index.html ; /assets/… → assets/…
function relink(html) {
  return html
    .replace(/(href|src)="\/assets\//g, '$1="assets/')
    .replace(/href="\/([?#][^"]*)?"/g, (_, rest = "") => `href="index.html${rest}"`)
    .replace(/href="\/([a-z0-9-]+)\/([?#][^"]*)?"/g, (_, slug, rest = "") => `href="${slug}.html${rest}"`);
}

function demoize(html) {
  for (const [from, to] of replacements) html = html.split(from).join(to);
  return relink(html)
    .replace(/href="https:\/\/www\.google\.com\/maps[^"]*"/g, 'href="#"')
    .replace(/<meta property="og:image"[^>]*>\n?/, "")
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">')
    .replace('id="booking-form"', 'id="booking-form" data-demo="1"')
    .replace(/<body>\n?/, (m) => m + banner + "\n");
}

// La page d'accueil est publiée comme page principale de l'artifact : le squelette
// <!doctype>/<html>/<head>/<body> est ajouté à la publication, on le retire ici.
function stripSkeleton(html) {
  return html
    .replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, "")
    .replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, "")
    .replace(/<\/head>\s*<body>\s*/, "\n")
    .replace(/\s*<\/body>\s*<\/html>\s*$/, "\n");
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "assets/css"), { recursive: true });
fs.mkdirSync(path.join(OUT, "assets/js"), { recursive: true });
fs.mkdirSync(path.join(OUT, "assets/img"), { recursive: true });

// Pages, à plat
const pages = [];
for (const entry of fs.readdirSync(IN, { withFileTypes: true })) {
  let src, name;
  if (entry.isDirectory() && fs.existsSync(path.join(IN, entry.name, "index.html"))) {
    src = path.join(IN, entry.name, "index.html");
    name = `${entry.name}.html`;
  } else if (entry.isFile() && entry.name.endsWith(".html")) {
    src = path.join(IN, entry.name);
    name = entry.name;
  } else continue;
  let html = demoize(fs.readFileSync(src, "utf8"));
  if (name === "index.html") html = stripSkeleton(html);
  fs.writeFileSync(path.join(OUT, name), html);
  pages.push(name);
}

// CSS : polices intégrées en data URI, chemins relatifs
let css = fs.readFileSync(path.join(IN, "assets/css/style.css"), "utf8");
css = css.replace(/url\("\/assets\/fonts\/([^"]+)"\)/g, (_, f) => {
  const b64 = fs.readFileSync(path.join(IN, "assets/fonts", f)).toString("base64");
  return `url("data:font/woff2;base64,${b64}")`;
});
css = css.replace(/url\("\/assets\//g, 'url("../');
fs.writeFileSync(path.join(OUT, "assets/css/style.css"), css);

fs.copyFileSync(path.join(IN, "assets/js/main.js"), path.join(OUT, "assets/js/main.js"));
for (const f of ["logo.svg", "favicon.svg"]) {
  fs.copyFileSync(path.join(IN, "assets/img", f), path.join(OUT, "assets/img", f));
}

// Les polices sont déjà dans le CSS : on retire leurs préchargements.
for (const name of pages) {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/<link rel="preload"[^>]*>\n?/g, ""));
}

console.log(`Maquette générée dans ${OUT}/ (${pages.length} pages)`);
