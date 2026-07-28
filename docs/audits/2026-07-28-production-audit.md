# Audit de production et remédiation — Florent Rossi

Date : 28 juillet 2026
Production : https://florentrossi.com
Branche auditée : `audit/production-remediation`
Base : `93143ad8f0710527d4a6e1cf80843954362fa348`

## Portée et méthode

Cet audit a suivi une boucle continue : preuve reproductible, test rouge,
correction minimale, validation locale puis revue indépendante. Les changements
restent dans la branche isolée : aucune donnée Supabase, configuration Vercel,
production ou contenu public n'a été modifié. La référence de production
observée est `origin/main` (`f044dc363ab72abce2b20a607c33ef0ef3acafe8`), dont
le déploiement Vercel était en succès ; elle ne contient volontairement pas les
corrections de cette branche.

Les vérifications ont couvert le contrat public HTTP/SSR, l'administration et
les migrations locales, les médias et Lighthouse, l'accessibilité/SEO,
l'architecture, les dépendances et l'exploitation. Chaque constat ci-dessous
indique son état initial, sa cause, sa correction, sa validation et le contrôle
qui restera nécessaire après déploiement quand il y en a un.

## Synthèse

| Sévérité | Découverts | Corrigés et validés dans la branche | Encore ouverts |
| --- | ---: | ---: | ---: |
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 5 | 5 | 0 |
| P3 | 3 | 3 | 0 |
| **Total** | **8** | **8** | **0** |

| Lot | Découverts | Ouverts | État |
| --- | ---: | ---: | --- |
| Fiabilité et sécurité | 1 | 0 | corrigé et validé localement |
| Performance et expérience | 1 | 0 | corrigé et validé localement |
| Accessibilité et SEO | 5 | 0 | corrigé et validé localement |
| Structure et maintenabilité | 1 | 0 | corrigé et validé localement |

Les 8 constats restent comptés comme découverts pour conserver la trace de
l'audit ; aucun n'est un défaut ouvert de la branche. Les contrôles qui exigent
un déploiement ou une autorité externe figurent uniquement dans le backlog de
suivi, sans être qualifiés de vulnérabilité produit.

## Baseline et contrôles exécutés

- Baseline après correction média : 110 tests réussis, ESLint, TypeScript et
  build Next.js réussis.
- Après le lot performance : 112 tests réussis, ESLint, TypeScript, build et
  `git diff --check` réussis.
- Après le lot accessibilité/SEO : 116 tests réussis, ESLint, TypeScript,
  build et `git diff --check` réussis ; 25 tests SEO/A11y ciblés réussis en
  revue.
- Tests ciblés complémentaires : footer SSR 4/4, carte projet/mouvement réduit
  9/9, administration/auth/migrations 15/15, configuration cache 4/4.
- Lighthouse 13.4.1, trois mesures par combinaison : performances médianes
  97–100, LCP 498–2 482 ms, TBT ≤119 ms et CLS 0. Aucun constat CWV P2.
- Les 18 routes publiques attendues observées en HTTP/SSR répondent 200 avec
  la langue attendue ; un slug inexistant répond 404. Les interactions et la
  console n'ont pas été déduites de ces contrôles HTTP.

## Constats résolus

### P2 — Une interruption de génération pouvait corrompre un média suivi

- **État initial / preuve :** l'interruption du générateur pendant l'écriture
  de `orbital-radio-loop.mp4` laissait avant correction un fichier vide ; la
  première suite détectait également un MP4 sans atome `moov` et un checksum
  non idempotent.
- **Impact :** une interruption de `generate:media` pouvait invalider un média
  local suivi et faire échouer les contrôles ou un build ultérieur.
- **Cause racine :** FFmpeg, Sharp et `copyFile` écrivaient directement dans
  les chemins suivis.
- **Correction appliquée :** `scripts/generate-demo-media.mjs` écrit chaque
  sortie dans un temporaire adjacent puis renomme seulement après succès.
- **Validation :** test d'interruption rouge puis vert dans
  `tests/demo-media.test.ts`; suite post-correction 110/110, ESLint,
  TypeScript et build verts.
- **Contrôle post-déploiement :** aucun : le générateur est un outil local et
  aucun média de production n'a été remplacé pendant l'audit.
- **Lot :** Fiabilité et sécurité. **État :** corrigé.

