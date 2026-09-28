# Paintball Lille – nouveau site

Refonte complète de www.paintball-lille.fr : site statique, rapide, sans cookies de suivi, sans dépendance.

- **16 pages** : accueil, paintball (.68), Paintball Expérience (.50), Kid Paintball, anniversaire enfant, EVG/EVJF, groupes (entreprises, BDE, centres de loisirs), tarifs, le terrain, galerie, FAQ, réservation, mentions légales, CGV, confidentialité, 404.
- **Une seule source pour les infos** : tarifs, téléphones, adresse, promo et équipements sont dans `src/data/site.json`. Chaque page les lit au moment de la génération, donc un prix ne peut plus être différent d'une page à l'autre.
- SEO : un titre, une meta description et un H1 par page, données structurées (LocalBusiness, FAQ), sitemap, Open Graph.
- Mobile : barre fixe « Appeler / Réserver » en bas de l'écran.
- RGPD : aucun traceur, polices hébergées sur le site, pas de carte ni de vidéo intégrée → pas de bandeau cookies nécessaire.

## Modifier le site sans coder (propriétaires)

Le site a un espace d'administration à l'adresse **`/admin`** (ex. `https://www.paintball-lille.fr/admin/`). On y modifie tout depuis un navigateur, sans toucher au code :

| Dans l'admin | Ce qu'on peut faire |
|---|---|
| **Actualités** | Publier une annonce, une offre, un événement (titre, date, photo, texte). Les 3 dernières s'affichent sur l'accueil. Case « Brouillon » pour préparer sans publier. |
| **Infos du site → Offre du moment** | Activer/couper la promo, changer son texte, fixer une date de fin (elle disparaît toute seule après). |
| **Infos du site → Tarifs** | Ajouter, supprimer ou modifier un forfait, un prix, un prix promo, le forfait mis en avant. |
| **Infos du site → Téléphones, e-mail, adresse, horaires, réseaux** | Coordonnées affichées partout sur le site. |
| **Infos du site → Logo et photo d'accueil, Galerie** | Envoyer des photos depuis l'ordinateur ou le téléphone. |
| **Infos du site → Avis clients** | Note Google, nombre d'avis, avis à mettre en avant. |
| **Infos du site → Infos légales** | SIRET, raison sociale, médiateur, acompte, délai d'annulation. |

Chaque « Enregistrer » crée une version sur GitHub (on peut toujours revenir en arrière), puis le site est régénéré, contrôlé et mis en ligne automatiquement en 1 à 2 minutes.

### Mise en place (une seule fois, par la personne technique)

1. Fusionner la pull request, puis dans GitHub → **Settings → General → Default branch**, choisir `main`.
2. Créer un compte GitHub gratuit pour chaque propriétaire et l'inviter : **Settings → Collaborators → Add people**.
3. Connexion à l'admin, au choix :
   - **Le plus simple** : chaque propriétaire crée un jeton sur github.com → **Settings → Developer settings → Fine-grained tokens**, limité au dépôt `paintball-lille` avec la permission **Contents : Read and write**, puis choisit « Se connecter avec un jeton » sur `/admin`.
   - **Bouton « Se connecter avec GitHub »** : déployer le petit service d'authentification gratuit [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) (Cloudflare Workers) et ajouter son adresse dans `src/admin/config.yml` (`backend.base_url`).
4. Publication automatique : dans GitHub → **Settings → Secrets and variables → Actions**, ajouter `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (identifiants FTP de l'hébergement IONOS) et, si le site n'est pas à la racine, `FTP_DIR`.
5. Avis Google automatiques (facultatif) : ajouter `GOOGLE_MAPS_API_KEY` (clé Google Cloud avec l'API « Places API (New) ») et `GOOGLE_PLACE_ID` (identifiant de la fiche Google). La note, le nombre d'avis et les derniers avis 4-5 étoiles sont alors mis à jour chaque jour.

## Ce qui est automatique

- **Version en ligne sur GitHub Pages** : à chaque modification de `main`, le site est publié sur `https://tahns.github.io/paintball-lille/`, exclu des moteurs de recherche (pour ne pas concurrencer www.paintball-lille.fr). Si le premier déploiement échoue, activer **Settings → Pages → Source : GitHub Actions** puis relancer le workflow.

- **À chaque modification** (admin ou code) : génération du site, contrôle qualité (`scripts/check.mjs` : liens internes, titres, descriptions, H1, images), puis mise en ligne par FTP si configurée. Une modification qui casserait le site est bloquée avant publication.
- **Chaque jour** : mise à jour des avis Google (si configurée), retrait de l'offre saisonnière après sa date de fin, année du pied de page.
- **Dans le navigateur** : l'offre expirée est masquée même si le site n'a pas encore été régénéré.
- **Photos** : logo, photo d'accueil et galerie choisis dans l'admin ; sinon le site prend `src/assets/img/logo-paintball-lille.png`, `src/assets/photos/hero.jpg` et le dossier `src/assets/photos/galerie/`.
- Le site généré de chaque version est téléchargeable dans l'onglet **Actions** de GitHub (artefact « site »).

## Utilisation

```bash
node build.mjs     # génère le site dans site/
node serve.mjs     # aperçu sur http://localhost:8080
```

Le dossier `site/` (non versionné) est le site prêt à mettre en ligne. La publication se fait automatiquement (voir plus haut) ; à la main, on envoie son contenu à la racine de l'hébergement. **Ne modifiez pas `site/`**, modifiez `src/` ou passez par l'admin.

### Maquette de démonstration

```bash
node build.mjs && node build-demo.mjs   # génère site-demo/
```

`site-demo/` est une copie du site avec un nom (« Paintball Démo »), une adresse, des numéros et un e-mail fictifs, un bandeau « maquette » et des pages à plat aux liens relatifs. Elle sert à montrer le design sans pouvoir être confondue avec le vrai site. Le formulaire n'y envoie rien.

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

- **Infos légales** : tout est regroupé dans le bloc `legal` de `src/data/site.json`. `node build.mjs` affiche un avertissement tant qu'un champ est vide, et le site affiche « [à compléter] » en jaune à sa place. **Obligatoire avant la mise en ligne** :
  - `company` : raison sociale et forme juridique (ex. « SAS Paintball Lille »)
  - `siret`, `registration` (RCS ou RNE, capital), `vat` (TVA, ou « non assujetti »)
  - `director` : directeur de la publication
  - `mediator` : médiateur de la consommation auquel l'entreprise adhère (obligatoire pour vendre aux particuliers)
- **Conditions proposées par défaut dans les CGV**, à valider ou modifier dans `legal` : acompte de 30 %, annulation sans frais jusqu'à 7 jours avant, solde réglé sur place, minimum de joueurs dû en cas d'absents, autorisation parentale pour les mineurs non accompagnés. Hébergeur : IONOS (hébergeur actuel), à changer si le site déménage.
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
src/actualites/      actualités (Markdown, éditées depuis l'admin)
src/admin/           espace d'administration (Sveltia CMS)
src/assets/          CSS, JS, polices, logo, photos
scripts/             contrôle qualité, mise à jour des avis Google
.github/workflows/   génération, contrôle et publication automatiques
site/                site généré (non versionné)
```

Polices : Anton et Inter (licence SIL Open Font License), hébergées dans `src/assets/fonts/`.
