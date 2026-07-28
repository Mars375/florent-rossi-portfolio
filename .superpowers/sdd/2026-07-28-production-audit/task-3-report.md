# Tâche 3 — Administration, authentification et sûreté des données

Date : 28 juillet 2026  
Référence auditée : `393e0052e2764c454f28d3907de93b6ed9f546cb`  
Périmètre : code de la branche isolée et lectures HTTP de production ; aucune mutation de Supabase, Vercel, de production ou de contenu.

## Résultat

Aucun défaut P0/P1/P2 confirmé dans les frontières admin/auth, la validation, la publication atomique ou les migrations inspectées. Aucune correction code ou migration n'est donc justifiée dans cette tâche : il n'y a pas de test rouge applicable à consigner. Les tests de protection existants sont verts.

## 1. Frontières de routes non authentifiées (production)

Lecture HTTP `HEAD` non mutante à `2026-07-28 20:44:55 GMT` :

| Route | Statut | `Location` | Verdict |
| --- | ---: | --- | --- |
| `https://florentrossi.com/admin` | 307 | `/admin/login` | protégé |
| `https://florentrossi.com/admin/preview/fr` | 307 | `/admin/login` | protégé |
| `https://florentrossi.com/admin/login` | 200 | — | accessible |

Les deux destinations sont des chemins relatifs sur `florentrossi.com` : aucune redirection externe n'a été observée. La commande prescrite avec `-D C:\\tmp\\…` n'a pas pu créer les fichiers d'en-têtes dans le sandbox ; la répétition sans écriture de fichier (`curl.exe -I`) a d'abord été bloquée par le réseau sandbox, puis a produit les en-têtes ci-dessus après autorisation réseau, sans écrire ni modifier l'environnement distant.

## 2. Chaîne d'autorisation, validation et publication

Le flux source relevé est :

```text
requête
  → proxy : createServerSupabaseClient + auth.getClaims(), propagation des cookies/headers
  → layout protégé : auth.getUser(), puis isAdminEmail(user.email)
  → édition de brouillon : saveDraftAction
  → requireAdmin : auth.getUser() + isAdminEmail
  → repository.saveDraft : parsePortfolioContent puis upsert portfolio_documents/draft

publication : publishDraftAction
  → requireAdmin
  → publishDraftWithRepository : parsePortfolioContent
  → repository.publish : RPC publish_portfolio(next_content)
  → transaction PostgreSQL : upsert simultané draft + published
  → revalidatePath("/", "layout")
  → tentative de suppression des médias devenus inutilisés, non bloquante
```

| Frontière | Identité / allow-list | Validation et accès | Échec / atomicité |
| --- | --- | --- | --- |
| `proxy.ts` | session Supabase rafraîchie via cookies ; `auth.getClaims()` | propage aussi les headers anti-cache Supabase | n'autorise pas seul une route : le layout reste la barrière d'accès |
| `app/admin/(protected)/layout.tsx` | `auth.getUser()` ; `isAdminEmail` lit `ADMIN_EMAILS`, sinon `ADMIN_EMAIL`, sinon le défaut | absence de configuration ou session → redirect login ; compte hors allow-list → écran refusé + déconnexion | aucune donnée touchée |
| `saveDraftAction` | `requireAdmin()` répète `getUser()` + allow-list serveur | `createContentRepository.saveDraft()` appelle `parsePortfolioContent` avant `upsert` | erreur renvoyée comme résultat ; le dernier brouillon valide n'est pas écrasé |
| `publishDraftAction` | même `requireAdmin()` côté action | `publishDraftWithRepository()` appelle `parsePortfolioContent` avant le RPC | contenu publié intact si validation/RPC échoue ; nettoyage média ultérieur non bloquant |
| `publish_portfolio(jsonb)` | `is_portfolio_admin()` lit le JWT et compare les deux administrateurs prévus par la migration finale | rejette utilisateur non admin ou JSON nul ; fonction `security invoker`, `search_path = ''`, exécutable uniquement par `authenticated` | une seule instruction `insert … on conflict …` pour `draft` et `published`, donc transactionnelle |
| RLS / Storage | table avec RLS ; politiques `authenticated` et `is_portfolio_admin()` pour toutes écritures | publication publique limitée à la ligne `published`; bucket public pour lecture d'URL, écritures Storage admin seulement | aucun accès d'écriture public défini |

La validation complète intervient avant toute mutation du contenu publié : elle est faite côté action/repository puis la fonction SQL effectue les deux upserts dans la même transaction. Une erreur de nettoyage de média après publication ne revient pas en arrière sur une publication réussie : les fichiers orphelins restent accessibles mais les données publiées restent cohérentes.