### P2 — Landmark footer absent de 14 routes publiques

- **État initial / preuve :** la matrice HTTP/SSR live observait zéro
  `<footer>` sur legal/privacy et les dix études de cas ; le test SSR
  `renders a footer landmark on legal and project public views` était rouge.
- **Impact :** navigation de lecteur d'écran et contrat de landmark incomplets
  sur ces routes.
- **Cause racine :** `FooterLinks` rend un `div` réutilisable et `LegalView` /
  `ProjectView` ne l'entouraient pas d'un landmark.
- **Correction appliquée :** les deux instances concernées sont enveloppées
  dans un `<footer>`, sans modifier les vues déjà conformes ni créer de footer
  imbriqué.
- **Validation :** test SSR ciblé 4/4 vert après le rouge observé ; revue
  indépendante conforme.
- **Contrôle post-déploiement :** rejouer la matrice HTTP/SSR footer sur les
  14 routes après intégration.
- **Lot :** Accessibilité et SEO. **État :** corrigé dans la branche.

### P2 — Médias statiques revalidés à chaque consultation

- **État initial / preuve :** les `HEAD` live de poster JPG, GIF et MP4 sous
  `/media/florent/*` retournaient `Cache-Control: public, max-age=0,
  must-revalidate`.
- **Impact :** une requête de revalidation était imposée lors des visites
  répétées, pénalisant les réseaux à latence élevée.
- **Cause racine :** aucune règle `headers()` n'était définie dans
  `next.config.ts`; la politique Vercel par défaut s'appliquait.
- **Correction appliquée :** une règle limitée à `/media/florent/:path*`
  renvoie `public, max-age=3600, must-revalidate`. La proposition initiale
  `immutable` a été rejetée car les noms locaux stables peuvent être remplacés.
- **Validation :** test de configuration rouge puis vert (4/4), manifeste de
  routes généré avec la valeur exacte, TypeScript et build verts.
- **Contrôle post-déploiement :** refaire les trois `HEAD` et mesurer les
  visites répétées ; aucun gain live n'est revendiqué avant ce contrôle.
- **Lot :** Performance et expérience. **État :** corrigé dans la branche.

### P2 — Endpoints d'indexation absents

- **État initial / preuve :** `robots.txt` et `sitemap.xml` retournaient 404
  en production ; le test de générateurs de métadonnées était rouge.
- **Impact :** moteurs privés d'instructions d'exclusion admin et d'un
  inventaire fiable des pages publiques localisées.
- **Cause racine :** absence de `app/robots.ts` et `app/sitemap.ts`.
- **Correction appliquée :** génération des deux endpoints ; robots exclut
  `/admin` et `/admin/`, login/layout admin sont `noindex,nofollow`, et le
  sitemap dynamique énumère seulement les pages publiques et projets publiés
  FR/EN.
- **Validation :** tests d'indexation rouges puis verts, build produisant
  `/robots.txt` et `/sitemap.xml` dynamique ; revue indépendante conforme.
- **Contrôle post-déploiement :** appeler les deux endpoints et rejouer la
  matrice SSR après intégration.
- **Lot :** Accessibilité et SEO. **État :** corrigé dans la branche.

### P2 — Consentement vidéo externe insuffisamment contrasté

- **État initial / preuve :** six rapports Lighthouse d'étude de cas
  signalaient le texte blanc de consentement sur affiche à 1,18:1 (WCAG 1.4.3,
  impact serious) ; le test CSS ciblé était rouge.
- **Impact :** lecture insuffisante du consentement avant l'activation d'une
  vidéo externe.
- **Cause racine :** le texte reposait sur une affiche assombrie dont la
  luminance varie.
- **Correction appliquée :** le bloc de texte et son bouton ont un fond opaque
  `#151515`, pour 18,5:1 avec le blanc.
- **Validation :** test CSS vert ; les tests A11y/SEO ciblés, TypeScript,
  ESLint et build sont verts.
- **Contrôle post-déploiement :** nouvelle mesure Lighthouse et parcours
  clavier visuel avec un Browser opérationnel.
- **Lot :** Accessibilité et SEO. **État :** corrigé dans la branche.

### P3 — URL Open Graph canonique absente des pages publiques

