// Génère le site statique dans site/ à partir de src/.
// Aucune dépendance : node build.mjs
import fs from "node:fs";
import path from "node:path";

const SRC = "src";
const OUT = "site";
const site = JSON.parse(fs.readFileSync(path.join(SRC, "data/site.json"), "utf8"));
const layout = fs.readFileSync(path.join(SRC, "layout.html"), "utf8");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const addressLine = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Paintball Lille ${addressLine}`)}`;

// ---------- Composants réutilisables ----------

const phoneLink = (key, cls = "") => {
  const p = site.phones[key];
  return `<a class="${cls}" href="tel:${p.tel}">${p.display}</a>`;
};

function priceCards(key) {
  const t = site.tarifs[key];
  const cards = t.items
    .map((it) => {
      const promo = it.promo && site.promo.active;
      const price = promo
        ? `<span class="price__old">${it.price}</span><span class="price__now">${it.promo}</span>`
        : `<span class="price__now">${it.price}</span>`;
      const includes = it.includes
        ? `<ul class="card__list">${it.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
        : "";
      return `
      <article class="price-card${it.featured ? " price-card--featured" : ""}">
        ${it.featured ? '<span class="badge">Le plus choisi</span>' : ""}
        ${promo ? `<span class="badge badge--promo">${esc(site.promo.title)}</span>` : ""}
        <h3 class="price-card__name">${esc(it.name)}</h3>
        <p class="price">${price}<span class="price__unit">/ pers.</span></p>
        ${it.priceNote ? `<p class="price-card__note">${esc(it.priceNote)}</p>` : ""}
        <ul class="price-card__facts">
          <li>${esc(it.balls)}</li>
          <li>${esc(it.duration)}</li>
        </ul>
        ${includes}
      </article>`;
    })
    .join("");
  return `
  <div class="price-block">
    <div class="price-block__head">
      <h3 class="price-block__title">${esc(t.title)}</h3>
      <p class="price-block__sub">${esc(t.subtitle)}</p>
    </div>
    <div class="price-grid">${cards}</div>
    ${t.extra ? `<p class="price-block__extra">${esc(t.extra)}</p>` : ""}
    <p class="price-block__cta">
      <a class="btn btn--primary" href="/reservation/?activite=${key}">Réserver</a>
      <a class="btn btn--ghost" href="tel:${site.phones[t.phone].tel}">Appeler le ${site.phones[t.phone].display}</a>
    </p>
  </div>`;
}

const facilities = () =>
  `<ul class="facilities">${site.facilities.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`;

const promoBanner = () =>
  site.promo.active
    ? `<div class="promo"><div class="container promo__inner"><strong>${esc(site.promo.title)}</strong><span>${esc(site.promo.text)}</span><a href="/reservation/?activite=paintball">J'en profite</a></div></div>`
    : "";

const ctaBand = (title = "Prêts à jouer ?", text = "Choisissez votre date, on s'occupe du reste. Réponse rapide par téléphone ou par e-mail.") => `
<section class="cta-band">
  <div class="container cta-band__inner">
    <div>
      <h2 class="cta-band__title">${title}</h2>
      <p>${text}</p>
    </div>
    <div class="cta-band__actions">
      <a class="btn btn--primary btn--lg" href="/reservation/">Demander une réservation</a>
      <a class="btn btn--light" href="tel:${site.phones.adulte.tel}">${site.phones.adulte.display}</a>
    </div>
  </div>
</section>`;

function gallery() {
  const dir = path.join(SRC, "assets/photos/galerie");
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort()
    : [];
  if (!files.length) {
    return `<div class="empty-gallery">
      <p>Les photos arrivent bientôt. En attendant, retrouvez nos parties en images sur nos réseaux.</p>
      <p class="social-row">
        <a class="btn btn--dark" href="${site.social.instagram}" rel="noopener">Instagram</a>
        <a class="btn btn--dark" href="${site.social.tiktok}" rel="noopener">TikTok</a>
        <a class="btn btn--dark" href="${site.social.facebook}" rel="noopener">Facebook</a>
      </p>
    </div>`;
  }
  return `<div class="gallery">${files
    .map((f) => {
      const alt = path.parse(f).name.replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ");
      return `<a href="/assets/photos/galerie/${f}"><img src="/assets/photos/galerie/${f}" alt="${esc(alt)}" loading="lazy" decoding="async"></a>`;
    })
    .join("")}</div>`;
}

const missingLegal = new Set();
const hasHeroPhoto = fs.existsSync(path.join(SRC, "assets/photos/hero.jpg"));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: site.name,
  url: site.baseUrl + "/",
  telephone: site.phones.adulte.tel,
  email: site.email,
  priceRange: "14 € - 50 €",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.postalCode,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  sameAs: Object.values(site.social),
};

// ---------- Rendu ----------

const SPLAT_PATH =
  "M100 20C115 20 118 45 130 42C145 38 150 15 165 25C178 34 160 55 170 65C182 77 198 70 198 88C198 104 175 100 172 112C169 125 190 138 180 152C170 165 152 150 142 160C132 170 140 195 122 196C104 197 108 172 96 170C84 168 78 190 62 184C46 178 58 158 48 148C38 138 12 150 8 132C4 114 30 112 30 100C30 88 6 80 12 64C18 48 40 60 50 52C60 44 52 22 68 18C84 14 86 20 100 20Z";
const splat = (cls) =>
  `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="${SPLAT_PATH}" fill="currentColor"/><circle cx="188" cy="30" r="7" fill="currentColor"/><circle cx="20" cy="185" r="9" fill="currentColor"/><circle cx="160" cy="190" r="5" fill="currentColor"/></svg>`;

const tokens = {
  splatA: () => splat("hero__splat hero__splat--a"),
  splatB: () => splat("hero__splat hero__splat--b"),
  splatC: () => splat("hero__splat hero__splat--c"),
  splatPanel: () => splat("panel__splat"),
  year: () => String(new Date().getFullYear()),
  email: () => `<a href="mailto:${site.email}">${site.email}</a>`,
  emailRaw: () => site.email,
  address: () => esc(addressLine),
  mapsUrl: () => mapsUrl,
  hours: () => esc(site.hours),
  discount: () => esc(site.groupDiscount),
  facilities,
  promo: promoBanner,
  cta: () => ctaBand(),
  gallery,
  heroClass: () => (hasHeroPhoto ? "hero hero--photo" : "hero"),
  formEndpoint: () => esc(site.formEndpoint),
  facebook: () => site.social.facebook,
  instagram: () => site.social.instagram,
  tiktok: () => site.social.tiktok,
};

function render(str) {
  return str.replace(/\{\{\s*([\w]+)(?::([\w]+))?\s*\}\}/g, (m, name, arg) => {
    if (name === "tarifs") return priceCards(arg);
    if (name === "priceSummary")
      return site.tarifs[arg].items.map((it) => `${esc(it.balls)} ${esc(it.price)}`).join(" · ");
    if (name === "phone") return phoneLink(arg);
    if (name === "tel") return site.phones[arg].tel;
    if (name === "phoneDisplay") return site.phones[arg].display;
    if (name === "legal") {
      const v = site.legal[arg];
      if (v) return esc(v);
      missingLegal.add(arg);
      return '<span class="todo">[à compléter]</span>';
    }
    if (name === "phoneLabel") return esc(site.phones[arg].label);
    if (name === "from") {
      const nums = site.tarifs[arg].items.map((it) => parseFloat(it.price));
      return `${Math.min(...nums)} €`;
    }
    if (tokens[name]) return tokens[name]();
    throw new Error(`Balise inconnue : ${m}`);
  });
}

function parsePage(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`Métadonnées manquantes dans ${file}`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(SRC, "assets"), path.join(OUT, "assets"), { recursive: true });

const urls = [];
for (const file of fs.readdirSync(path.join(SRC, "pages")).sort()) {
  if (!file.endsWith(".html")) continue;
  const { meta, body } = parsePage(path.join(SRC, "pages", file));
  const slug = path.basename(file, ".html");
  const urlPath = slug === "index" ? "/" : slug === "404" ? "/404.html" : `/${slug}/`;
  const outFile =
    slug === "index" ? "index.html" : slug === "404" ? "404.html" : path.join(slug, "index.html");

  const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
  const pageVars = {
    content: body,
    pageTitle: esc(meta.title),
    pageDescription: esc(meta.description),
    canonical: site.baseUrl + urlPath,
    robots: meta.noindex ? "noindex" : "index, follow",
    jsonLd: ld(jsonLd) + (meta.jsonLd ? "\n" + ld(meta.jsonLd) : ""),
  };
  let html = layout
    .replace(/\{\{(content|pageTitle|pageDescription|canonical|robots|jsonLd)\}\}/g, (_, k) => pageVars[k])
    .replace(/\{\{nav:(\w+)\}\}/g, (_, k) => (k === meta.nav ? ' aria-current="page"' : ""));
  html = render(html);

  const dest = path.join(OUT, outFile);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  if (!meta.noindex) urls.push(urlPath);
}

fs.writeFileSync(
  path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.baseUrl}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`);

console.log(`Site généré dans ${OUT}/ (${urls.length} pages indexables)`);
if (missingLegal.size) {
  console.warn(`⚠ Infos légales à compléter dans src/data/site.json (legal) : ${[...missingLegal].join(", ")}`);
}
