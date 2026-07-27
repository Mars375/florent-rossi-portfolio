export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

export type MediaFileLike = {
  name: string;
  type: string;
  size: number;
};

const acceptedTypes = {
  "video/mp4": { kind: "preview", extension: "mp4" },
  "video/webm": { kind: "preview", extension: "webm" },
  "image/gif": { kind: "gif", extension: "gif" },
  "image/jpeg": { kind: "image", extension: "jpg" },
  "image/png": { kind: "image", extension: "png" },
  "image/webp": { kind: "image", extension: "webp" },
} as const;

export type ValidMedia = (typeof acceptedTypes)[keyof typeof acceptedTypes];

export function validateMediaFile(file: MediaFileLike): ValidMedia {
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Le fichier dépasse la limite de 25 MB.");
  }
  if (file.size <= 0) {
    throw new Error("Le fichier est vide.");
  }

  const media = acceptedTypes[file.type as keyof typeof acceptedTypes];
  if (!media) {
    throw new Error("Format refusé. Utilisez MP4, WebM, GIF, JPG, PNG ou WebP.");
  }

  return media;
}

function safeBaseName(name: string): string {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  return (
    withoutExtension
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "media"
  );
}

export function mediaObjectPath(
  projectId: string,
  file: MediaFileLike,
  timestamp = Date.now(),
): string {
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error("Identifiant de projet invalide.");
  }

  const { extension } = validateMediaFile(file);
  return `projects/${projectId}/${timestamp}-${safeBaseName(file.name)}.${extension}`;
}
