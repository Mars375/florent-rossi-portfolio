import { z } from "zod";

const requiredText = z.string().trim().min(1, "Legal copy is required");

export const legalLocaleContentSchema = z.object({
  legalTitle: requiredText,
  legalIntro: requiredText,
  publisherLabel: requiredText,
  publisherText: requiredText,
  contactLabel: requiredText,
  hostLabel: requiredText,
  intellectualPropertyLabel: requiredText,
  intellectualPropertyText: requiredText,
  externalLinksLabel: requiredText,
  externalLinksText: requiredText,
  privacyTitle: requiredText,
  privacyIntro: requiredText,
  controllerLabel: requiredText,
  controllerText: requiredText,
  dataLabel: requiredText,
  dataText: requiredText,
  purposesLabel: requiredText,
  purposesText: requiredText,
  providersLabel: requiredText,
  providersText: requiredText,
  retentionLabel: requiredText,
  retentionText: requiredText,
  rightsLabel: requiredText,
  rightsText: requiredText,
  storageLabel: requiredText,
  storageText: requiredText,
  videosLabel: requiredText,
  videosText: requiredText,
  loadVideo: requiredText,
  externalVideoNotice: requiredText,
  footerLegal: requiredText,
  footerPrivacy: requiredText,
  updatedLabel: requiredText,
});

export const legalContentSchema = z.object({
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD"),
  host: z.object({
    name: requiredText,
    address: requiredText,
    url: z
      .string()
      .url()
      .refine((value) => new URL(value).protocol === "https:", {
        message: "Host URL must use HTTPS",
      }),
  }),
  fr: legalLocaleContentSchema,
  en: legalLocaleContentSchema,
});

export type LegalContent = z.infer<typeof legalContentSchema>;
export type LegalLocaleContent = z.infer<typeof legalLocaleContentSchema>;

