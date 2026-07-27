# Atelier Vif — Portfolio vidéo administrable

## Objectif

Faire évoluer le portfolio bilingue Atelier Vif vers un site vidéo administrable
par une seule personne non technique. Le site public sera hébergé sur Vercel et
disposera d'un espace `/admin` protégé par lien magique. L'administrateur autorisé
est `m.rossiflorent@gmail.com`.

## Architecture

- Vercel héberge l'application Next.js, le site public et l'espace `/admin`.
- Supabase Auth émet et vérifie les liens magiques.
- Resend envoie les e-mails d'authentification depuis le domaine définitif du
  portfolio lorsqu'il sera connecté.
- Supabase Postgres conserve un document JSON de brouillon et un document JSON
  publié.
- Supabase Storage conserve les affiches, GIF et boucles MP4/WebM.
- `content/default.json` fournit le contenu initial, le repli local et un format
  d'import/export documenté.
- Les secrets sont fournis uniquement par les variables d'environnement Vercel.

Le domaine d'envoi n'est pas codé en dur. Avant le lancement final, il sera
configuré avec `RESEND_FROM_EMAIL` après vérification DNS du domaine du client.

## Modèle de contenu

Le document central suit une structure versionnée :

```json
{
  "schemaVersion": 1,
  "site": {
    "name": "Atelier Vif",
    "email": "hello@ateliervif.com",
    "location": { "en": "Paris / Worldwide", "fr": "Paris / Monde" },
    "socials": [{ "label": "Instagram", "url": "https://instagram.com/" }]
  },
  "navigation": {
    "en": { "work": "Work", "about": "Studio", "contact": "Contact" },
    "fr": { "work": "Projets", "about": "Studio", "contact": "Contact" }
  },
  "home": {
    "en": {
      "heroLineOne": "Ideas move.",
      "heroLineTwo": "Images speak.",
      "intro": "Independent art direction for culture, music & fashion."
    },
    "fr": {
      "heroLineOne": "Les idées bougent.",
      "heroLineTwo": "Les images parlent.",
      "intro": "Direction artistique indépendante pour la culture, la musique et la mode."
    }
  },
  "about": {
    "en": { "title": "A studio for ideas that refuse to sit still." },
    "fr": { "title": "Un studio pour les idées qui refusent de rester immobiles." }
  },
  "projects": [
    {
      "id": "afterdark",
      "slug": "afterdark",
      "status": "published",
      "order": 1,
      "layout": "wide",
      "year": "2026",
      "title": { "en": "Afterdark", "fr": "Afterdark" },
      "discipline": {
        "en": "Festival identity + film",
        "fr": "Identité de festival + film"
      },
      "posterUrl": "https://example.test/afterdark-poster.jpg",
      "preview": {
        "type": "video",
        "url": "https://example.test/afterdark-preview.mp4",
        "fallbackGifUrl": ""
      },
      "fullVideo": {
        "provider": "vimeo",
        "url": "https://vimeo.com/"
      },
      "story": {
        "en": { "brief": "Project brief", "idea": "Project idea", "outcome": "Project outcome" },
        "fr": { "brief": "Brief du projet", "idea": "Idée du projet", "outcome": "Résultat du projet" }
      },
      "gallery": [],
      "credits": [{ "role": "Creative Direction", "name": "Atelier Vif" }]
    }
  ]
}
```

Les composants publics ne contiennent plus de textes métier en dur. Ils reçoivent
le document publié, validé côté serveur. Si Supabase est momentanément
indisponible, le site utilise le dernier contenu mis en cache ou
`content/default.json`.

## Expérience publique

### Vidéo

- Sur ordinateur avec pointeur précis, chaque carte charge une boucle vidéo
  silencieuse et `playsInline`. Le survol ou le focus déclenche la lecture et
  révèle les informations du projet.
- Sur mobile, l'affiche reste prioritaire. Un toucher explicite peut démarrer
  l'aperçu sans empêcher l'accès à la fiche.
- `prefers-reduced-motion` empêche toute lecture automatique.
- MP4/WebM est le format principal. Un GIF peut servir de repli, mais ne remplace
  pas la boucle optimisée lorsqu'elle existe.
- Les aperçus sont chargés progressivement. Seul le premier média visible peut
  être préchargé ; les suivants utilisent `preload="metadata"` ou `none`.
- Les vidéos longues sont intégrées depuis Vimeo, YouTube ou une URL MP4.

### Langues

EN et FR sont deux liens réels. Le changement de langue conserve la route
courante, le slug du projet et l'ancre éventuelle. La langue active possède
`aria-current="page"` mais reste navigable. Le défaut actuel, où EN est rendu
comme un simple texte et seul FR est cliquable, est supprimé.

## Interface d'administration

### Authentification et autorisation

- `/admin/login` envoie un lien magique via Supabase Auth et Resend.
- Toutes les routes et mutations `/admin` vérifient la session côté serveur.
- L'adresse de la session doit correspondre exactement à
  `m.rossiflorent@gmail.com`.
- Un utilisateur authentifié avec une autre adresse reçoit une réponse interdite
  et ne peut ni lire le brouillon ni téléverser un fichier.

### Édition

Le tableau de bord propose :

- modification des textes FR/EN du site, de l'accueil et de la page Studio ;
- création, duplication, suppression et réorganisation des projets ;
- édition des titres, disciplines, descriptions, crédits et galeries ;
- téléversement d'affiches, GIF et boucles MP4/WebM ;
- ajout et validation de liens Vimeo, YouTube ou MP4 ;
- aperçu du brouillon dans les deux langues ;
- sauvegarde automatique du brouillon ;
- publication explicite avec confirmation ;
- import et export du document JSON complet.

La publication copie atomiquement le brouillon validé vers la version publique.
Une erreur de validation, d'envoi ou de stockage n'altère jamais la version
publique précédente.

## Validation et erreurs

- Le schéma JSON rejette les slugs dupliqués, traductions obligatoires manquantes,
  fournisseurs vidéo inconnus et URLs invalides.
- Les téléversements acceptent JPEG, PNG, WebP, GIF, MP4 et WebM avec des limites
  explicites affichées dans l'interface.
- Une suppression de projet ou de média demande confirmation.
- Les erreurs Supabase et Resend sont traduites en messages exploitables sans
  exposer de secret ou de détail interne.
- L'interface conserve le brouillon local du formulaire jusqu'à confirmation de
  la sauvegarde distante.

## Tests

- Tests unitaires du schéma de contenu, des URLs vidéo et du changement de langue.
- Tests d'intégration des lectures brouillon/publié et de la publication atomique.
- Tests d'autorisation pour absence de session, mauvaise adresse et adresse
  administrateur.
- Tests des formulaires d'administration et des erreurs de téléversement.
- Tests HTML des routes `/en`, `/fr`, des fiches, de Studio et de `/admin`.
- Vérification clavier, mobile, `prefers-reduced-motion`, chargement différé et
  fallbacks médias.
- Build Vercel de production avant livraison.

## Livraison

La première livraison utilise les contenus fictifs existants convertis dans le
nouveau JSON. Les URLs et médias restent remplaçables depuis `/admin`. Le
déploiement Vercel final nécessite la connexion du dépôt, les variables
d'environnement Supabase/Resend et la vérification DNS du domaine définitif.
