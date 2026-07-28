# Florent Rossi — portfolio personnel

Portfolio personnel bilingue FR/EN de Florent Rossi, directeur artistique,
construit avec Next.js pour Vercel. Le contenu public et le brouillon sont
stockés comme documents JSON validés dans Supabase. Un seul compte administrateur
peut modifier, prévisualiser et publier le site.

## Fonctionnalités

- routes publiques `/fr`, `/en`, `/[locale]/about` et
  `/[locale]/work/[slug]`;
- boucles MP4/WebM au survol ou au focus, GIF de secours et affiche statique
  sur mobile ou en réduction des animations;
- films complets Vimeo, YouTube ou MP4;
- éditeur bilingue protégé à `/admin`;
- autosauvegarde du brouillon, aperçu privé, publication explicite;
- téléversement direct vers Supabase Storage, sans transiter par Vercel;
- import et export du document JSON complet.

## Développement local

Prérequis : Node.js 22.13 ou plus récent.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Variables requises :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=m.rossiflorent@gmail.com
```

La clé publique Supabase peut être exposée au navigateur. Ne jamais ajouter une
clé `service_role`, une clé secrète Supabase ou une clé Resend dans une variable
`NEXT_PUBLIC_*`.

Le site public utilise `content/default.json` comme repli si Supabase est
indisponible. En production, les documents `draft` et `published` de la table
`portfolio_documents` sont la source de vérité.

## Commandes

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

## Supabase

Les migrations sont versionnées dans `supabase/migrations/`. Elles créent la
table de contenu, la publication atomique, les politiques RLS et le bucket
public `portfolio-media`. Le bucket autorise JPG, PNG, WebP, GIF, MP4 et WebM,
jusqu’à 25 Mo par fichier.

Projet de développement : `kzowrkfounzeytgtvndh` (`eu-west-3`).

## Déploiement Vercel

1. Importer ce dépôt dans Vercel.
2. Ajouter les quatre variables de `.env.example` dans les environnements
   Preview et Production.
3. Définir `NEXT_PUBLIC_SITE_URL` avec l’URL Vercel en Preview, puis
   `https://florentrossi.com` en Production.
4. Dans Supabase Auth hébergé, configurer exactement :
   - Site URL: `https://florentrossi.com`
   - Redirect URL:
     `https://florentrossi.com/auth/confirm?next=/admin`
   - Magic-link template link: `{{ .ConfirmationURL }}`
   Ajouter `http://localhost:3000/auth/confirm?next=/admin` uniquement comme
   URL de redirection supplémentaire pour le développement local, jamais comme
   Site URL hébergée.
5. Déployer, puis vérifier `/fr`, `/en`, `/admin/login` et un téléversement
   depuis l’éditeur.

## Resend et e-mails de connexion

Le domaine expéditeur n’est volontairement pas configuré avant de connaître le
domaine définitif du portfolio. Au lancement :

1. Ajouter le domaine définitif du portfolio dans Resend.
2. Ajouter dans le DNS les enregistrements SPF et DKIM retournés.
3. Attendre que Resend affiche le domaine comme vérifié.
4. Créer une clé Resend limitée à l’envoi et à ce domaine.
5. Configurer le SMTP personnalisé de Supabase Auth avec l’hôte
   `smtp.resend.com`, le port `465`, l’utilisateur `resend` et la clé Resend
   comme mot de passe.
6. Vérifier que Supabase Auth utilise l’URL de redirection de production
   `https://florentrossi.com/auth/confirm?next=/admin`.

La route de confirmation accepte le flux PKCE standard et un modèle direct par
`token_hash`. Le lien du template Magic Link doit être :

```text
{{ .ConfirmationURL }}
```

Le guide d’utilisation destiné au client est dans
`docs/client-editor-guide.md`.
