# Portfolio personnel de Florent Rossi — Design

## Objectif

Transformer le portfolio actuel, présenté comme celui d’un studio, en portfolio
personnel de Florent Rossi, directeur artistique recherchant un poste permanent
en agence ou chez une marque. Le contenu initial reste fictif et démonstratif,
mais toutes les informations demeurent modifiables depuis l’administration.

## Identité éditoriale

- Nom public : Florent Rossi.
- Fonction : Directeur artistique / Art Director.
- Positionnement : culture, musique et mode.
- Intention : recherche explicite d’un poste permanent en agence ou chez une
  marque.
- Contact public : `m.rossiflorent@gmail.com`.
- Voix : première personne du singulier en français et en anglais.
- Les termes présentant Florent comme un studio, un atelier ou une équipe sont
  supprimés des textes de navigation, d’accueil et de présentation.

La page « À propos » présente son profil, ses compétences, son processus, ses
références fictives et sa disponibilité. Les crédits des projets utilisent
Florent Rossi comme directeur artistique lorsque le studio fictif était
auparavant crédité.

## Expérience vidéo

Les cinq projets fictifs reçoivent chacun une boucle vidéo motion distincte,
auto-hébergée et optimisée :

- durée cible de 5 à 7 secondes ;
- lecture muette et en boucle au survol ou au focus clavier ;
- arrêt lorsque l’interaction se termine ;
- poster statique sur mobile et avec `prefers-reduced-motion` ;
- formats MP4 et, si la chaîne locale le permet sans dégrader le poids, WebM ;
- univers visuels différenciés pour musique, mode, identité culturelle,
  exposition et performance.

Chaque poster correspond à une image extraite de sa boucle. Les films complets
restent configurables par URL Vimeo, YouTube ou MP4 dans l’administration. Les
nouveaux médias de démonstration sont stockés dans `public/media` pour éviter
une dépendance à un hébergeur de test.

## Données et administration

`content/default.json` reste la source de secours versionnée. La même structure
est publiée dans les documents `draft` et `published` de Supabase afin que le
site public et l’éditeur démarrent avec la nouvelle identité.

L’interface d’administration existante reste inchangée dans son fonctionnement.
Elle permet de modifier les textes FR/EN, la recherche de poste, les secteurs,
les projets, les crédits, les posters, les boucles, les GIF et les films
complets. Aucun nouveau backend n’est nécessaire.

## Validation

- Le site ne contient plus de formulation présentant Florent comme un studio
  ou une équipe, hors noms de collaborateurs fictifs dans les crédits.
- Les pages FR et EN affichent Florent Rossi et sa recherche d’un poste
  permanent.
- Les cinq cartes utilisent des fichiers vidéo distincts et lisibles.
- Les posters, le clavier, le tactile et `prefers-reduced-motion` fonctionnent
  comme repli.
- Le schéma de contenu, les tests, TypeScript, ESLint et le build Next.js
  restent valides.
- Le contenu Supabase est synchronisé, `main` est poussé sur GitHub et le
  déploiement Vercel automatique atteint l’état `READY`.

## Hors périmètre

- Remplacement des projets fictifs par les travaux définitifs de Florent.
- Domaine final et configuration SMTP Resend.
- Refonte de l’éditeur ou ajout d’un second compte administrateur.