export const defaultLegalContent = legalContentSchema.parse({
  updatedAt: "2026-07-28",
  host: {
    name: "Vercel Inc.",
    address:
      "440 N Barranca Avenue #4133, Covina, CA 91723, United States",
    url: "https://vercel.com",
  },
  fr: {
    legalTitle: "Mentions légales",
    legalIntro:
      "Ce site est le portfolio personnel et non professionnel de Florent Rossi.",
    publisherLabel: "Édition",
    publisherText:
      "Florent Rossi assure la publication de ce portfolio personnel.",
    contactLabel: "Contact",
    hostLabel: "Hébergement",
    intellectualPropertyLabel: "Propriété intellectuelle",
    intellectualPropertyText:
      "Les textes, images, films, identités et créations présentés restent protégés par les droits de leurs auteurs et ayants droit. Toute reproduction ou réutilisation nécessite leur autorisation préalable.",
    externalLinksLabel: "Liens externes",
    externalLinksText:
      "Les liens externes sont fournis à titre informatif. Florent Rossi ne contrôle pas leur disponibilité ni leur contenu.",
    privacyTitle: "Confidentialité",
    privacyIntro:
      "Cette page explique les données susceptibles d’être traitées lors de l’utilisation du portfolio.",
    controllerLabel: "Responsable du traitement",
    controllerText:
      "Florent Rossi est responsable des données reçues directement par l’intermédiaire de son adresse e-mail.",
    dataLabel: "Données concernées",
    dataText:
      "Aucun compte public ni formulaire de contact n’est proposé. Un visiteur peut transmettre volontairement son identité, ses coordonnées et son message par e-mail. L’hébergement peut produire des journaux techniques nécessaires à la sécurité du service.",
    purposesLabel: "Finalités et bases légales",
    purposesText:
      "Les données servent à lire et répondre aux échanges professionnels, sur la base de l’intérêt légitime ou de mesures précontractuelles, ainsi qu’à sécuriser et exploiter le site sur la base de l’intérêt légitime.",
    providersLabel: "Prestataires",
    providersText:
      "Vercel assure l’hébergement, Supabase le contenu et l’administration privée, le fournisseur de messagerie traite les e-mails, et Vimeo ou YouTube interviennent uniquement après consentement pour lire une vidéo externe.",
    retentionLabel: "Conservation",
    retentionText:
      "Les échanges professionnels sont conservés le temps nécessaire et au maximum trois ans après le dernier échange actif, sauf obligation légale ou litige. Les journaux techniques suivent les durées du prestataire, les sessions administrateur expirent ou prennent fin à la déconnexion, et la préférence de thème reste dans le navigateur jusqu’à sa modification ou suppression.",
    rightsLabel: "Vos droits",
    rightsText:
      "Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition ou la portabilité lorsqu’elle s’applique. Vous pouvez également saisir la CNIL sur cnil.fr.",
    storageLabel: "Cookies et stockage local",
    storageText:
      "Le portfolio public n’utilise ni publicité ni mesure d’audience. Seul le choix clair ou sombre est conservé localement. Les cookies d’authentification strictement nécessaires sont réservés à l’administration privée.",
    videosLabel: "Vidéos externes",
    videosText:
      "Vimeo et YouTube ne sont pas contactés avant l’activation volontaire du lecteur. Le consentement n’est conservé que pendant l’affichage de la page.",
    loadVideo: "Charger la vidéo",
    externalVideoNotice:
      "Cette vidéo est hébergée par un service externe. Son chargement autorise une connexion à ce service.",
    footerLegal: "Mentions légales",
    footerPrivacy: "Confidentialité",
    updatedLabel: "Dernière mise à jour",
  },
  en: {
    legalTitle: "Legal notice",
    legalIntro:
      "This website is Florent Rossi’s personal, non-commercial portfolio.",
    publisherLabel: "Publisher",
    publisherText:
      "Florent Rossi publishes this personal portfolio.",
    contactLabel: "Contact",
    hostLabel: "Hosting",
    intellectualPropertyLabel: "Intellectual property",
    intellectualPropertyText:
      "The text, images, films, identities and creative work remain protected by the rights of their respective authors and rights holders. Reproduction or reuse requires their prior authorization.",
    externalLinksLabel: "External links",
    externalLinksText:
      "External links are provided for information. Florent Rossi does not control their continuing availability or content.",
    privacyTitle: "Privacy",
    privacyIntro:
      "This page explains the data that may be processed when the portfolio is used.",
    controllerLabel: "Data controller",
    controllerText:
      "Florent Rossi controls personal data received directly through his e-mail address.",
    dataLabel: "Data concerned",
    dataText:
      "No public account or contact form is provided. A visitor may voluntarily send their identity, contact details and message by e-mail. Hosting may produce technical logs required to secure the service.",
    purposesLabel: "Purposes and legal bases",
    purposesText:
      "Data is used to read and answer professional enquiries on the basis of legitimate interests or pre-contractual steps, and to secure and operate the site on the basis of legitimate interests.",
    providersLabel: "Providers",
    providersText:
      "Vercel provides hosting, Supabase provides content and private administration, the configured mail provider processes e-mail, and Vimeo or YouTube is contacted only after consent to play an external video.",
    retentionLabel: "Retention",
    retentionText:
      "Professional correspondence is kept only as needed and for no longer than three years after the last active exchange unless a legal obligation or dispute requires longer. Technical logs follow provider retention periods, admin sessions expire or end on sign-out, and the theme preference remains in the browser until changed or cleared.",
    rightsLabel: "Your rights",
    rightsText:
      "You may request access, rectification, erasure, restriction, objection or portability where applicable. You may also lodge a complaint with the French CNIL at cnil.fr.",
    storageLabel: "Cookies and local storage",
    storageText:
      "The public portfolio uses neither advertising nor audience measurement. Only the light or dark preference is stored locally. Strictly necessary authentication cookies are limited to the private administration area.",
    videosLabel: "External video",
    videosText:
      "Vimeo and YouTube are not contacted before the player is deliberately activated. Consent lasts only while the page is mounted.",
    loadVideo: "Load video",
    externalVideoNotice:
      "This video is hosted by an external service. Loading it authorizes a connection to that service.",
    footerLegal: "Legal notice",
    footerPrivacy: "Privacy",
    updatedLabel: "Last updated",
  },
});
