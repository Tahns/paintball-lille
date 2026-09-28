// Met à jour la note, le nombre d'avis et les derniers avis Google dans src/data/site.json.
// Nécessite une clé Google Places API (New) et l'identifiant de la fiche :
//   GOOGLE_MAPS_API_KEY=... GOOGLE_PLACE_ID=... node scripts/update-reviews.mjs
// Sans ces variables, le script ne fait rien (la note saisie à la main reste en place).
import fs from "node:fs";

const { GOOGLE_MAPS_API_KEY: key, GOOGLE_PLACE_ID: placeId } = process.env;
if (!key || !placeId) {
  console.log("Avis Google : GOOGLE_MAPS_API_KEY ou GOOGLE_PLACE_ID absent, mise à jour ignorée.");
  process.exit(0);
}

const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr`, {
  headers: {
    "X-Goog-Api-Key": key,
    "X-Goog-FieldMask": "rating,userRatingCount,reviews",
  },
});
if (!res.ok) {
  console.error(`Avis Google : erreur ${res.status} ${await res.text()}`);
  process.exit(1);
}
const place = await res.json();

const FILE = "src/data/site.json";
const site = JSON.parse(fs.readFileSync(FILE, "utf8"));
const previous = JSON.stringify(site.reviews);

site.reviews = {
  ...site.reviews,
  rating: place.rating.toFixed(1).replace(".", ","),
  count: String(place.userRatingCount),
  source: "Google",
  items: (place.reviews || [])
    .filter((r) => r.rating >= 4 && r.text?.text)
    .map((r) => ({
      author: r.authorAttribution?.displayName || "Client Google",
      rating: r.rating,
      date: r.publishTime
        ? new Date(r.publishTime).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        : "",
      text: r.text.text.length > 320 ? r.text.text.slice(0, 317).trimEnd() + "…" : r.text.text,
    })),
};

if (JSON.stringify(site.reviews) === previous) {
  console.log("Avis Google : aucun changement.");
} else {
  fs.writeFileSync(FILE, JSON.stringify(site, null, 2) + "\n");
  console.log(`Avis Google : ${site.reviews.rating}/5, ${site.reviews.count} avis, ${site.reviews.items.length} affichés.`);
}
