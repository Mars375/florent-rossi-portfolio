# Audit de production — Florent Rossi

Date : 28 juillet 2026
Production : https://florentrossi.com

## Référence

- Commit HEAD de l'audit : `90888dc01a25b9eb1c482a49f9961c46e4357d04`
- Référence déployée `origin/main` : `f044dc363ab72abce2b20a607c33ef0ef3acafe8`
- Branche : `audit/production-remediation` ; Node.js : `v22.19.0`
- Région Supabase : `eu-west-3`

## Méthode

L’audit-remédiation conserve une preuve reproductible pour chaque constat :
sévérité P0 à P3, impact, cause racine, correction appliquée et validation.
Les données Supabase, le contenu public, la configuration Vercel et la branche
déployée ne sont pas modifiés pendant le travail isolé.

## Baseline de vérification

| Gate | Résultat | Durée | Statut |
| --- | --- | --- | --- |
| Tests complets | 110 tests réussis, 0 échec | 207,728 s | 0 |
| ESLint | aucune erreur | 12,2 s | 0 |
| TypeScript | aucune erreur | 8,8 s | 0 |
| Build Next.js | `Compiled successfully` | 22,8 s (compilation : 6,8 s) | 0 |
| Référence de production déployée | Vercel `success` — `origin/main` = `f044dc363ab72abce2b20a607c33ef0ef3acafe8` | n/a | succès |

URL cible Vercel : https://vercel.com/mars375s-projects/atelier-vif-portfolio/7JqTYQST2wfKDUi8i3w5TippGi2s

La divergence entre le HEAD local d’audit
`90888dc01a25b9eb1c482a49f9961c46e4357d04` et `origin/main`
`f044dc363ab72abce2b20a607c33ef0ef3acafe8` est intentionnelle et prouvée :
le travail se déroule dans une branche isolée, tandis que le plan interdit tout
déploiement avant la revue intégrée finale. Le statut Vercel contrôle donc
explicitement la référence de production déployée (`origin/main`), pas le HEAD
local non déployé.

La première exécution de tests a échoué après 211,944 s : 107 réussites et
2 échecs liés à `orbital-radio-loop.mp4` (atome `moov` absent et checksum
différent après régénération). Le protocole de remédiation a été appliqué avant
acceptation de cette baseline. La suite relancée après correction est celle
consignée dans le tableau.

## Constats

### P2 — Une interruption de génération peut corrompre un média suivi

- **Preuve reproductible :** le test d’interruption démarre le générateur dans
  un répertoire temporaire, interrompt le processus dès que l’écriture du MP4
  commence et vérifie l’ancienne boucle. Avant correction, le fichier cible
  devenait vide ; la suite complète constatait aussi un MP4 sans atome `moov`.
- **Impact :** un arrêt de `generate:media` peut laisser un aperçu vidéo
  invalide dans l’arbre de travail et faire échouer les contrôles média ou un
  build ultérieur. Aucun impact de production n’a été établi pendant cet audit.
- **Cause racine :** FFmpeg, Sharp et `copyFile` écrivaient directement dans
  les chemins de médias suivis.
- **Correction appliquée :** chaque sortie est produite dans un fichier
  temporaire adjacent, puis remplacée par renommage uniquement après succès.
- **Validation :** le test de régression ciblé passe en 10,1 s et les 110
  tests complets, ESLint, TypeScript et le build de production passent.

## Backlog de correction

- Aucun élément ouvert issu de la baseline : le constat P2 confirmé a été
  corrigé et validé dans ce lot.

## Limites de l’audit

- Cette baseline contrôle séparément la branche isolée et le statut
  GitHub/Vercel de `origin/main`, référence de production déployée. Elle ne
  modifie ni Supabase, ni Vercel, ni la production, et ne remplace pas une
  vérification navigateur de production.

## Contrat fonctionnel public — exécution (Tâche 2)

Référence auditée : `b922be7942e0d7a3f876defadc650d1a82f2a5ba`.

