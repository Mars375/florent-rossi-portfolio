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

### Matrice HTTP/SSR live (hors Browser)

Le 28-07-2026, `Invoke-WebRequest -SkipHttpErrorCheck` a lu chaque URL de
`https://florentrossi.com`. Cette preuve HTTP/SSR live est distincte du
navigateur : elle établit le statut, `html[lang]` et les landmarks rendus, mais
pas les interactions ou l’affichage au viewport. Les liens extraits sont soit
relatifs/vers `florentrossi.com`, soit les liens externes éditoriaux attendus
(réseaux, Vercel ou CNIL) ; aucun lien interne n’est dirigé vers un autre
domaine.

| Route | HTTP | `lang` | header/main/footer | État |
| --- | --- | --- | --- | --- |
| `/fr`, `/en` | 200 | fr, en | 1 / 1 / 1 | PASS |
| `/fr/about`, `/en/about` | 200 | fr, en | 1 / 1 / 1 | PASS |
| `/fr/legal`, `/en/legal` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/privacy`, `/en/privacy` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/work/afterdark`, `/en/work/afterdark` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/work/nuit-35`, `/en/work/nuit-35` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/work/orbital-radio`, `/en/work/orbital-radio` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/work/material-memory`, `/en/work/material-memory` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/work/sans-titre-08`, `/en/work/sans-titre-08` | 200 | fr, en | 2 / 1 / 0 | P2 ci-dessous |
| `/fr/work/audit-slug-inexistant` | 404 | absent | 0 / 0 / 0 | PASS (not-found) |

Résultat : 18 routes publiées répondent 200 ; la route invalide répond 404.
Les slugs sont issus de `content/default.json`. Les 14 absences de footer sont
la production actuellement déployée ; la correction de branche reste à
déployer après revue intégrée.

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

### P2 — Landmark footer absent de 14 routes publiques

- **Preuve reproductible :** la matrice HTTP/SSR live ci-dessus observe zéro
  `<footer>` sur les quatre routes legal/privacy et les dix études de cas,
  tandis que les accueils et pages à-propos en ont un. Le test rouge local
  `renders a footer landmark on legal and project public views` échouait avant
  correction sur `LegalView` sans `<footer>`.
- **Impact :** le contrat public de landmark footer et la navigation de
  lecteur d’écran sont incomplets sur ces routes.
- **Cause racine :** `FooterLinks` produit volontairement un `<div>`
  réutilisable. `LegalView` et `ProjectView` l’inséraient sans enveloppe de
  landmark ; les vues accueil et à-propos possèdent déjà leur propre `<footer>`.
- **Correction minimale :** les deux vues non conformes enveloppent uniquement
  leur instance de `FooterLinks` dans `<footer>`, sans modifier les vues déjà
  conformes ni créer de footer imbriqué.
- **Validation :** après correction, le test ciblé est vert (4/4) et son rendu
  SSR local contient le landmark dans les deux variantes légales et l’étude de
  cas. La validation HTTP production du footer reste en attente du déploiement
  autorisé après revue.
- **Statut :** corrigé dans la branche d’audit ; non encore vérifiable sur la
  production non modifiée.

### Gates ciblés

- `node node_modules/tsx/dist/cli.mjs --test tests/project-card.test.tsx` :
  9 réussites, 0 échec (5,26 s).
- `node node_modules/tsx/dist/cli.mjs --test tests/footer-links.test.tsx` :
  4 réussites, 0 échec (rendu SSR local inclus), après un rouge observé.
- `node node_modules/tsx/dist/cli.mjs --test tests/personal-portfolio.test.ts` :
  6 réussites, 0 échec.
- `git diff --check` : succès.

`npm test` n’était pas exécutable dans cet environnement parce que le shim npm
référence le module absent `C:\\Users\\loic_\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js` ;
les mêmes tests ciblés ont été lancés directement via le CLI `tsx` du projet.

### Constats publics confirmés

Le P2 de landmark footer est confirmé et corrigé dans la branche. Les clics,
hover/focus, thème, viewport desktop/mobile, mouvement réduit live et console
restent **NOT TESTABLE** tant que le kernel Codex Browser ne démarre pas.

## Administration, authentification et sûreté des données — Tâche 3

Référence auditée : `393e0052e2764c454f28d3907de93b6ed9f546cb`. Les contrôles de cette section sont non mutants : aucune donnée Supabase, configuration, authentification live, Vercel ou contenu de production n'a été modifié.

### Frontières HTTP admin

Lecture HTTP `HEAD` du 28-07-2026 à 20:44:55 GMT : `/admin` et `/admin/preview/fr` répondent tous deux `307` avec `Location: /admin/login`; `/admin/login` répond `200`. Les redirections observées sont des chemins locaux sur `florentrossi.com`, sans destination externe. Aucun magic link ni formulaire de connexion n'a été soumis.

### Flux source et données

