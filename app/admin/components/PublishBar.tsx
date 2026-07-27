"use client";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const labels: Record<SaveStatus, string> = {
  saved: "Brouillon enregistré",
  unsaved: "Modifications non enregistrées",
  saving: "Enregistrement…",
  error: "Erreur d’enregistrement",
};

export function PublishBar({
  status,
  message,
  onPublish,
  publishing,
}: {
  status: SaveStatus;
  message: string;
  onPublish: () => void;
  publishing: boolean;
}) {
  return (
    <div className="admin-publish-bar">
      <div>
        <span className={`save-dot save-dot-${status}`} aria-hidden="true" />
        <strong>{labels[status]}</strong>
        {message ? <small>{message}</small> : null}
      </div>
      <button type="button" onClick={onPublish} disabled={publishing}>
        {publishing ? "Publication…" : "Publier le portfolio"}
      </button>
    </div>
  );
}
