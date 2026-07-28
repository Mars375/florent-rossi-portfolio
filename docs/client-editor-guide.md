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

Pour la grille de projets, ajoutez une affiche JPG, PNG ou WebP et un GIF
d’aperçu court. L’affiche est toujours visible au repos. Sur ordinateur, le
GIF se charge seulement au survol ou au focus clavier; sur mobile et pour les
personnes qui réduisent les animations, l’affiche reste statique.

Conservez également une boucle MP4 ou WebM courte dans le champ vidéo. Elle
n’est pas chargée par la grille, mais reste disponible dans l’étude de cas.
Pour une page rapide, visez moins de 500 Ko pour l’affiche, moins de 2 Mo pour
un GIF de trois secondes et moins de 4 Mo pour la boucle vidéo.

Chaque fichier téléversé est limité à 25 Mo.

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

## Réseaux sociaux

Dans **Site → Réseaux**, remplacez les URL génériques de LinkedIn, Instagram et
Vimeo par les profils définitifs. Vous pouvez ajouter ou retirer un réseau.
Toutes les URL doivent commencer par `https://`.

## Mentions légales et confidentialité

L’onglet **Légal** contrôle les pages françaises et anglaises, l’hébergeur et la
date de mise à jour. Le texte fourni correspond à un portfolio personnel non
marchand. Faites réviser ces pages si Florent commence à vendre des prestations,
crée une entreprise, ajoute un formulaire, des statistiques d’audience, de la
publicité ou un nouvel outil tiers.

## Vidéos Vimeo et YouTube

Une vidéo externe reste derrière son affiche jusqu’au clic du visiteur sur
« Charger la vidéo ». Une vidéo MP4 directe reste disponible immédiatement.
