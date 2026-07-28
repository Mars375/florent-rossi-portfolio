# Prévisualisations GIF et thème sombre — Spécification

## Objectif

Améliorer le portfolio de Florent Rossi avec des aperçus GIF légers sur la grille de projets, un thème clair/sombre accessible et persistant, et une présentation des médias sans effet de zoom au survol.

Le portfolio conserve ses vidéos MP4 pour les études de cas et son contenu administrable. Cette évolution concerne surtout l’expérience de découverte des projets et l’apparence globale.

## Hors périmètre

- Remplacer les vidéos longues ou les intégrations Vimeo/YouTube.
- Reconcevoir l’interface d’administration.
- Introduire un nouveau format animé tel que WebP ou AVIF.
- Charger ou lire automatiquement des animations sur mobile.

## Prévisualisations GIF

### Médias générés

Le script existant `scripts/generate-demo-media.mjs` génère, à partir des cinq boucles MP4 existantes, un GIF par projet :

`/media/florent/<slug>-preview.gif`

Chaque GIF respecte les caractéristiques suivantes :

- largeur maximale de 640 px, proportions conservées ;
- durée de 3 secondes ;
- 8 images par seconde ;
- boucle infinie ;
- palette optimisée avec `palettegen` et `paletteuse` ;
- poids maximal de 2 Mo par fichier ;
- génération déterministe à partir du MP4 source.

Les GIF restent des contenus de démonstration remplaçables. Le champ existant `preview.fallbackGifUrl` du modèle de contenu reçoit leur chemin. Le champ `preview.url` continue de référencer la boucle MP4 afin que celle-ci reste disponible dans l’étude de cas et l’administration.

### Comportement des cartes projet

Au repos, chaque carte affiche uniquement son poster statique.

Sur un ordinateur compatible avec le survol, et uniquement si la réduction des animations n’est pas activée :

1. l’entrée de la souris ou du focus clavier déclenche l’affectation de l’URL du GIF ;
2. le GIF remplace visuellement le poster ;
3. la sortie de la souris ou la perte du focus rétablit le poster ;
4. l’URL du GIF n’est donc jamais demandée avant une interaction.

Sur un appareil tactile sans survol, ou lorsque `prefers-reduced-motion: reduce` est actif, la carte reste entièrement statique et ouvre directement l’étude de cas. L’ancien mécanisme de lecture tactile de la boucle vidéo est supprimé.

Le badge de lecture et son indicateur restent visibles pendant l’aperçu GIF, avec une animation de trois secondes. Ils ne sont pas affichés sur la version statique.

En cas d’échec du chargement du GIF, la carte conserve immédiatement son poster et reste navigable. Un GIF absent ou une valeur vide dans `fallbackGifUrl` produit également une carte statique valide.

## Thèmes clair et sombre

### Choix et persistance

Un bouton soleil/lune est placé dans l’en-tête, à côté du sélecteur FR/EN.

- Lors de la première visite, le site suit `prefers-color-scheme`.
- Un clic bascule explicitement entre clair et sombre.
- Le choix manuel est stocké sous la clé `florent-rossi-theme`.
- Aux visites suivantes, le choix stocké prime sur le système.
- Tant qu’aucun choix manuel n’existe, un changement de préférence système actualise le thème.

Le bouton expose un libellé accessible localisé, par exemple « Activer le mode sombre » ou « Activer le mode clair », et l’état courant via `aria-pressed`.

### Application sans flash

Un script d’initialisation minimal est exécuté dans le document racine avant l’affichage. Il lit la préférence stockée, sinon la préférence système, puis applique `data-theme="light"` ou `data-theme="dark"` à l’élément `<html>`.

Le composant React du bouton se synchronise ensuite avec cette valeur. L’élément racine utilise `suppressHydrationWarning` pour éviter un avertissement causé par l’attribut défini avant l’hydratation.

### Palette

Le thème clair conserve l’identité actuelle :

- fond papier : `#f2ebdd` ;
- texte/encre : `#151515` ;
- corail : `#ff5b35` ;
- acide : `#dfff45` ;
- texte secondaire : `#746f65`.

Le thème sombre utilise :