## 3. Redirections et sessions expirées

`safeNextPath()` n'accepte qu'un chemin commençant par `/`, refuse `//…` et vérifie l'origine à l'aide d'une origine locale de référence. Toute valeur absente, externe ou invalide devient `/admin`.

`app/auth/confirm/route.ts` échange seulement un code PKCE ou un `token_hash` avec un type OTP autorisé. Tout jeton manquant, expiré ou invalide redirige vers `/admin/login?error=invalid-link`. Les destinations sont reconstruites avec `new URL(next, request.url)` : la production utilise l'origine de la requête, et aucun redirect localhost n'est construit dans cette route. Le lien de magic link est fabriqué côté serveur par `adminAuthCallbackUrl()` ; le test existant vérifie que le client ne dérive pas cette URL de `window.location.origin`.

Tests exécutés :

```text
node node_modules/tsx/dist/cli.mjs --test tests/auth-flow.test.ts tests/admin-login.test.ts tests/admin-route.test.ts tests/auth.test.ts
9 passés, 0 échec, 1,627 s

node node_modules/tsx/dist/cli.mjs --test tests/admin-actions.test.ts tests/migration-security.test.ts
6 passés, 0 échec, 1,129 s
```

Ils couvrent notamment l'open redirect, le callback PKCE/OTP, les en-têtes anti-cache, l'allow-list normalisée, l'accès sans configuration, la validation avant publication et les signatures SQL historiques.

## 4. Supabase — état de preuve et comparaison des migrations

Projet demandé : `kzowrkfounzeytgtvndh`. Conformément au périmètre, aucune commande mutante, migration, requête SQL, invitation, magic link ou changement de configuration n'a été lancé.

La découverte demandée des outils (`tool_search` puis `list_tables`, advisors `security`/`performance`, logs `auth`/`postgres`/`storage`) est **non exécutable dans cette session** : aucun outil de recherche ni outil MCP Supabase n'est exposé (`tool_search` est absent et `ALL_TOOLS` ne contient aucun outil Supabase). Il serait incorrect de présenter les migrations locales comme une lecture de l'état actif du projet. Il n'y a donc pas de résultat live pour :

- présence active de `portfolio_documents` et des métadonnées Storage ;
- advisors sécurité/performance ;
- erreurs récentes auth/Postgres/Storage ;
- comparaison de l'état actif des politiques/fonctions avec la séquence SQL.

Revue locale, dans l'ordre des migrations `202607270001` à `202607280001` :

- crée `portfolio_documents`, active RLS, puis révoque les privilèges généraux ;
- limite la lecture anonyme à `key = 'published'` ;
- remplace les politiques historiques mono-admin par `is_portfolio_admin()` ; l'allow-list SQL finale contient les deux comptes prévus ;
- limite insert/update/delete de documents et écritures Storage aux admins authentifiés ;
- révoque toute exécution publique/anon/service-role de `publish_portfolio(jsonb)`, puis accorde uniquement `authenticated` ;
- supprime explicitement les signatures antérieures de publication, puis crée la fonction atomique finale.

Cette revue est cohérente avec les attentes, mais le raccord entre ces fichiers et l'état actif reste une préoccupation ouverte tant que les outils Supabase read-only ne sont pas disponibles.

## 5. Hygiène des secrets

Commandes exécutées :

```text
git ls-files .env .env.local "*.pem" "*.key"
rg -n --hidden -g '!node_modules/**' -g '!.git/**' -g '!.next/**' "(service_role|RESEND_API_KEY|sk_live_|SUPABASE_SERVICE_ROLE|X-Goog-Api-Key|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)"
```

Résultat : aucune sortie pour les deux commandes — aucun fichier d'environnement ou de clé ciblé n'est suivi, et aucune signature de secret recherchée n'est présente dans les sources/documentation inspectées. Les URL et clés publiques Supabase ne sont pas traitées comme des secrets.

## Constats et suivi

| Sévérité | Constat | État |
| --- | --- | --- |
| — | Aucun défaut confirmé par les contrôles locaux et HTTP non mutants. | fermé, sans changement de code |
| P2 (preuve live manquante) | État actif Supabase non vérifiable dans cette session faute d'outils MCP read-only exposés. | à compléter dans une session disposant de `list_tables`, advisors et logs |

## Gates finaux

- Tests auth/admin/migrations ciblés : **15 passés, 0 échec**.
- `git diff --check` : **succès**.
- Recherche de secrets / fichiers secrets suivis : **aucun résultat**.
- HTTP admin live : **conforme** (2 redirects locaux, login 200).
- Supabase distant : **strictement non modifié ; vérification read-only non réalisable faute d'outil exposé**.

