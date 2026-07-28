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
| Déploiement audité | Vercel `success` — commit `f044dc363ab72abce2b20a607c33ef0ef3acafe8` | n/a | succès |

URL cible Vercel : https://vercel.com/mars375s-projects/atelier-vif-portfolio/7JqTYQST2wfKDUi8i3w5TippGi2s

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

- Cette baseline contrôle la branche isolée et le statut GitHub/Vercel du
  commit déployé de référence ; elle ne modifie ni Supabase, ni Vercel, ni la
  production, et ne remplace pas une vérification navigateur de production.