- **État initial / preuve :** la matrice SSR live observait l'absence de
  `og:url` dans les six documents contrôlés (accueil, à-propos et étude de cas
  en FR/EN).
- **Impact :** les plateformes de partage ne reçoivent pas l'URL canonique
  localisée de la page, ce qui dégrade la cohérence des aperçus sociaux.
- **Cause racine :** les cinq générateurs publics de métadonnées ne
  renseignaient pas `openGraph.url`.
- **Correction appliquée :** `openGraph.url` est maintenant défini à partir de
  l'URL canonique localisée dans `app/[locale]/page.tsx`, `about/page.tsx`,
  `legal/page.tsx`, `privacy/page.tsx` et `work/[slug]/page.tsx`.
- **Validation :** test de métadonnées rouge puis vert,
  `public page metadata declares its canonical Open Graph URL`, dans
  `tests/indexation.test.ts`; tests SEO/A11y ciblés et build verts.
- **Contrôle post-déploiement :** rejouer la matrice SSR et vérifier `og:url`
  sur les pages localisées de production.
- **Lot :** Accessibilité et SEO. **État :** corrigé dans la branche.

### P3 — Requête favicon 404 dans les mesures Lighthouse

- **État initial / preuve :** les douze rapports Lighthouse relevaient une
  requête réseau `/favicon.ico` en 404.
- **Impact :** bruit de console et absence d'icône déclarée explicitement.
- **Cause racine :** l'icône SVG existante n'était pas référencée par les
  métadonnées racine.
- **Correction appliquée :** la layout déclare explicitement `/favicon.svg`.
- **Validation :** test de métadonnées rouge puis vert, build et tests SEO/A11y
  ciblés verts.
- **Contrôle post-déploiement :** vérifier le document et la console navigateur
  en production.
- **Lot :** Accessibilité et SEO. **État :** corrigé dans la branche.

### P3 — Guide d'exploitation de l'éditeur obsolète

- **État initial / preuve :** documentation en décalage avec l'allow-list
  `ADMIN_EMAILS`/`ADMIN_EMAIL`, les cinq onglets, le flux affiche → MP4 → GIF,
  le statut WebM, le domaine Resend et la commande de copie Windows.
- **Impact :** risque de mauvaise configuration administrative, de choix de
  média inadapté et de retard e-mail.
- **Cause racine :** documentation non synchronisée avec les évolutions de
  l'éditeur.
- **Correction appliquée :** README et guide alignés sur les comportements et
  paramètres réellement inspectés.
- **Validation :** comparaison directe avec `AdminEditor`, `ProjectCard`, le
  schéma média et la configuration ; revue indépendante conforme.
- **Contrôle post-déploiement :** aucun : modification documentaire sans
  dépendance distante.
- **Lot :** Structure et maintenabilité. **État :** corrigé.

## Contrôles sans constat produit

- Administration : `/admin` et `/admin/preview/fr` redirigent localement vers
  `/admin/login`; la validation précède les écritures et les migrations locales
  décrivent RLS, allow-list et publication atomique. Aucun P0/P1/P2 confirmé.
- Médias : 16 fichiers, 8 442 442 octets ; tous sous les budgets. Les réponses
  live testées ont les bons types, ETag et byte ranges.
- Architecture : `AdminEditor` (649 lignes) et `ProjectEditor` (529 lignes)
  sont une observation, pas un P2 : aucune régression ou difficulté
  reproductible ne justifie un refactor. Ils ne figurent donc pas au backlog.
- Secrets : aucun `.env`, clé ou motif de secret ciblé n'est suivi dans les
  sources/documentation inspectées.

## Backlog de correction

Tous les lots ci-dessous sont **réalisés et fermés dans la branche** : ils ne
constituent pas des défauts ouverts. L'ordre consigne les dépendances suivies,
et les contrôles externes requis après intégration sont isolés ensuite.

### Lot 1 — Fiabilité et sécurité — réalisé

- **Ordre / dépendance :** protéger d'abord les sorties du générateur avant de
  relancer la suite média complète.
- **Correction réalisée :** génération média atomique (P2).
- **Succès utilisateur :** une interruption locale ne remplace plus une boucle,
  affiche ou carte sociale suivie par un fichier partiel.
- **Fichiers/tests :** `scripts/generate-demo-media.mjs`,
  `tests/demo-media.test.ts`; test d'interruption, suite 110/110, ESLint,
  TypeScript et build.
