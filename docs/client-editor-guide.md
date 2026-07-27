# Guide de l’éditeur du portfolio Florent Rossi

## Se connecter

Ouvrez `/admin/login`, saisissez `m.rossiflorent@gmail.com`, puis utilisez le
lien reçu par e-mail. Ce lien est temporaire. Aucune autre adresse ne peut
accéder à l’éditeur.

## Comprendre brouillon et publication

Toutes les modifications sont d’abord enregistrées dans un brouillon privé.
L’indicateur en bas de l’écran affiche successivement :

- « Modifications non enregistrées »;
- « Enregistrement… »;
- « Brouillon enregistré ».

Le site public ne change pas tant que vous ne cliquez pas sur « Publier le
portfolio » et ne confirmez pas. Les liens « Aperçu FR » et « Aperçu EN »
montrent le brouillon tel qu’il apparaîtra après publication.

## Modifier le site

L’éditeur comporte quatre onglets :

- **Site** : nom, e-mail public, localisation, navigation et réseaux sociaux;
- **Accueil** : grand titre, introduction, textes de présentation et libellés
  des études de cas;
- **À propos** : profil, services, clients, distinctions et processus;
- **Projets** : contenu, médias, étude de cas, galerie et crédits.

Les champs FR et EN sont toujours présentés ensemble. Remplissez les deux
langues avant de publier.

## Gérer les projets

Dans l’onglet « Projets », choisissez un projet dans la colonne de gauche.
Vous pouvez :

- le monter ou le descendre dans la grille;
- le masquer sans le supprimer;
- le dupliquer pour repartir d’une structure existante;
- le supprimer après confirmation;
- modifier son titre, sa discipline, son année et son format;
- compléter le brief, l’idée, le système, le résultat, la galerie et les
  crédits dans les deux langues.

Un projet dupliqué est masqué par défaut. Changez sa visibilité quand il est
prêt.

## Ajouter les vidéos et les images

Pour l’aperçu dans la grille, privilégiez une boucle MP4 ou WebM courte, muette,
de 5 à 10 secondes. Elle se lance au survol sur ordinateur. Ajoutez également
une affiche JPG, PNG ou WebP; elle reste visible sur mobile, si la vidéo échoue
ou si la personne réduit les animations. Le GIF est un secours facultatif.

Chaque fichier téléversé est limité à 25 Mo. Pour une page rapide :

- boucle d’aperçu : idéalement moins de 4 Mo;
- affiche : idéalement moins de 500 Ko;
- GIF : seulement si nécessaire, car il est souvent plus lourd qu’une vidéo.

Le film complet ne doit pas être téléversé dans l’aperçu. Collez plutôt son lien
Vimeo ou YouTube, ou une URL MP4 directe, puis choisissez le bon hébergeur dans
la liste.

Les fichiers sont envoyés directement dans la médiathèque Supabase. « Retirer
du brouillon » enlève uniquement la référence pendant l’édition. Après une
publication réussie, l’ancien fichier est supprimé automatiquement s’il n’est
plus utilisé nulle part dans la version publiée. En cas d’échec du nettoyage,
le fichier est conservé sans affecter le site.

## Sauvegarder une copie

« Exporter JSON » télécharge une copie complète du contenu. Faites un export
avant une refonte importante.

« Importer JSON » restaure un fichier précédemment exporté. Le fichier est
d’abord validé, puis remplace uniquement le brouillon. Vérifiez les aperçus FR
et EN avant de publier.

## Publier

Attendez l’indication « Brouillon enregistré », ouvrez les deux aperçus, puis
cliquez sur « Publier le portfolio ». Après confirmation, la version publique
est remplacée en une seule opération : les visiteurs ne voient jamais un
contenu à moitié mis à jour.
