import type { Metadata } from "next";
import { headers } from "next/headers";
import { documentLanguage, REQUEST_LOCALE_HEADER } from "../lib/request-locale";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const title = "Florent Rossi — Art Director";
  const description =
    "Florent Rossi is a Paris-based art director working across culture, music and fashion, looking for a permanent position.";
  const socialImage = new URL("/og.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: {
      default: title,
      template: "%s — Florent Rossi",
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: socialImage, width: 1734, height: 909, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();

  return (
    <html lang={documentLanguage(requestHeaders.get(REQUEST_LOCALE_HEADER))}>
      <body>{children}</body>
    </html>
  );
}