### Matrice de routes desktop (1440 × 900)

La surface Codex Browser n’a pas pu démarrer avant toute navigation : son
kernel échoue avec `ReferenceError: require is not defined in ES module scope`
depuis `C:\\Users\\loic_\\package.json` (`type: module`). Les résultats ci-dessous
ne sont donc pas inférés des tests : chaque contrôle HTTP, `html[lang]`,
header/main/footer et liens internes est **NOT TESTABLE** en production.

| Route | Navigation / landmarks / liens internes | `html[lang]` | État |
| --- | --- | --- | --- |
| `/fr` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/about` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/about` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/legal` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/legal` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/privacy` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/privacy` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/work/afterdark` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/work/afterdark` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/work/nuit-35` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/work/nuit-35` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/work/orbital-radio` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/work/orbital-radio` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/work/material-memory` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/work/material-memory` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/work/sans-titre-08` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/en/work/sans-titre-08` | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| `/fr/work/audit-slug-inexistant` | NOT TESTABLE (état 404 attendu) | NOT TESTABLE | NOT TESTABLE |

Les slugs ont été lus depuis `content/default.json`. L’inspection de la branche
confirme que `WorkPage` filtre les projets publiés et appelle `notFound()` pour
un slug absent ; cette preuve de code ne remplace pas la vérification live.

### Interactions desktop

| Contrôle | Résultat | Preuve / limite |
| --- | --- | --- |
| Bascule FR → EN → FR | NOT TESTABLE | navigateur indisponible avant ouverture de `/fr` |
| Thème sombre puis clair | NOT TESTABLE | navigateur indisponible avant ouverture de `/fr` |
| Aperçu au survol puis arrêt | NOT TESTABLE | navigateur indisponible avant ouverture de `/fr` |
| Aperçu au focus clavier | NOT TESTABLE | navigateur indisponible avant ouverture de `/fr` |
| Ouverture d’une étude de cas via slug stable | NOT TESTABLE | navigateur indisponible avant ouverture de `/fr` |

### Mobile et mouvement réduit

Les contrôles live à `390 × 844` (débordement horizontal sur accueil, à-propos
et étude de cas ; contrôles tactiles ; poster-first ; sélecteurs de langue et
thème) sont **NOT TESTABLE**, car aucun onglet ne peut être créé.

Le contrôle de mouvement réduit est couvert localement, sans être présenté comme
une preuve live : `tests/project-card.test.tsx` passe, notamment
`reduced motion keeps the interactive card poster-only`, qui émule
`prefers-reduced-motion: reduce` et vérifie l’absence de `<video>` et de GIF
après focus et survol. `ProjectCard` conditionne également le rendu du lecteur
à `canActivateAnimatedPreview`, et `app/globals.css` désactive animations et
transitions dans la media query correspondante.

### Console de production

La lecture des erreurs de console sur `/fr`, `/en`, `/fr/about` et une étude de
cas est **NOT TESTABLE** : le navigateur n’a pas atteint la première navigation.
Aucune erreur applicative, ni aucun échec tiers de vidéo, n’est donc déclaré sur
la base de cette exécution.

### Gates ciblés

- `node node_modules/tsx/dist/cli.mjs --test tests/project-card.test.tsx` :
  9 réussites, 0 échec (5,26 s).
- `node node_modules/tsx/dist/cli.mjs --test tests/personal-portfolio.test.ts tests/footer-links.test.tsx` :
  9 réussites, 0 échec (1,97 s).
- `git diff --check` : succès.

`npm test` n’était pas exécutable dans cet environnement parce que le shim npm
référence le module absent `C:\\Users\\loic_\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js` ;
les mêmes tests ciblés ont été lancés directement via le CLI `tsx` du projet.

### Constats publics confirmés

Aucun défaut P0–P3 n’est confirmé par cette exécution : l’absence de navigateur
empêche d’établir une preuve live, et aucun correctif de code n’est justifié.
