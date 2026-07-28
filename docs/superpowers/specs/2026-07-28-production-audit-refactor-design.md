# Audit de production et refactoring — Design

Date : 28 juillet 2026  
Projet : Portfolio de Florent Rossi  
Production : `https://florentrossi.com`

## Objectif

Auditer le portfolio comme un produit en production, corriger les défauts
confirmés et améliorer ses performances, son accessibilité, sa sécurité et sa
maintenabilité sans modifier volontairement son design, ses contenus ni ses URLs
publiques.

Le travail suivra une stratégie incrémentale « production-first ». Chaque axe
est diagnostiqué puis ses défauts confirmés sont corrigés immédiatement dans le
worktree isolé, avant de passer à l’axe suivant. Chaque lot reste réversible,
testé et vérifié indépendamment avant toute intégration ou mise en production.

## Invariants

- Le design public et les contenus éditoriaux restent inchangés sauf correction
  d’un défaut confirmé.
- Les routes et URLs publiques existantes restent compatibles.
- Le JSON validé et Supabase restent la source unique du contenu.
- Aucune donnée partielle ou invalide ne peut remplacer le contenu publié.
- Chaque bug corrigé reçoit un test de non-régression.
- Une optimisation est conservée uniquement si elle produit un gain mesurable ou
  une simplification structurelle nette.
- Chaque lot doit pouvoir être déployé et contrôlé indépendamment.

## Audit-remédiation continu

Le diagnostic et la correction forment une même boucle sur six axes. Pour chaque
défaut confirmé : établir la cause racine, écrire un test de non-régression qui
échoue, appliquer la correction minimale, vérifier les portes de qualité
pertinentes, puis faire relire le lot par un second agent. Le code déployé,
les données Supabase et la configuration Vercel ne sont pas modifiés pendant
l’audit ; seule la branche isolée évolue jusqu’à la revue intégrée finale.

### Fonctionnel

- Navigation FR/EN et conservation des routes.
- Thème clair/sombre.
- Aperçus vidéo desktop, comportement tactile et réduction des animations.
- Études de cas, vidéos externes et galeries.
- Connexion, édition, sauvegarde, prévisualisation et publication admin.
- Gestion des sessions expirées, médias manquants et erreurs réseau.

### Architecture

- Responsabilités et dépendances des composants.
- Duplication de logique ou de rendu.
- Taille et cohésion des composants, notamment `AdminEditor` et
  `ProjectEditor`.
- Frontières entre affichage, édition, validation et stockage.
- Cohérence entre schémas, types et données par défaut.

### Performance

- Poids et dimensions des vidéos, GIFs, images et carte sociale.
- Chargement différé, préchargement, cache et fallbacks.
- Quantité de JavaScript côté client et coût d’hydratation.
- Rendu serveur et comportement des routes dynamiques.
- Core Web Vitals sur desktop et mobile.

### Sécurité

- Contrôle d’accès à l’administration et allow-list.
- Configuration Supabase, RLS et fonctions de publication.
- Validation des données, URLs et chemins de médias.
- Exposition des secrets et configuration des environnements.
- Contenus externes Vimeo/YouTube et consentement.

### Qualité Web

- Navigation clavier, focus et sémantique HTML.
- Contrastes, réduction des animations et lecteurs vidéo.
- Métadonnées, canonical, hreflang, robots et partage social.
- États d’erreur et pages introuvables.

### Exploitation

- Tests et temps d’exécution.
- Reproductibilité des installations et builds.
- Dépendances, scripts et verrouillage des versions.
- Observabilité minimale des erreurs importantes.

## Format des constats

Chaque constat documenté contient :

1. un titre précis ;
2. une preuve reproductible ;
3. une sévérité ;
4. l’impact utilisateur, métier ou maintenance ;
5. la cause racine ;
6. une correction proposée ;
7. le test ou la mesure permettant de valider la correction.

Les sévérités sont :

- **P0** : perte de données, compromission ou indisponibilité critique ;
- **P1** : fonctionnalité principale cassée ou risque de production important ;
- **P2** : dégradation significative de performance, accessibilité ou
  maintenabilité ;
- **P3** : amélioration utile mais non urgente.

## Lots de correction

### Lot 1 — Fiabilité et sécurité

Traiter les P0 et P1 confirmés, puis les erreurs de validation, les cas limites
admin, les sessions, les publications atomiques et la protection des données.

### Lot 2 — Performance et expérience

Optimiser les médias, le cache, le chargement différé, le responsive et les Core
Web Vitals. Les mesures avant/après font partie du lot.

### Lot 3 — Accessibilité et SEO

Corriger la navigation clavier, le focus, les lecteurs, la sémantique, les
métadonnées, l’indexation et les signaux sociaux.

### Lot 4 — Structure et maintenabilité

Découper progressivement les composants admin volumineux, séparer les sections
de formulaire, centraliser la validation et réduire les duplications. Ce lot ne
doit pas changer le comportement visible.

## Données et flux

Le contenu suit le flux suivant :

1. l’administration modifie un brouillon local ;
2. le brouillon est validé avant sauvegarde ;
3. Supabase conserve le dernier brouillon valide ;
4. la publication valide de nouveau l’ensemble du document ;
5. la publication atomique remplace le contenu public ;
6. les pages publiques rendent uniquement du contenu validé.

Les composants publics restent responsables de l’affichage. La logique
d’édition, les transformations de données, la validation et le stockage sont
isolés dans des unités dédiées et testables.

## Gestion des erreurs

- Une erreur de validation est associée à un champ et expliquée en français.
- Une erreur de sauvegarde ne supprime pas le dernier brouillon valide.
- Une erreur de publication ne modifie pas le contenu public.
- Un média ou service externe indisponible utilise une affiche ou un fallback.
- Une session expirée ramène vers une reconnexion explicite.
- Une erreur locale à un projet ne doit pas rendre le reste du site inutilisable.
- Les normalisations ne modifient jamais silencieusement une URL publique
  existante.

## Vérification

Chaque correction suit le même cycle :

1. reproduction ;
2. test de régression échouant ;
3. correction minimale ;
4. tests ciblés ;
5. suite complète ;
6. ESLint ;
7. TypeScript ;
8. build Next.js de production ;
9. contrôle navigateur desktop et mobile ;
10. mesure avant/après lorsqu’il s’agit de performance ;
11. déploiement Vercel ;
12. vérification sur `florentrossi.com`.

Le lot est arrêté si une régression visuelle, une route cassée, une perte de
contenu ou une dégradation mesurable est détectée.

## Livrables

- Un rapport d’audit priorisé avec preuves et recommandations.
- Un plan d’implémentation ordonné par dépendances et sévérité.
- Des commits limités à un lot cohérent.
- Des tests de non-régression.
- Des mesures de performance avant/après.
- Une vérification de production après chaque déploiement.

## Hors périmètre

- Refonte graphique.
- Réécriture des contenus de Florent Rossi.
- Changement de CMS ou de fournisseur d’hébergement.
- Ajout de fonctionnalités métier non nécessaires à la correction d’un constat.
- Migration de domaine ou rupture des URLs publiques.
