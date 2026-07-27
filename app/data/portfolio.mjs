import content from "../../content/default.json" with { type: "json" };

export const locales = ["en", "fr"];

export const projects = content.projects.map((project, index) => ({
  ...project,
  number: String(index + 1).padStart(2, "0"),
  poster: project.posterUrl,
  previewVideo: project.preview.url,
  fullVideoUrl: project.fullVideo.url,
}));

const dictionaries = Object.fromEntries(
  locales.map((locale) => {
    const home = content.home[locale];
    return [
      locale,
      {
        nav: content.navigation[locale],
        hero: {
          lineOne: home.heroLineOne,
          lineTwo: home.heroLineTwo,
          intro: home.intro,
        },
        selectedWork: home.selectedWork,
        playing: home.playing,
        viewProject: home.viewProject,
        capabilities: home.capabilities,
        profile: home.profile,
        footer: home.footerTitle,
      },
    ];
  }),
);

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
