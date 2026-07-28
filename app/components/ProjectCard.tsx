"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale, Project } from "../../content/schema";
import {
  canActivateAnimatedPreview,
  projectPreviewSources,
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
  const { videoUrl, gifUrl } = projectPreviewSources(project);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setReducedMotion(motion.matches);
    };

    update();
    motion.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
    };
  }, []);

  const activate = (interaction: "mouse" | "focus") => {
    if (
      canActivateAnimatedPreview({
        videoUrl,
        gifUrl,
        interaction,
        reducedMotion,
      })
    ) {
      setHasActivated(true);
    }
  };

  const mousePreviewActive =
    hovered &&
    canActivateAnimatedPreview({
      videoUrl,
      gifUrl,
      interaction: "mouse",
      reducedMotion,
    });
  const focusPreviewActive =
    focused &&
    canActivateAnimatedPreview({
      videoUrl,
      gifUrl,
      interaction: "focus",
      reducedMotion,
    });
  const previewActive = mousePreviewActive || focusPreviewActive;
  const showVideo = previewActive && Boolean(videoUrl) && !videoFailed;
  const showGif =
    previewActive && videoFailed && Boolean(gifUrl) && !gifFailed;
  const previewShowing = showVideo || showGif;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (showVideo) {
      const playback = video.play();
      playback?.catch(() => setVideoFailed(true));
      return;
    }

    video.pause();
  }, [showVideo]);

  const number = String(project.order).padStart(2, "0");
  const projectHref = `${routeBase}/${locale}/work/${project.slug}`;

  return (
    <article className={`project-card project-${project.layout}`}>
      <div
        className={`project-media ${previewShowing ? "is-previewing" : ""}`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            activate("mouse");
            setHovered(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            setHovered(false);
          }
        }}
      >
        <Link
          className="project-media-link focus-ring"
          href={projectHref}
          onFocus={() => {
            activate("focus");
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          aria-label={`${viewLabel}: ${project.title[locale]}`}
        >
          {/* The source is client-managed JSON and may use any HTTPS host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.posterUrl}
            alt=""
            loading={project.order === 1 ? "eager" : "lazy"}
          />
          {hasActivated && videoUrl && !videoFailed ? (
            <video
              ref={videoRef}
              className={showVideo ? "is-visible" : ""}
              muted
              loop
              playsInline
              preload="none"
              poster={project.posterUrl}
              aria-hidden="true"
              onError={() => setVideoFailed(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : null}
          {showGif ? (
            /* The fallback can be a client-managed URL. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="project-preview-fallback is-visible"
              src={gifUrl}
              alt=""
              aria-hidden="true"
              onError={() => setGifFailed(true)}
            />
          ) : null}
          <span className={`playing-badge ${previewShowing ? "is-visible" : ""}`}>
            {playingLabel} 00:03
          </span>
          <span className={`preview-progress ${previewShowing ? "is-active" : ""}`} />
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
