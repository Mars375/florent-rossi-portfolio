"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale, Project } from "../../content/schema";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [touchPreview, setTouchPreview] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setHoverPreview(hover.matches && !motion.matches);
      setTouchPreview(!hover.matches);
    };

    update();
    hover.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      hover.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  const startPreview = async (explicit = false) => {
    if ((!hoverPreview && !explicit) || !videoRef.current) return;

    try {
      await videoRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setPlaying(false);
  };

  const toggleTouchPreview = async () => {
    if (playing) {
      stopPreview();
    } else {
      await startPreview(true);
    }
  };

  const hasVideo =
    project.preview.type === "video" &&
    Boolean(project.preview.url) &&
    !videoFailed;
  const fallbackMedia =
    project.preview.fallbackGifUrl || project.posterUrl;
  const number = String(project.order).padStart(2, "0");
  const projectHref = `${routeBase}/${locale}/work/${project.slug}`;

  return (
    <article className={`project-card project-${project.layout}`}>
      <div
        className={`project-media ${playing ? "is-playing" : ""}`}
        onMouseEnter={() => startPreview()}
        onMouseLeave={stopPreview}
      >
        <Link
          className="project-media-link focus-ring"
          href={projectHref}
          onFocus={() => startPreview()}
          onBlur={stopPreview}
          aria-label={`${viewLabel}: ${project.title[locale]}`}
        >
          {/* The source is client-managed JSON and may use any HTTPS host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              project.preview.type === "gif" && project.preview.url
                ? project.preview.url
                : fallbackMedia
            }
            alt=""
            loading={project.order === 1 ? "eager" : "lazy"}
          />
          {hasVideo ? (
            <video
              ref={videoRef}
              src={project.preview.url}
              muted
              loop
              playsInline
              preload="metadata"
              poster={project.posterUrl}
              onError={() => setVideoFailed(true)}
              aria-hidden="true"
            />
          ) : null}
          <span className={`playing-badge ${playing ? "is-visible" : ""}`}>
            {playingLabel} 00:06
          </span>
          <span className={`preview-progress ${playing ? "is-active" : ""}`} />
        </Link>
        {touchPreview && hasVideo ? (
          <button
            className="preview-toggle focus-ring"
            type="button"
            onClick={toggleTouchPreview}
            aria-label={
              playing
                ? locale === "fr"
                  ? "Mettre l’aperçu en pause"
                  : "Pause preview"
                : locale === "fr"
                  ? "Lire l’aperçu"
                  : "Play preview"
            }
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
        ) : null}
      </div>
      <Link
        className="project-meta focus-ring"
        href={projectHref}
      >
        <span>{number}</span>
        <h2>{project.title[locale]}</h2>
        <span>{project.discipline[locale]}</span>
        <span>{project.year}</span>
      </Link>
    </article>
  );
}