- fond presque noir : `#11110f` ;
- texte crème : `#f2ebdd` ;
- corail : `#ff6a45` ;
- acide : `#dfff45` ;
- texte secondaire : `#b8b0a4` ;
- lignes : `rgba(242, 235, 221, 0.30)`.

Les variables CSS existantes deviennent la source unique de ces couleurs. `color-scheme` est cohérent avec le thème courant. Les pages publiques et les aperçus de l’administration reflètent le thème ; les panneaux de saisie de l’administration conservent des couleurs explicites et lisibles pour ne pas dégrader l’édition.

## Suppression du zoom

Les transformations d’échelle suivantes sont retirées :

- le zoom de l’image ou de l’aperçu dans `.project-media` au survol ou au focus ;
- le zoom de la vidéo principale dans `.case-film` au survol.

Les changements d’image, badges, soulignements, bandeaux et autres mouvements décoratifs restent inchangés. Le média ne change plus de cadrage lors du passage de la souris.

## Contenu et administration

Le modèle JSON existant reste la source de secours et la structure de référence. Aucun nouveau champ n’est nécessaire : `preview.fallbackGifUrl` sert de chemin vers le GIF et reste modifiable dans l’administration.

Après génération des médias :

- `content/default.json` référence les cinq GIF ;
- le brouillon et la version publiée Supabase sont resynchronisés atomiquement ;
- les fichiers médias sont versionnés avec le projet et servis depuis `public/media/florent`.

Le client peut ensuite remplacer les posters, GIF, MP4 et vidéos complètes depuis les champs existants sans modification du code.

## Accessibilité et robustesse

- Le focus clavier déclenche le même aperçu que le survol.
- Le bouton de thème est utilisable au clavier et possède un nom accessible dans les deux langues.
- La réduction des animations empêche le téléchargement et l’affichage des GIF.
- Les contrastes sont vérifiés dans les deux thèmes.
- L’absence ou l’échec d’un GIF ne masque jamais le poster ni le lien vers le projet.
- JavaScript indisponible laisse le thème clair et les posters statiques utilisables.

## Validation

### Tests automatisés

- Vérifier la présence de cinq GIF distincts et leur signature `GIF87a` ou `GIF89a`.
- Vérifier une largeur maximale de 640 px, exactement 24 images, une boucle infinie et un poids maximal de 2 Mo.
- Vérifier que chaque projet référence le GIF correspondant et conserve son MP4.
- Tester la décision d’afficher le poster ou le GIF selon le survol, le focus, le type de pointeur et `prefers-reduced-motion`.
- Tester le repli sur le poster après une erreur de chargement.
- Tester la priorité entre préférence stockée et préférence système, puis la persistance du choix manuel.
- Vérifier qu’aucune règle CSS ne remet un `scale()` sur les médias des cartes ou de l’étude de cas.
- Exécuter la suite complète, le contrôle TypeScript, le lint, le build de production et l’audit de contenu.

### Vérification navigateur

- Tester les thèmes clair et sombre en français et en anglais.
- Vérifier le thème système initial, le basculement manuel et sa persistance après rechargement.
- Vérifier au bureau que le GIF n’est demandé qu’au survol ou au focus.
- Vérifier sur mobile et avec réduction des animations que seul le poster est demandé.
- Simuler un GIF manquant et confirmer le maintien du poster.
- Confirmer visuellement l’absence de zoom sur les cartes et la vidéo principale.
- Vérifier la navigation clavier, le contraste et la stabilité du cadrage.

## Livraison

Les changements sont développés et validés localement, le contenu est synchronisé avec Supabase, puis la branche principale est publiée sur GitHub et déployée sur Vercel. Une vérification finale est effectuée sur les routes FR/EN, les études de cas, l’administration et les ressources GIF/MP4 de production.

## Critères d’acceptation

La fonctionnalité est terminée lorsque :

- les cinq cartes ont un poster statique et un GIF de prévisualisation différé ;
- aucun GIF ne se charge sur mobile ou en mode de réduction des animations ;
- les vidéos MP4 restent disponibles dans les études de cas ;
- les thèmes clair et sombre fonctionnent sans flash visible et le choix persiste ;
- les deux langues disposent de libellés accessibles ;
- aucun média ne zoome au survol ;
- l’administration permet toujours de remplacer les médias ;
- tous les contrôles automatisés et visuels passent avant le déploiement.