Le flux inspecté est :

```text
request → proxy (rafraîchissement session) → layout protégé (getUser + isAdminEmail)
draft → saveDraftAction → requireAdmin → parsePortfolioContent → upsert draft
publish → publishDraftAction → requireAdmin → parsePortfolioContent
→ RPC publish_portfolio → upsert atomique draft + published → revalidation
→ nettoyage non bloquant des médias inutilisés
```

L'identité provient de `supabase.auth.getUser()` et l'allow-list applicative de `ADMIN_EMAILS`, sinon `ADMIN_EMAIL`, puis du défaut prévu. `safeNextPath()` n'accepte que des destinations locales; un code ou token OTP invalide de la route de confirmation ramène vers `/admin/login?error=invalid-link`. La validation de contenu précède les écritures de brouillon et de publication. Dans la migration finale, `publish_portfolio(jsonb)` est `security invoker`, vérifie `is_portfolio_admin()` et écrit `draft` et `published` par une même instruction `insert … on conflict`, transactionnelle. Un échec de validation ou de RPC ne modifie donc pas le contenu publié; l'échec du nettoyage de média après une publication réussie laisse seulement des médias orphelins.

### Migrations locales et secrets

La séquence locale `202607270001` à `202607280001` active RLS sur `portfolio_documents`, limite la lecture anonyme à `published`, limite les écritures document/Storage à `is_portfolio_admin()`, révoque l'exécution publique/anon/service-role de la RPC et retire les signatures historiques avant de créer la fonction atomique finale. Cette inspection locale ne prouve pas que ces migrations sont appliquées à distance.

`git ls-files .env .env.local "*.pem" "*.key"` et la recherche des motifs de secrets prescrits n'ont produit aucun résultat : aucun fichier de secret ciblé suivi ni secret live correspondant n'a été trouvé dans les sources ou la documentation inspectées.

### Tests, portée de preuve et limite Supabase

Les 15 tests ciblés exécutés sont verts : 9 tests `auth-flow`, login et routes admin, puis 6 tests publication/migrations. Ils démontrent directement le comportement de `safeNextPath`, la normalisation de l'allow-list, et la validation avant l'appel à un faux publisher. D'autres assertions sont des inspections de motifs source/SQL. Ils ne simulent pas les échanges Supabase réels, ni les branches de succès/échec PKCE/OTP, `requireAdmin`, RLS ou RPC : ces branches restent à couvrir avec des doubles de client ou à vérifier en intégration.

Le connecteur Supabase est présent. Ses sept appels strictement read-only (tables, advisors sécurité/performance et logs auth/Postgres/Storage) ont tous été bloqués avant lecture par le rafraîchissement OAuth : `OAuth authorization required`. L'état distant (tables, RLS/policies/fonctions actives, advisors et logs) demeure donc non vérifié. Suivi requis : réauthentifier le connecteur, puis relancer ces sept lectures sans mutation. Cette absence de preuve n'est pas un défaut P2 du produit.

### Gates Tâche 3

- Tests ciblés : 15 passés, 0 échec.
- `git diff --check 393e005..HEAD` : succès après correction de ce lot.
- Aucun défaut P0/P1/P2 confirmé par les preuves locales et HTTP disponibles; la vérification Supabase distante reste ouverte uniquement pour le motif OAuth indiqué ci-dessus.

## Performance et livraison des médias — Tâche 4

Référence auditée : `d7eac6b8cdd4a4ba16dff2a2d802b2684759c0fe`. Les relevés Lighthouse et les réponses HTTP sont effectués contre la production sans mutation. Les JSON bruts restent exclusivement dans `C:\tmp\florent-rossi-audit` et ne sont pas versionnés.

### Inventaire et budgets locaux

`public/media/florent` contient 16 fichiers, pour **8 442 442 octets** au total. Tous respectent les budgets du guide : affiches `< 500 KB`, GIF `≤ 2 MB`, boucles MP4 `< 4 MB` et limite d’upload `< 25 MB`.

| Catégorie | Plus gros fichier | Taille | Budget | État |
| --- | --- | ---: | ---: | --- |
| Poster JPG | `orbital-radio-poster.jpg` | 93 629 o | < 500 KB | PASS |
| GIF preview | `orbital-radio-preview.gif` | 1 239 592 o | ≤ 2 MB | PASS |
| MP4 loop | `orbital-radio-loop.mp4` | 1 195 722 o | < 4 MB | PASS |

### En-têtes de production

Le 28-07-2026, les `HEAD` de `afterdark-poster.jpg`, `afterdark-preview.gif` et `afterdark-loop.mp4` répondent tous `200`, avec respectivement `image/jpeg`/`38 602`, `image/gif`/`1 007 987` et `video/mp4`/`571 111` octets. Chacun expose un ETag (`50b122…`, `8df239…`, `f2b3e7…`) et `Accept-Ranges: bytes`, y compris le MP4 : PASS pour la reprise de flux vidéo.

