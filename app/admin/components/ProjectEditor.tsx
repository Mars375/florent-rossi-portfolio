"use client";

import type { Project } from "../../../content/schema";
import { LocalizedField } from "./LocalizedField";
import { MediaUploader } from "./MediaUploader";

export function ProjectEditor({
  project,
  index,
  total,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  onQueueMediaDelete,
}: {
  project: Project;
  index: number;
  total: number;
  onChange: (project: Project) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onQueueMediaDelete: (url: string) => void;
}) {
  const update = <Key extends keyof Project>(key: Key, value: Project[Key]) =>
    onChange({ ...project, [key]: value });
  const queueReplacement = (currentUrl: string, nextUrl: string) => {
    if (currentUrl && currentUrl !== nextUrl) {
      onQueueMediaDelete(currentUrl);
    }
  };

  return (
    <div className="project-editor">
      <div className="project-editor-heading">
        <div>
          <p className="section-label">Projet {index + 1}</p>
          <h2>{project.title.fr}</h2>
        </div>
        <div className="admin-inline-actions">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Monter le projet"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Descendre le projet"
          >
            ↓
          </button>
          <button type="button" onClick={onDuplicate}>
            Dupliquer
          </button>
          <button className="danger-button" type="button" onClick={onDelete}>
            Supprimer
          </button>
        </div>
      </div>

      <section className="admin-form-section">
        <h3>Identité et affichage</h3>
        <div className="admin-grid admin-grid-3">
          <label>
            Identifiant
            <input
              value={project.id}
              onChange={(event) => update("id", event.target.value)}
            />
          </label>
          <label>
            URL du projet
            <input
              value={project.slug}
              onChange={(event) => update("slug", event.target.value)}
            />
          </label>
          <label>
            Année
            <input
              value={project.year}
              inputMode="numeric"
              onChange={(event) => update("year", event.target.value)}
            />
          </label>
          <label>
            Visibilité
            <select
              value={project.status}
              onChange={(event) =>
                update("status", event.target.value as Project["status"])
              }
            >
              <option value="published">Visible</option>
              <option value="hidden">Masqué</option>
            </select>
          </label>
          <label>
            Format dans la grille
            <select
              value={project.layout}
              onChange={(event) =>
                update("layout", event.target.value as Project["layout"])
              }
            >
              <option value="wide">Large</option>
              <option value="landscape">Paysage</option>
              <option value="portrait">Portrait</option>
              <option value="square">Carré</option>
            </select>
          </label>
        </div>
        <LocalizedField
          label="Titre"
          value={project.title}
          onChange={(value) => update("title", value)}
        />
        <LocalizedField
          label="Discipline"
          value={project.discipline}
          onChange={(value) => update("discipline", value)}
        />
        <LocalizedField
          label="Résumé"
          value={project.summary}
          onChange={(value) => update("summary", value)}
          multiline
        />
      </section>

      <section className="admin-form-section">
        <h3>Vidéos et aperçu</h3>
        <div className="admin-upload-grid">
          <MediaUploader
            label="Affiche statique"
            projectId={project.id}
            value={project.posterUrl}
            kind="image"
            onUploaded={(url) => {
              queueReplacement(project.posterUrl, url);
              update("posterUrl", url);
            }}
          />
          <MediaUploader
            label="Boucle d’aperçu"
            projectId={project.id}
            value={
              project.preview.type === "video" ? project.preview.url : ""
            }
            kind="preview"
            onUploaded={(url) => {
              queueReplacement(project.preview.url, url);
              update("preview", {
                ...project.preview,
                type: "video",
                url,
              });
            }}
            onDeleted={(url) => {
              onQueueMediaDelete(url);
              update("preview", { ...project.preview, url: "" })
            }}
          />
          <MediaUploader
            label="GIF de secours"
            projectId={project.id}
            value={project.preview.fallbackGifUrl}
            kind="gif"
            onUploaded={(url) => {
              queueReplacement(project.preview.fallbackGifUrl, url);
              update("preview", {
                ...project.preview,
                fallbackGifUrl: url,
              });
            }}
            onDeleted={(url) => {
              onQueueMediaDelete(url);
              update("preview", {
                ...project.preview,
                fallbackGifUrl: "",
              });
            }}
          />
        </div>
        <div className="admin-grid admin-grid-2">
          <label>
            Affiche statique
            <input
              type="url"
              value={project.posterUrl}
              onChange={(event) => {
                queueReplacement(project.posterUrl, event.target.value);
                update("posterUrl", event.target.value);
              }}
            />
          </label>
          <label>
            Type d’aperçu
            <select
              value={project.preview.type}
              onChange={(event) =>
                update("preview", {
                  ...project.preview,
                  type: event.target.value as Project["preview"]["type"],
                })
              }
            >
              <option value="video">Vidéo MP4/WebM</option>
              <option value="gif">GIF</option>
              <option value="poster">Affiche seule</option>
            </select>
          </label>
          <label>
            URL de l’aperçu
            <input
              type="url"
              value={project.preview.url}
              onChange={(event) => {
                queueReplacement(project.preview.url, event.target.value);
                update("preview", {
                  ...project.preview,
                  url: event.target.value,
                });
              }}
            />
          </label>
          <label>
            GIF de secours
            <input
              type="url"
              value={project.preview.fallbackGifUrl}
              onChange={(event) => {
                queueReplacement(
                  project.preview.fallbackGifUrl,
                  event.target.value,
                );
                update("preview", {
                  ...project.preview,
                  fallbackGifUrl: event.target.value,
                });
              }}
            />
          </label>
          <label>
            Hébergeur du film
            <select
              value={project.fullVideo.provider}
              onChange={(event) =>
                update("fullVideo", {
                  ...project.fullVideo,
                  provider: event.target
                    .value as Project["fullVideo"]["provider"],
                })
              }
            >
              <option value="vimeo">Vimeo</option>
              <option value="youtube">YouTube</option>
              <option value="mp4">MP4 direct</option>
            </select>
          </label>
          <label>
            URL du film complet
            <input
              type="url"
              value={project.fullVideo.url}
              onChange={(event) =>
                update("fullVideo", {
                  ...project.fullVideo,
                  url: event.target.value,
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Étude de cas</h3>
        {(["brief", "idea", "system", "outcome"] as const).map((part) => (
          <LocalizedField
            key={part}
            label={
              {
                brief: "Brief",
                idea: "Idée",
                system: "Système",
                outcome: "Résultat",
              }[part]
            }
            value={{
              fr: project.story.fr[part],
              en: project.story.en[part],
            }}
            onChange={(value) =>
              update("story", {
                fr: { ...project.story.fr, [part]: value.fr },
                en: { ...project.story.en, [part]: value.en },
              })
            }
            multiline
          />
        ))}
      </section>

      <section className="admin-form-section">
        <div className="admin-section-heading">
          <h3>Galerie</h3>
          <button
            type="button"
            onClick={() =>
              update("gallery", [
                ...project.gallery,
                {
                  type: "image",
                  url: project.posterUrl,
                  alt: { fr: "Nouveau visuel", en: "New visual" },
                  caption: { fr: "Légende", en: "Caption" },
                  aspect: "wide",
                },
              ])
            }
          >
            + Ajouter un visuel
          </button>
        </div>
        {project.gallery.map((media, mediaIndex) => (
          <div className="admin-nested-card" key={`${project.id}-media-${mediaIndex}`}>
            <MediaUploader
              label={`Fichier du visuel ${mediaIndex + 1}`}
              projectId={project.id}
              value={media.url}
              kind={
                media.type === "video"
                  ? "preview"
                  : media.type === "gif"
                    ? "gif"
                    : "image"
              }
              onUploaded={(url, uploadedMedia) => {
                queueReplacement(media.url, url);
                const gallery = [...project.gallery];
                gallery[mediaIndex] = {
                  ...media,
                  url,
                  type:
                    uploadedMedia.kind === "preview"
                      ? "video"
                      : uploadedMedia.kind === "gif"
                        ? "gif"
                        : "image",
                };
                update("gallery", gallery);
              }}
              onDeleted={(url) => {
                onQueueMediaDelete(url);
                update(
                  "gallery",
                  project.gallery.filter(
                    (_, itemIndex) => itemIndex !== mediaIndex,
                  ),
                );
              }}
            />
            <div className="admin-grid admin-grid-3">
              <label>
                Type
                <select
                  value={media.type}
                  onChange={(event) => {
                    const gallery = [...project.gallery];
                    gallery[mediaIndex] = {
                      ...media,
                      type: event.target.value as typeof media.type,
                    };
                    update("gallery", gallery);
                  }}
                >
                  <option value="image">Image</option>
                  <option value="video">Vidéo</option>
                  <option value="gif">GIF</option>
                </select>
              </label>
              <label>
                Format
                <select
                  value={media.aspect}
                  onChange={(event) => {
                    const gallery = [...project.gallery];
                    gallery[mediaIndex] = {
                      ...media,
                      aspect: event.target.value as typeof media.aspect,
                    };
                    update("gallery", gallery);
                  }}
                >
                  <option value="wide">Large</option>
                  <option value="portrait">Portrait</option>
                  <option value="square">Carré</option>
                </select>
              </label>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  onQueueMediaDelete(media.url);
                  update(
                    "gallery",
                    project.gallery.filter((_, itemIndex) => itemIndex !== mediaIndex),
                  );
                }}
              >
                Retirer
              </button>
            </div>
            <label>
              URL
              <input
                type="url"
                value={media.url}
                onChange={(event) => {
                  queueReplacement(media.url, event.target.value);
                  const gallery = [...project.gallery];
                  gallery[mediaIndex] = { ...media, url: event.target.value };
                  update("gallery", gallery);
                }}
              />
            </label>
            <LocalizedField
              label="Texte alternatif"
              value={media.alt}
              onChange={(value) => {
                const gallery = [...project.gallery];
                gallery[mediaIndex] = { ...media, alt: value };
                update("gallery", gallery);
              }}
            />
            <LocalizedField
              label="Légende"
              value={media.caption}
              onChange={(value) => {
                const gallery = [...project.gallery];
                gallery[mediaIndex] = { ...media, caption: value };
                update("gallery", gallery);
              }}
            />
          </div>
        ))}
      </section>

      <section className="admin-form-section">
        <div className="admin-section-heading">
          <h3>Crédits</h3>
          <button
            type="button"
            onClick={() =>
              update("credits", [
                ...project.credits,
                { role: "Rôle", name: "Nom" },
              ])
            }
          >
            + Ajouter un crédit
          </button>
        </div>
        {project.credits.map((credit, creditIndex) => (
          <div className="admin-credit-row" key={`${project.id}-credit-${creditIndex}`}>
            <input
              aria-label="Rôle"
              value={credit.role}
              onChange={(event) => {
                const credits = [...project.credits];
                credits[creditIndex] = { ...credit, role: event.target.value };
                update("credits", credits);
              }}
            />
            <input
              aria-label="Nom"
              value={credit.name}
              onChange={(event) => {
                const credits = [...project.credits];
                credits[creditIndex] = { ...credit, name: event.target.value };
                update("credits", credits);
              }}
            />
            <button
              className="danger-button"
              type="button"
              onClick={() =>
                update(
                  "credits",
                  project.credits.filter((_, itemIndex) => itemIndex !== creditIndex),
                )
              }
            >
              Retirer
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
