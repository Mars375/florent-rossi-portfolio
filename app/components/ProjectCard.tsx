"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { canAutoplayPreview } from "../data/portfolio.mjs";

type LocalizedText = { en: string; fr: string };

type Project = {
  number: string;
  slug: string;
  title: LocalizedText;
  discipline: LocalizedText;
  year: string;
  poster: string;
  previewVideo: string;
  layout: string;
};

export function ProjectCard({
  project,
  locale,
  playingLabel,
  viewLabel,
}: {
  project: Project;
  locale: "en" | "fr";
  playingLabel: string;
  viewLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPreview, setCanPreview] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () =>
      setCanPreview(
        canAutoplayPreview({
          hoverCapable: hover.matches,
          reduceMotion: motion.matches,
        }),
      );

    update();
    hover.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      hover.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  const startPreview = async () => {
    if (!canPreview || !videoRef.current) return;

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

  return (
    <article className={`project-card project-${project.layout}`}>
      <Link
        className="project-link focus-ring"
        href={`/${locale}/work/${project.slug}`}
        onMouseEnter={startPreview}
        onMouseLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
        aria-label={`${viewLabel}: ${project.title[locale]}`}
      >
        <div className="project-media">
          <img
            src={project.poster}
            alt=""
            loading={project.number === "01" ? "eager" : "lazy"}
          />
          {canPreview ? (
            <video
              ref={videoRef}
              src={project.previewVideo}
              muted
              loop
              playsInline
              preload="metadata"
              poster={project.poster}
              aria-hidden="true"
            />
          ) : null}
          <span className={`playing-badge ${playing ? "is-visible" : ""}`}>
            {playingLabel} 00:07
          </span>
          <span className={`preview-progress ${playing ? "is-active" : ""}`} />
        </div>
        <div className="project-meta">
          <span>{project.number}</span>
          <h2>{project.title[locale]}</h2>
          <span>{project.discipline[locale]}</span>
          <span>{project.year}</span>
        </div>
      </Link>
    </article>
  );
}
