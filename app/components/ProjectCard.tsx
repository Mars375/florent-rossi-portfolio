"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale, Project } from "../../content/schema";
import {
  canUseAnimatedPreview,
  projectPreviewGifUrl,
} from "../../lib/content/preview";

export function ProjectCard({
  project,
  locale,
  playingLabel,
  viewLabel,
  routeBase = "",
}: {
  project: Project;
  locale: Locale;
  playingLabel: string;
  viewLabel: string;
  routeBase?: string;
}) {
  const gifUrl = projectPreviewGifUrl(project);
  const [previewEligible, setPreviewEligible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover)");
    const pointer = window.matchMedia("(pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      const eligible = canUseAnimatedPreview({
        gifUrl,
        canHover: hover.matches,
        finePointer: pointer.matches,
        reducedMotion: motion.matches,
      });
      setPreviewEligible(eligible);
      if (!eligible) {
        setHovered(false);
        setFocused(false);
      }
    };

    update();
    hover.addEventListener("change", update);
    pointer.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      hover.removeEventListener("change", update);
      pointer.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, [gifUrl]);

  const showGif = previewEligible && (hovered || focused) && !gifFailed;
  const number = String(project.order).padStart(2, "0");
  const projectHref = `${routeBase}/${locale}/work/${project.slug}`;

  return (
    <article className={`project-card project-${project.layout}`}>
      <div
        className={`project-media ${showGif ? "is-previewing" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link
          className="project-media-link focus-ring"
          href={projectHref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={`${viewLabel}: ${project.title[locale]}`}
        >
          {/* The source is client-managed JSON and may use any HTTPS host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showGif ? gifUrl : project.posterUrl}
            alt=""
            loading={project.order === 1 ? "eager" : "lazy"}
            onError={() => {
              if (showGif) {
                setGifFailed(true);
                setHovered(false);
                setFocused(false);
              }
            }}
          />
          <span className={`playing-badge ${showGif ? "is-visible" : ""}`}>
            {playingLabel} 00:03
          </span>
          <span className={`preview-progress ${showGif ? "is-active" : ""}`} />
        </Link>
      </div>
      <Link className="project-meta focus-ring" href={projectHref}>
        <span>{number}</span>
        <h2>{project.title[locale]}</h2>
        <span>{project.discipline[locale]}</span>
        <span>{project.year}</span>
      </Link>
    </article>
  );
}
