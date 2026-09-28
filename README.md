# Paintball Lille – nouveau site

Refonte complète de www.paintball-lille.fr : site statique, rapide, sans cookies de suivi, sans dépendance.

- **16 pages** : accueil, paintball (.68), Paintball Expérience (.50), Kid Paintball, anniversaire enfant, EVG/EVJF, groupes (entreprises, BDE, centres de loisirs), tarifs, le terrain, galerie, FAQ, réservation, mentions légales, CGV, confidentialité, 404.
- **Une seule source pour les infos** : tarifs, téléphones, adresse, promo et équipements sont dans `src/data/site.json`. Chaque page les lit au moment de la génération, donc un prix ne peut plus être différent d'une page à l'autre.
- SEO : un titre, une meta description et un H1 par page, données structurées (LocalBusiness, FAQ), sitemap, Open Graph.
- Mobile : barre fixe « Appeler / Réserver » en bas de l'écran.
- RGPD : aucun traceur, polices hébergées sur le site, pas de carte ni de vidéo intégrée → pas de bandeau cookies nécessaire.

## Utilisation

```bash
node build.mjs     # génère le site dans site/
node serve.mjs     # aperçu sur http://localhost:8080
```

Le dossier `site/` est le site prêt à mettre en ligne : on envoie son contenu à la racine de l'hébergement (FTP IONOS, Netlify, OVH…). **Ne modifiez pas `site/` à la main**, modifiez `src/` puis relancez `node build.mjs`.

### Modifier un tarif, un numéro, la promo

Tout est dans `src/data/site.json`. Pour couper l'offre automne-hiver : `"promo": { "active": false, … }`.

### Ajouter des photos

- Photo d'accueil : déposez `src/assets/photos/hero.jpg` (paysage, ~1920 px de large). Elle s'affiche automatiquement derrière le titre.
- Galerie : déposez les photos dans `src/assets/photos/galerie/`. Le nom du fichier sert de description (ex. `01-evg-terrain-foret.jpg` → « evg terrain foret »).

### Recevoir les demandes de réservation par e-mail

Par défaut, le formulaire ouvre la messagerie du visiteur avec la demande pré-remplie. Pour recevoir les demandes directement, créez un formulaire gratuit sur [Formspree](https://formspree.io) (ou équivalent) et collez son adresse dans `"formEndpoint"` de `site.json`.

## À faire valider par l'exploitant

L'ancien site se contredisait sur plusieurs points. Les choix retenus sont ci-dessous, à confirmer :

| Sujet | Ancien site | Retenu ici |
|---|---|---|
| Forfait Découverte .68 | 20 € (accueil) / 30 € (tarifs) | 30 €, affiché à 20 € tant que l'offre automne-hiver est active |
| Durées Expérience .50 | Action 1 h ou 2 h, Intense 2 h ou 3 h | Initiation 1 h, Action 1 h, Intense 2 h (liste de la page tarifs) |
| Âge Expérience | 11 ou 12 ans | 12 ans |
| Capacité | 50, 90 ou 100 joueurs | 50 par terrain (3 terrains) |
| Numéro Expérience | 06 ou 07 selon les pages | 07 66 63 34 60 (comme les boutons de l'ancien site) |
| E-mail | paintball.lille@ / equipe.paintballlille@ / « epuipe » | paintball.lille@gmail.com |
| Numéro 07 33 36 34 60 (FAQ) | présent une fois | supprimé (probable faute de frappe) |

Également à vérifier ou compléter :

- **Mentions légales, CGV, confidentialité** : les champs surlignés en jaune (`[à compléter]`) : raison sociale, SIRET, hébergeur, paiement, acompte, annulation, médiateur. Obligatoire avant la mise en ligne.
- **Horaires** : l'ancien site n'en donnait aucun (« sur réservation »).
- **Réseaux sociaux** : adresses Facebook, Instagram et TikTok à vérifier.
- **Kid Paintball** : l'ancien site annonçait une fermeture temporaire sans dates, elle n'a pas été reprise.
- **Forfaits Kid** : Anniversaire et Expert sont au même prix (20 €/22 €) alors que l'Expert a une partie de plus, repris tel quel.
- **Réponses de la FAQ** (tenue, équipement, parents) : rédigées à partir des infos du site, à relire.
- **Meta descriptions** : elles citent quelques prix en dur ; à relire si les tarifs changent.
- Bubble foot, bons cadeaux, prix des t-shirts : absents de l'ancien site, non ajoutés.

## Structure

```
build.mjs            générateur (Node, sans dépendance)
serve.mjs            serveur d'aperçu local
src/data/site.json   tarifs, contacts, promo, équipements
src/layout.html      en-tête, menu, pied de page communs
src/pages/*.html     contenu de chaque page
src/assets/          CSS, JS, polices, logo, photos
site/                site généré, prêt à publier
```

Polices : Anton et Inter (licence SIL Open Font License), hébergées dans `src/assets/fonts/`.