### P2 — Médias statiques revalidés à chaque consultation

- **Preuve reproductible :** les trois réponses de production ont `Cache-Control: public, max-age=0, must-revalidate`, sans cache immuable. Les chemins contrôlés sont les assets locaux sous `/media/florent/*`.
- **Impact :** les affiches et aperçus renouvellent une requête de validation au lieu d’être servis directement depuis le cache navigateur, ce qui dégrade les visites répétées et les réseaux à latence élevée.
- **Cause racine :** `next.config.ts` ne définissait aucune règle `headers()` pour ces fichiers ; Vercel applique donc sa politique révalidante par défaut.
- **Correction initiale rejetée en revue :** une politique `max-age=31536000, immutable` aurait été dangereuse. Les noms locaux (`<slug>-poster.jpg`, `-preview.gif`, `-loop.mp4`) sont stables et le générateur peut les remplacer : ils ne sont pas fingerprintés.
- **Test rouge de remédiation :** `keeps stable portfolio media cacheable but revalidable` échouait contre cette valeur immutable et exige une règle compilée sans `immutable`.
- **Correction minimale finale :** la configuration Next renvoie `Cache-Control: public, max-age=3600, must-revalidate` uniquement pour `/media/florent/:path*`. Le navigateur peut réutiliser l’asset une heure, puis doit valider sa version avant de le servir de nouveau ; aucun gain de performance live n’est revendiqué avant déploiement.
- **Validation :** le test de règle passe, le build produit dans `.next/routes-manifest.json` exactement la règle et cette valeur. La production non déployée conserve volontairement l’ancien header jusqu’à l’intégration autorisée ; le `HEAD` live post-déploiement reste à effectuer.

### Lighthouse — médianes de trois exécutions

Chrome local a été trouvé à `C:\Program Files\Google\Chrome\Application\chrome.exe`. Lighthouse **13.4.1** a exécuté trois mesures de `/fr` et `/fr/work/afterdark` pour mobile et desktop, catégories performance/accessibility/best-practices/SEO. La syntaxe initiale du brief (`--form-factor=desktop`) est rejetée par Lighthouse 13.4.1 car elle laisse l’émulation mobile active ; les trois mesures desktop ont donc utilisé `--preset=desktop`. Les 12 rapports sont présents, et `summarize-lighthouse.mjs` ne lit que les JSON de `C:\tmp\florent-rossi-audit`.

| URL / stratégie | Perf / A11y / BP / SEO | FCP | LCP | TBT | CLS | Speed Index | Transféré |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Accueil mobile | 97 / 100 / 96 / 100 | 955.677 ms | 1 663.265 ms | 119 ms | 0 | 1 594.863 ms | 412 483 o |
| Accueil desktop | 100 / 100 / 96 / 100 | 292.320 ms | 498.320 ms | 15 ms | 0 | 619.356 ms | 413 666 o |
| Étude mobile | 97 / 96 / 96 / 100 | 1 008.283 ms | 2 481.673 ms | 117.5 ms | 0 | 1 495.385 ms | 509 389 o |
| Étude desktop | 100 / 96 / 96 / 100 | 288.644 ms | 556.644 ms | 17.5 ms | 0 | 600.548 ms | 510 535 o |

Les quatre LCP restent sous 2,5 s, les TBT sous 200 ms, les CLS à 0 et les scores performance au moins égaux à 90 : aucun P2 de Core Web Vitals n’est confirmé par ce laboratoire. Les scores Best Practices (96) et accessibilité des études (96) ne constituent pas un défaut de performance ; ils restent traçables dans les JSON temporaires.

### Aperçus différés — périmètre de preuve

Le contrôle Browser live (DOM avant/après hover, réutilisation de l’élément, viewport tactile) est **NOT TESTABLE** : le Browser Codex ESM ne peut pas créer l’onglet dans cet environnement. Ce n’est pas présenté comme preuve live. La preuve locale exécutable est `tests/project-card.test.tsx` : 9/9 passent, dont le poster seul avant interaction, la création puis réutilisation du même `<video>` au second survol, et l’absence de GIF/vidéo avec `prefers-reduced-motion`. Le code source confirme `preload="none"`, l’activation au pointeur souris ou focus clavier, et l’arrêt tactile d’un aperçu actif. Aucun comportement contradictoire n’est constaté par la preuve disponible.

### Gates Tâche 4

- Rouges observés : absence initiale de règle, puis règle unsafe `max-age=31536000, immutable` lors de la revue ; chacune échoue dans `runtime-config` pour le motif attendu.
- Tests après correction : `runtime-config` 4/4 et `project-card` 9/9 passés ; TypeScript, ESLint ciblé et `next build` passés.
- Suite complète : 112 passés, 0 échec (235,951 s) ; ESLint, TypeScript, `next build` et `git diff --check` réussis.
