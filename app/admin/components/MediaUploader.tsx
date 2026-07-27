"use client";

import { useState, type ChangeEvent } from "react";
import {
  mediaObjectPath,
  validateMediaFile,
  type ValidMedia,
} from "../../../lib/content/media";
import { createBrowserSupabaseClient } from "../../../lib/supabase/browser";

const BUCKET = "portfolio-media";

export function MediaUploader({
  label,
  projectId,
  value,
  kind,
  onUploaded,
  onDeleted,
}: {
  label: string;
  projectId: string;
  value: string;
  kind: ValidMedia["kind"];
  onUploaded: (url: string, media: ValidMedia) => void;
  onDeleted?: (url: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const media = validateMediaFile(file);
      if (media.kind !== kind) {
        throw new Error(
          kind === "preview"
            ? "Choisissez une vidéo MP4 ou WebM."
            : kind === "gif"
              ? "Choisissez un fichier GIF."
              : "Choisissez une image JPG, PNG ou WebP.",
        );
      }

      setStatus("uploading");
      setMessage("");
      const supabase = createBrowserSupabaseClient();
      const path = mediaObjectPath(projectId, file);
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onUploaded(data.publicUrl, media);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Téléversement impossible.",
      );
    }
  };

  const remove = () => {
    if (
      !value ||
      !window.confirm(
        "Retirer ce média du brouillon ? Le fichier ne sera supprimé de la médiathèque qu’après une publication réussie et s’il n’est plus utilisé.",
      )
    ) {
      return;
    }

    onDeleted?.(value);
    setMessage("");
  };

  return (
    <div className="media-uploader">
      <div>
        <strong>{label}</strong>
        <small>
          {kind === "preview"
            ? "MP4 ou WebM, 25 MB max."
            : kind === "gif"
              ? "GIF, 25 MB max."
              : "JPG, PNG ou WebP, 25 MB max."}
        </small>
      </div>
      <label className="media-upload-button">
        {status === "uploading" ? "Envoi…" : "Téléverser"}
        <input
          type="file"
          disabled={status === "uploading"}
          accept={
            kind === "preview"
              ? "video/mp4,video/webm"
              : kind === "gif"
                ? "image/gif"
                : "image/jpeg,image/png,image/webp"
          }
          onChange={upload}
        />
      </label>
      {value && onDeleted ? (
        <button
          className="danger-button"
          type="button"
          disabled={status === "uploading"}
          onClick={remove}
        >
          Retirer du brouillon
        </button>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
    </div>
  );
}
