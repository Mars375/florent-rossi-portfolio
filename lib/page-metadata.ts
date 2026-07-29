import type { Metadata } from "next";
import { getCanonicalSiteUrl } from "./site-url";

const title = "Florent Rossi — Art Director";
const description =
  "Florent Rossi is a Paris-based art director working across culture, music and fashion, looking for a permanent position.";

export function publicPageMetadata({
  pageTitle,
  pageDescription = description,
  url,
}: {
  pageTitle: string;
  pageDescription?: string;
  url: string | URL;
}): Pick<Metadata, "title" | "description" | "openGraph"> {
  const baseUrl = getCanonicalSiteUrl();

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: "website",
      url,
      images: [
        {
          url: new URL("/og.png", baseUrl).toString(),
          width: 1734,
          height: 909,
          alt: title,
        },
      ],
    },
  };
}
