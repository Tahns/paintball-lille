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
      const promo = it.promo && promoActive();
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
        <p class="price"${promo && site.promo.until ? ` data-until="${site.promo.until}" data-regular="${esc(it.price)}"` : ""}>${price}<span class="price__unit">/ pers.</span></p>
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
  promoActive()
    ? `<div class="promo"${site.promo.until ? ` data-until="${site.promo.until}"` : ""}><div class="container promo__inner"><strong>${esc(site.promo.title)}</strong><span>${esc(site.promo.text)}</span><a href="/reservation/?activite=paintball">J'en profite</a></div></div>`
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
  // Photos ajoutées depuis l'administration (site.gallery), sinon celles du dossier galerie/.
  let photos = (site.gallery || []).filter((g) => g.image).map((g) => ({ src: g.image, alt: g.alt || "" }));
  if (!photos.length) {
    const dir = path.join(SRC, "assets/photos/galerie");
    photos = (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => ({
        src: `/assets/photos/galerie/${f}`,
        alt: path.parse(f).name.replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " "),
      }));
  }
  if (!photos.length) {
    return `<div class="empty-gallery">
      <p>Les photos arrivent bientôt. En attendant, retrouvez nos parties en images sur nos réseaux.</p>
      <p class="social-row">
        <a class="btn btn--dark" href="${site.social.instagram}" rel="noopener">Instagram</a>
        <a class="btn btn--dark" href="${site.social.tiktok}" rel="noopener">TikTok</a>
        <a class="btn btn--dark" href="${site.social.facebook}" rel="noopener">Facebook</a>
      </p>
    </div>`;
  }
  return `<div class="gallery">${photos
    .map((p) => `<a href="${esc(p.src)}"><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" decoding="async"></a>`)
    .join("")}</div>`;
}

const missingLegal = new Set();

// Logo : celui choisi dans l'administration, sinon src/assets/img/logo-paintball-lille.*, sinon logo générique.
const clientLogo =
  site.images?.logo ||
  ["png", "webp", "svg", "jpg"]
    .map((ext) => `/assets/img/logo-paintball-lille.${ext}`)
    .find((f) => fs.existsSync(path.join(SRC, f)));
const logoImg = clientLogo
  ? `<img class="logo__img logo__img--client" src="${esc(clientLogo)}" alt="">`
  : `<img class="logo__img" src="/assets/img/logo.svg" alt="" width="44" height="44">`;

const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(`Paintball Lille, ${addressLine}`)}&output=embed`;

const promoActive = () =>
  site.promo.active && (!site.promo.until || new Date() <= new Date(site.promo.until + "T23:59:59"));

function reviewsSection() {
  const r = site.reviews;
  if (!r) return "";
  const cards = (r.items || [])
    .slice(0, 6)
    .map(
      (it) => `<figure class="quote">
        <p class="quote__stars" aria-label="${esc(it.rating)} sur 5">${"★".repeat(Math.round(Number(it.rating) || 5))}</p>
        <blockquote><p>${esc(it.text)}</p></blockquote>
        <figcaption>${esc(it.author)}${it.date ? ` · ${esc(it.date)}` : ""} · Avis ${esc(r.source)}</figcaption>
      </figure>`
    )
    .join("");
  return `<!--reviews--><section class="section section--white">
  <div class="container">
    <div class="reviews-head">
      <div>
        <span class="section__kicker">Avis clients</span>
        <h2>Ce qu'en disent nos joueurs</h2>
      </div>
      <a class="rating" href="${mapsUrl}" rel="noopener">
        <strong>${esc(r.rating)}<span>/5</span></strong>
        <span class="rating__stars" aria-hidden="true">★★★★★</span>
        <span>${esc(r.count)} avis ${esc(r.source)}</span>
      </a>
    </div>
    ${cards ? `<div class="grid grid--3">${cards}</div>` : ""}
    <p class="reviews-more"><a class="btn btn--dark" href="${mapsUrl}" rel="noopener">Lire tous les avis sur ${esc(r.source)}</a></p>
  </div>
</section><!--/reviews-->`;
}

