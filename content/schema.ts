import { z } from "zod";
import { parseVideoSource } from "../lib/content/video";
import {
  defaultLegalContent,
  legalContentSchema,
} from "./legal";

const translatedText = z
  .string()
  .trim()
  .min(1, "Translation is required");

export const localizedTextSchema = z.object({
  en: translatedText,
  fr: translatedText,
});

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "URL must use HTTPS",
  });

const localMediaPathSchema = z
  .string()
  .regex(
    /^\/media\/[a-z0-9][a-z0-9/_-]*\.(?:gif|jpe?g|png|webp|mp4|webm)$/i,
    "Local media path must stay under /media",
  );

const portfolioMediaUrlSchema = z.union([
  localMediaPathSchema,
  httpsUrlSchema,
]);

const mediaUrlOrEmptySchema = z.union([
  z.literal(""),
  portfolioMediaUrlSchema,
]);

const projectSchema = z.object({
  id: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
  status: z.enum(["published", "hidden"]),
  order: z.number().int().positive(),
  layout: z.enum(["wide", "portrait", "square", "landscape"]),
  year: z.string().regex(/^\d{4}$/),
  title: localizedTextSchema,
  discipline: localizedTextSchema,
  summary: localizedTextSchema,
  posterUrl: portfolioMediaUrlSchema,
  preview: z.object({
    type: z.enum(["video", "gif", "poster"]),
    url: mediaUrlOrEmptySchema,
    fallbackGifUrl: mediaUrlOrEmptySchema,
  }),
  fullVideo: z
    .object({
      provider: z.enum(["vimeo", "youtube", "mp4"]),
      url: httpsUrlSchema,
    })
    .superRefine((video, context) => {
      try {
        parseVideoSource(video.url, video.provider);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error ? error.message : "Invalid video URL",
          path: ["url"],
        });
      }
    }),
  story: z.object({
    en: z.object({
      brief: translatedText,
      idea: translatedText,
      system: translatedText,
      outcome: translatedText,
    }),
    fr: z.object({
      brief: translatedText,
      idea: translatedText,
      system: translatedText,
      outcome: translatedText,
    }),
  }),
  gallery: z.array(
    z.object({
      type: z.enum(["image", "video", "gif"]),
      url: portfolioMediaUrlSchema,
      alt: localizedTextSchema,
      caption: localizedTextSchema,
      aspect: z.enum(["wide", "portrait", "square"]),
    }),
  ),
  credits: z.array(
    z.object({
      role: z.string().trim().min(1),
      name: z.string().trim().min(1),
    }),
  ),
});

const localeHomeSchema = z.object({
  heroLineOne: translatedText,
  heroLineTwo: translatedText,
  intro: translatedText,
  selectedWork: translatedText,
  playing: translatedText,
  viewProject: translatedText,
  scrollCue: translatedText,
  capabilities: translatedText,
  profile: translatedText,
  profileLink: translatedText,
  footerTitle: translatedText,
});

const localeAboutSchema = z.object({
  title: translatedText,
  imageAlt: translatedText,
  intro: translatedText,
  manifesto: translatedText,
  practiceLabel: translatedText,
  services: z.array(translatedText).min(1),
  clientsLabel: translatedText,
  recognitionLabel: translatedText,
  process: z
    .array(
      z.object({
        title: translatedText,
        text: translatedText,
      }),
    )
    .min(1),
  availability: translatedText,
  credentials: translatedText,
  footerTitle: translatedText,
});

const projectPageSchema = z.object({
  selectedWork: translatedText,
  playFilm: translatedText,
  brief: translatedText,
  idea: translatedText,
  system: translatedText,
  outcome: translatedText,
  back: translatedText,
  next: translatedText,
});

export const portfolioContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    site: z.object({
      name: z.string().trim().min(1),
      email: z.string().email(),
      location: localizedTextSchema,
      copyright: z.string().trim().min(1),
      socials: z.array(
        z.object({
          label: z.string().trim().min(1),
          url: httpsUrlSchema,
        }),
      ),
    }),
    navigation: z.object({
      en: z.object({
        work: translatedText,
        about: translatedText,
        contact: translatedText,
      }),
      fr: z.object({
        work: translatedText,
        about: translatedText,
        contact: translatedText,
      }),
    }),
    home: z.object({
      en: localeHomeSchema,
      fr: localeHomeSchema,
    }),
    about: z.object({
      label: z.string().trim().min(1),
      imageUrl: portfolioMediaUrlSchema,
      clients: z.array(z.string().trim().min(1)),
      recognition: z.array(z.string().trim().min(1)),
      en: localeAboutSchema,
      fr: localeAboutSchema,
    }),
    projectPage: z.object({
      en: projectPageSchema,
      fr: projectPageSchema,
    }),
    projects: z.array(projectSchema).min(1),
    legal: legalContentSchema.default(defaultLegalContent),
  })
  .superRefine((content, context) => {
    const uniqueFields = ["id", "slug", "order"] as const;

    for (const field of uniqueFields) {
      const seen = new Set<string | number>();
      content.projects.forEach((project, index) => {
        const value = project[field];
        if (seen.has(value)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate project ${field}: ${value}`,
            path: ["projects", index, field],
          });
        }
        seen.add(value);
      });
    }
  });

export type PortfolioContent = z.infer<typeof portfolioContentSchema>;
export type Project = PortfolioContent["projects"][number];
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type Locale = keyof LocalizedText;

export function parsePortfolioContent(value: unknown): PortfolioContent {
  return portfolioContentSchema.parse(value);
}
