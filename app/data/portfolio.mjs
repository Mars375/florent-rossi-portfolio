export const locales = ["en", "fr"];

export const projects = [
  {
    number: "01",
    slug: "afterdark",
    title: { en: "Afterdark", fr: "Afterdark" },
    discipline: {
      en: "Festival identity + film",
      fr: "Identité de festival + film",
    },
    year: "2026",
    poster:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=88",
    previewVideo:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    fullVideoUrl: "https://vimeo.com/",
    layout: "wide",
  },
  {
    number: "02",
    slug: "nuit-35",
    title: { en: "Nuit 35", fr: "Nuit 35" },
    discipline: { en: "Fashion film", fr: "Film de mode" },
    year: "2025",
    poster:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=88",
    previewVideo:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    fullVideoUrl: "https://vimeo.com/",
    layout: "portrait",
  },
  {
    number: "03",
    slug: "orbital-radio",
    title: { en: "Orbital Radio", fr: "Orbital Radio" },
    discipline: { en: "Campaign + digital", fr: "Campagne + digital" },
    year: "2025",
    poster:
      "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&w=1400&q=88",
    previewVideo:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    fullVideoUrl: "https://vimeo.com/",
    layout: "square",
  },
  {
    number: "04",
    slug: "material-memory",
    title: { en: "Material Memory", fr: "Mémoire Matérielle" },
    discipline: { en: "Culture exhibition", fr: "Exposition culturelle" },
    year: "2024",
    poster:
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1600&q=88",
    previewVideo:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    fullVideoUrl: "https://vimeo.com/",
    layout: "landscape",
  },
  {
    number: "05",
    slug: "sans-titre-08",
    title: { en: "Sans Titre 08", fr: "Sans Titre 08" },
    discipline: { en: "Editorial series", fr: "Série éditoriale" },
    year: "2023",
    poster:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1400&q=88",
    previewVideo:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    fullVideoUrl: "https://vimeo.com/",
    layout: "portrait",
  },
];

const dictionaries = {
  en: {
    nav: { work: "Work", about: "Studio", contact: "Contact" },
    hero: {
      lineOne: "Ideas move.",
      lineTwo: "Images speak.",
      intro:
        "Independent art direction for culture, music & fashion. Paris / available worldwide.",
    },
    selectedWork: "Selected work 2022—26",
    playing: "Playing",
    viewProject: "View project",
    capabilities: "Strategy / Art direction / Campaigns / Film / Digital",
    profile:
      "Atelier Vif builds visual worlds where strategy, image and motion meet.",
    footer: "Let’s make something move.",
  },
  fr: {
    nav: { work: "Projets", about: "Studio", contact: "Contact" },
    hero: {
      lineOne: "Les idées bougent.",
      lineTwo: "Les images parlent.",
      intro:
        "Direction artistique indépendante pour la culture, la musique et la mode. Paris / disponible partout.",
    },
    selectedWork: "Projets choisis 2022—26",
    playing: "En lecture",
    viewProject: "Voir le projet",
    capabilities: "Stratégie / Direction artistique / Campagnes / Film / Digital",
    profile:
      "Atelier Vif façonne des univers visuels où stratégie, image et mouvement se rencontrent.",
    footer: "Faisons bouger quelque chose.",
  },
};

export function getDictionary(locale) {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getProjectBySlug(slug) {
  return projects.find((project) => project.slug === slug);
}

export function alternateLocalePath(pathname, nextLocale) {
  const segments = pathname.split("/").filter(Boolean);

  if (locales.includes(segments[0])) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }

  return `/${segments.join("/")}`;
}

export function canAutoplayPreview({ hoverCapable, reduceMotion }) {
  return Boolean(hoverCapable && !reduceMotion);
}