const mapBlock = () => `<!--map--><div class="map-embed" data-src="${esc(mapEmbedUrl)}">
  <div class="map-embed__placeholder">
    <p>La carte est fournie par Google Maps. En l'affichant, vous acceptez que Google dépose des cookies.</p>
    <p class="map-embed__actions">
      <button class="btn btn--dark" type="button">Afficher la carte</button>
      <a class="btn btn--ghost" href="${mapsUrl}" rel="noopener">Ouvrir dans Google Maps</a>
    </p>
  </div>
</div><!--/map-->`;
const heroPhoto =
  site.images?.hero || (fs.existsSync(path.join(SRC, "assets/photos/hero.jpg")) ? "/assets/photos/hero.jpg" : "");

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

// ---------- Actualités (src/actualites/*.md, éditables depuis l'administration) ----------

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
      if (kv[2].trim().startsWith('"')) v = v.replace(/\\"/g, '"');
      else v = v.replace(/''/g, "'");
    }
    data[kv[1]] = v;
  }
  return { data, body: m[2] };
}

// Markdown simple : titres, listes, gras, italique, liens, images, paragraphes.
function markdown(md) {
  const inline = (t) =>
    esc(t)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  const out = [];
  for (const block of md.trim().split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const h = block.match(/^(#{2,4})\s+(.*)$/);
    if (h && lines.length === 1) {
      const lvl = Math.max(2, h[1].length);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
    } else if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`);
    } else if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`);
    } else {
      out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
    }
  }
  return out.join("\n");
}

const frDate = (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const NEWS_DIR = path.join(SRC, "actualites");
const news = (fs.existsSync(NEWS_DIR) ? fs.readdirSync(NEWS_DIR) : [])
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(NEWS_DIR, f), "utf8"));
    const date = new Date(data.date || fs.statSync(path.join(NEWS_DIR, f)).mtime);
    return {
      slug: path.basename(f, ".md").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      title: data.title || path.basename(f, ".md"),
      summary: data.summary || "",
      image: data.image || "",
      date,
      html: markdown(body),
      draft: data.draft === "true",
    };
  })
  .filter((n) => !n.draft && !Number.isNaN(n.date.getTime()))
  .sort((a, b) => b.date - a.date);

const newsCard = (n) => `<a class="activity activity--dark news-card" href="/actualites/${n.slug}/">
  ${n.image ? `<img class="news-card__img" src="${esc(n.image)}" alt="" loading="lazy">` : ""}
  <span class="activity__age">${frDate(n.date)}</span>
  <h3>${esc(n.title)}</h3>
  ${n.summary ? `<p>${esc(n.summary)}</p>` : ""}
  <span class="activity__more">Lire →</span>
</a>`;

// Description de page toujours assez longue, même si l'article est très court.
function newsDescription(n) {
  const text = `${n.summary} ${n.html.replace(/<[^>]+>/g, " ")}`.replace(/\s+/g, " ").trim();
  const d = text.length >= 60 ? text : `${n.title}. ${text} Actualité du terrain Paintball Lille, à 10 minutes de Lille.`;
  return d.length > 155 ? d.slice(0, 152).trimEnd() + "…" : d;
}

function newsSection() {
  if (!news.length) return "";
  return `<section class="section">
  <div class="container">
    <div class="section__head">
      <span class="section__kicker">Actualités</span>
      <h2>Les dernières nouvelles du terrain</h2>
    </div>
    <div class="grid grid--3">${news.slice(0, 3).map(newsCard).join("")}</div>
    <p class="reviews-more"><a class="btn btn--dark" href="/actualites/">Toutes les actualités</a></p>
  </div>
</section>`;
}

// ---------- Rendu ----------

const SPLAT_PATH =
  "M100 20C115 20 118 45 130 42C145 38 150 15 165 25C178 34 160 55 170 65C182 77 198 70 198 88C198 104 175 100 172 112C169 125 190 138 180 152C170 165 152 150 142 160C132 170 140 195 122 196C104 197 108 172 96 170C84 168 78 190 62 184C46 178 58 158 48 148C38 138 12 150 8 132C4 114 30 112 30 100C30 88 6 80 12 64C18 48 40 60 50 52C60 44 52 22 68 18C84 14 86 20 100 20Z";