- **Risque :** faible ; renommage après succès, sans mutation distante.

### Lot 2 — Performance et expérience — réalisé

- **Ordre / dépendance :** remplacer la politique par défaut après avoir rejeté
  la valeur `immutable` incompatible avec les noms de médias stables.
- **Correction réalisée :** cache des médias `/media/florent/*` une heure avec
  revalidation obligatoire (P2).
- **Succès utilisateur :** le navigateur peut réutiliser une affiche ou un
  aperçu pendant une heure sans figer un média régénérable.
- **Fichiers/tests :** `next.config.ts`, test `runtime-config`, manifeste Next,
  TypeScript et build.
- **Risque :** faible ; portée limitée au préfixe média.

### Lot 3 — Accessibilité et SEO — réalisé

- **Ordre / dépendance :** restaurer les landmarks, publier l'indexation et
  métadonnées localisées, puis corriger les défauts visuels mesurés.
- **Corrections réalisées :** footer sur legal/privacy et études de cas (P2),
  robots/sitemap et protection admin (P2), consentement vidéo contrasté (P2),
  `og:url` canonique localisé (P3), favicon SVG déclaré (P3).
- **Succès utilisateur :** navigation de lecteur d'écran complète, exploration
  et partage social localisés, consentement lisible et absence de requête
  d'icône implicite.
- **Fichiers/tests :** vues footer et `tests/footer-links.test.tsx`;
  `app/robots.ts`, `app/sitemap.ts`, générateurs de metadata et
  `tests/indexation.test.ts`; styles de consentement et tests A11y/SEO ; build
  et Lighthouse local.
- **Risque :** moyen ; modifications de rendu et métadonnées, validées par
  tests SSR/CSS et build.

### Lot 4 — Structure et maintenabilité — réalisé

- **Ordre / dépendance :** vérifier les comportements réels puis aligner la
  documentation, sans refactorer les éditeurs sans signal reproductible.
- **Correction réalisée :** guide d'exploitation de l'éditeur aligné (P3).
- **Succès utilisateur :** les administrateurs disposent des bonnes règles
  d'accès, onglets, formats de médias, domaine e-mail et commande Windows.
- **Fichiers/tests :** README et guide ; comparaison avec `AdminEditor`,
  `ProjectCard`, schéma média et configuration.
- **Risque :** faible ; documentation seulement.

## Suivis externes, hors constats ouverts

- **Supabase OAuth :** réauthentifier le connecteur, puis relancer sans mutation
  les sept lectures (tables, advisors sécurité/performance, logs auth/Postgres/
  Storage). Bloqueur : `OAuth authorization required`. Succès : état distant
  read-only consigné et comparé aux migrations locales. Risque faible.
- **Post-déploiement :** après déploiement autorisé, rejouer les `HEAD` médias,
  la matrice HTTP/SSR (footer, robots, sitemap, `og:url`, favicon), Lighthouse,
  le clavier, les interactions, mobile et la console. Bloqueurs : déploiement
  hors périmètre et Browser Codex ESM. Succès : comportements servis en
  production et mesures live consignées. Risque moyen.
- **npm réseau :** après autorisation explicite, exécuter `npm audit --omit=dev
  --json`, `npm audit --json` et `npm outdated --json`. Bloqueur : le sandbox
  et l'escalade ont refusé l'envoi du graphe au registre npm. Succès : résultats
  avec contexte prod/dev, advisory, chemin, sévérité et version corrigée si
  applicable. Risque faible.

## Limites factuelles

- Le Browser Codex n'a pas démarré : la navigation, le clavier, hover/focus,
  thème, mobile et console live ne sont pas testables ici. Cette limite ne
  masque pas les contrôles HTTP/SSR, tests locaux ou Lighthouse exécutés.
- Les lectures Supabase actives ont été bloquées avant lecture par OAuth ; les
  migrations locales ne sont pas présentées comme une preuve de l'état distant.
- Les contrôles npm réseau n'ont pas été exécutés après refus d'escalade pour
  exfiltration potentielle du graphe ; aucune vulnérabilité ni obsolescence
  n'est revendiquée.
- La branche n'est pas déployée par autorisation : les validations post-
  déploiement restent à exécuter sans que cela transforme les corrections en
  constats ouverts.