const splat = (cls) =>
  `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="${SPLAT_PATH}" fill="currentColor"/><circle cx="188" cy="30" r="7" fill="currentColor"/><circle cx="20" cy="185" r="9" fill="currentColor"/><circle cx="160" cy="190" r="5" fill="currentColor"/></svg>`;

const tokens = {
  logo: () => logoImg,
  map: mapBlock,
  reviewsSection,
  rating: () =>
    site.reviews
      ? `<!--reviews--><li><strong>${esc(site.reviews.rating)}/5</strong>${esc(site.reviews.count)} avis ${esc(site.reviews.source)}</li><!--/reviews-->`
      : "",
  ratingText: () =>
    site.reviews
      ? `<!--reviews-->Noté ${esc(site.reviews.rating)}/5 sur ${esc(site.reviews.source)} (${esc(site.reviews.count)} avis).<!--/reviews-->`
      : "",
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
  heroClass: () => (heroPhoto ? "hero hero--photo" : "hero"),
  heroStyle: () => (heroPhoto ? ` style="--hero-img: url('${esc(heroPhoto)}')"` : ""),
  news: newsSection,
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
fs.cpSync(path.join(SRC, "admin"), path.join(OUT, "admin"), { recursive: true });

const urls = [];
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

function writePage(meta, body, urlPath, outFile) {
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

for (const file of fs.readdirSync(path.join(SRC, "pages")).sort()) {
  if (!file.endsWith(".html")) continue;
  const { meta, body } = parsePage(path.join(SRC, "pages", file));
  const slug = path.basename(file, ".html");
  const urlPath = slug === "index" ? "/" : slug === "404" ? "/404.html" : `/${slug}/`;
  const outFile =
    slug === "index" ? "index.html" : slug === "404" ? "404.html" : path.join(slug, "index.html");
  writePage(meta, body, urlPath, outFile);
}

// Actualités : une page de liste + une page par article
writePage(
  {
    title: "Actualités – Paintball Lille",
    description: "Les nouveautés du terrain Paintball Lille à Vendeville : offres, événements, nouveaux scénarios et infos pratiques.",
    nav: "actualites",
  },
  `<section class="page-hero">{{splatA}}<div class="container"><h1>Actualités</h1><p>Offres, événements et nouveautés du terrain.</p></div></section>
<section class="section"><div class="container">${
    news.length
      ? `<div class="grid grid--3">${news.map(newsCard).join("")}</div>`
      : `<div class="empty-gallery"><p>Aucune actualité pour le moment. Suivez-nous sur les réseaux pour ne rien manquer.</p></div>`
  }</div></section>
{{cta}}`,
  "/actualites/",
  "actualites/index.html"
);
for (const n of news) {
  writePage(
    {
      title: `${n.title} – Paintball Lille`,
      description: newsDescription(n),
      nav: "actualites",
    },
    `<section class="page-hero">{{splatA}}<div class="container"><span class="hero__eyebrow">${frDate(n.date)}</span><h1>${esc(n.title)}</h1>${
      n.summary ? `<p>${esc(n.summary)}</p>` : ""
    }</div></section>
<section class="section"><div class="container prose">${
      n.image ? `<img class="news-cover" src="${esc(n.image)}" alt="">` : ""
    }${n.html.replace(/\{\{/g, "&#123;&#123;")}<p><a class="btn btn--dark" href="/actualites/">← Toutes les actualités</a></p></div></section>
{{cta}}`,
    `/actualites/${n.slug}/`,
    path.join("actualites", n.slug, "index.html")
  );
}

fs.writeFileSync(
  path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.baseUrl}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
fs.writeFileSync(
  path.join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`
);

console.log(`Site généré dans ${OUT}/ (${urls.length} pages indexables, ${news.length} actualité(s))`);
if (missingLegal.size) {
  console.warn(`⚠ Infos légales à compléter dans src/data/site.json (legal) : ${[...missingLegal].join(", ")}`);
}
