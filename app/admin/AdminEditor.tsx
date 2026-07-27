"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  parsePortfolioContent,
  type PortfolioContent,
} from "../../content/schema";
import {
  createSerialTaskQueue,
  duplicateProject,
  reorderProjects,
} from "../../lib/content/editor";
import { publishDraftAction, saveDraftAction } from "./actions";
import { LocalizedField } from "./components/LocalizedField";
import { ProjectEditor } from "./components/ProjectEditor";
import { PublishBar, type SaveStatus } from "./components/PublishBar";

type Tab = "site" | "home" | "about" | "projects";

const tabLabels: Record<Tab, string> = {
  site: "Site",
  home: "Accueil",
  about: "À propos",
  projects: "Projets",
};

export function AdminEditor({
  initialContent,
}: {
  initialContent: PortfolioContent;
}) {
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<Tab>("site");
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialContent.projects[0]?.id ?? "",
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const mounted = useRef(false);
  const revision = useRef(0);
  const saveQueue = useRef(createSerialTaskQueue());
  const pendingMediaDeletes = useRef(new Set<string>());

  const queueMediaDelete = (url: string) => {
    if (url) pendingMediaDeletes.current.add(url);
  };

  const edit = (mutate: (draft: PortfolioContent) => void) => {
    setContent((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
    revision.current += 1;
    setSaveStatus("unsaved");
    setMessage("");
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const currentRevision = revision.current;
    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      const result = await saveQueue.current.run(() => saveDraftAction(content));

      if (revision.current !== currentRevision) return;
      setSaveStatus(result.ok ? "saved" : "error");
      setMessage(result.ok ? "" : result.message);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [content]);

  const publish = async () => {
    if (
      !window.confirm(
        "Publier ce brouillon ? Le site public sera immédiatement remplacé.",
      )
    ) {
      return;
    }

    setPublishing(true);
    await saveQueue.current.idle();
    const result = await publishDraftAction(content, [
      ...pendingMediaDeletes.current,
    ]);
    if (result.ok) pendingMediaDeletes.current.clear();
    setPublishing(false);
    setMessage(result.message);
    setSaveStatus(result.ok ? "saved" : "error");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "florent-rossi-content.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = parsePortfolioContent(JSON.parse(await file.text()));
      setContent(parsed);
      setSelectedProjectId(parsed.projects[0].id);
      revision.current += 1;
      setSaveStatus("unsaved");
      setMessage("Fichier importé. Enregistrement du brouillon en cours.");
    } catch (error) {
      setSaveStatus("error");
      setMessage(
        error instanceof Error
          ? `Import refusé : ${error.message}`
          : "Import refusé : JSON invalide.",
      );
    }
  };

  const moveProject = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= content.projects.length) return;
    const ids = [...content.projects]
      .sort((a, b) => a.order - b.order)
      .map((project) => project.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    edit((draft) => {
      draft.projects = reorderProjects(draft.projects, ids);
    });
  };

  const selectedProjectIndex = content.projects.findIndex(
    (project) => project.id === selectedProjectId,
  );
  const selectedProject =
    content.projects[selectedProjectIndex] ?? content.projects[0];

  return (
    <main className="admin-dashboard admin-editor">
      <div className="admin-editor-intro">
        <div>
          <p className="section-label">Portfolio / Brouillon</p>
          <h1>Éditeur</h1>
        </div>
        <div className="admin-tools">
          <Link href="/admin/preview/fr" target="_blank">
            Aperçu FR ↗
          </Link>
          <Link href="/admin/preview/en" target="_blank">
            Aperçu EN ↗
          </Link>
          <button type="button" onClick={exportJson}>
            Exporter JSON
          </button>
          <label className="admin-file-button">
            Importer JSON
            <input type="file" accept="application/json,.json" onChange={importJson} />
          </label>
        </div>
      </div>

      <nav className="admin-tabs" aria-label="Sections de l’éditeur">
        {(Object.keys(tabLabels) as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
          >
            {tabLabels[item]}
            {item === "projects" ? ` (${content.projects.length})` : ""}
          </button>
        ))}
      </nav>

      <div className="admin-editor-body">
        {tab === "site" ? (
          <div className="admin-panel">
            <section className="admin-form-section">
              <h2>Informations générales</h2>
              <div className="admin-grid admin-grid-2">
                <label>
                  Nom affiché
                  <input
                    value={content.site.name}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.site.name = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  E-mail public
                  <input
                    type="email"
                    value={content.site.email}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.site.email = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Copyright
                  <input
                    value={content.site.copyright}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.site.copyright = event.target.value;
                      })
                    }
                  />
                </label>
              </div>
              <LocalizedField
                label="Localisation"
                value={content.site.location}
                onChange={(value) =>
                  edit((draft) => {
                    draft.site.location = value;
                  })
                }
              />
            </section>

            <section className="admin-form-section">
              <h2>Navigation</h2>
              {(["fr", "en"] as const).map((locale) => (
                <fieldset className="admin-language-card" key={locale}>
                  <legend>{locale.toUpperCase()}</legend>
                  {(["work", "about", "contact"] as const).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        value={content.navigation[locale][key]}
                        onChange={(event) =>
                          edit((draft) => {
                            draft.navigation[locale][key] = event.target.value;
                          })
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
            </section>

            <section className="admin-form-section">
              <h2>Réseaux</h2>
              {content.site.socials.map((social, index) => (
                <div className="admin-credit-row" key={`social-${index}`}>
                  <input
                    aria-label="Nom du réseau"
                    value={social.label}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.site.socials[index].label = event.target.value;
                      })
                    }
                  />
                  <input
                    aria-label="URL du réseau"
                    type="url"
                    value={social.url}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.site.socials[index].url = event.target.value;
                      })
                    }
                  />
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() =>
                      edit((draft) => {
                        draft.site.socials.splice(index, 1);
                      })
                    }
                  >
                    Retirer
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  edit((draft) => {
                    draft.site.socials.push({
                      label: "Réseau",
                      url: "https://example.com",
                    });
                  })
                }
              >
                + Ajouter un réseau
              </button>
            </section>
          </div>
        ) : null}

        {tab === "home" ? (
          <div className="admin-panel">
            {(["fr", "en"] as const).map((locale) => (
              <section className="admin-form-section" key={locale}>
                <h2>Accueil {locale.toUpperCase()}</h2>
                {(Object.keys(content.home[locale]) as Array<
                  keyof (typeof content.home)[typeof locale]
                >).map((key) => (
                  <label key={key}>
                    {key}
                    <textarea
                      rows={key === "intro" || key === "profile" ? 4 : 2}
                      value={content.home[locale][key]}
                      onChange={(event) =>
                        edit((draft) => {
                          draft.home[locale][key] = event.target.value;
                        })
                      }
                    />
                  </label>
                ))}
              </section>
            ))}
            <section className="admin-form-section">
              <h2>Libellés des études de cas</h2>
              {(["fr", "en"] as const).map((locale) => (
                <fieldset className="admin-language-card" key={locale}>
                  <legend>{locale.toUpperCase()}</legend>
                  {(Object.keys(content.projectPage[locale]) as Array<
                    keyof (typeof content.projectPage)[typeof locale]
                  >).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        value={content.projectPage[locale][key]}
                        onChange={(event) =>
                          edit((draft) => {
                            draft.projectPage[locale][key] = event.target.value;
                          })
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
            </section>
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="admin-panel">
            <section className="admin-form-section">
              <h2>Éléments partagés</h2>
              <div className="admin-grid admin-grid-2">
                <label>
                  Petit label
                  <input
                    value={content.about.label}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.about.label = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Portrait / visuel
                  <input
                    type="url"
                    value={content.about.imageUrl}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.about.imageUrl = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Clients (un par ligne)
                  <textarea
                    rows={7}
                    value={content.about.clients.join("\n")}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.about.clients = event.target.value
                          .split("\n")
                          .filter(Boolean);
                      })
                    }
                  />
                </label>
                <label>
                  Distinctions (une par ligne)
                  <textarea
                    rows={7}
                    value={content.about.recognition.join("\n")}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.about.recognition = event.target.value
                          .split("\n")
                          .filter(Boolean);
                      })
                    }
                  />
                </label>
              </div>
            </section>

            {(["fr", "en"] as const).map((locale) => (
              <section className="admin-form-section" key={locale}>
                <h2>Profil {locale.toUpperCase()}</h2>
                {(
                  [
                    "title",
                    "imageAlt",
                    "intro",
                    "manifesto",
                    "practiceLabel",
                    "clientsLabel",
                    "recognitionLabel",
                    "availability",
                    "credentials",
                    "footerTitle",
                  ] as const
                ).map((key) => (
                  <label key={key}>
                    {key}
                    <textarea
                      rows={["intro", "manifesto"].includes(key) ? 4 : 2}
                      value={content.about[locale][key]}
                      onChange={(event) =>
                        edit((draft) => {
                          draft.about[locale][key] = event.target.value;
                        })
                      }
                    />
                  </label>
                ))}
                <label>
                  Services (un par ligne)
                  <textarea
                    rows={7}
                    value={content.about[locale].services.join("\n")}
                    onChange={(event) =>
                      edit((draft) => {
                        draft.about[locale].services = event.target.value
                          .split("\n")
                          .filter(Boolean);
                      })
                    }
                  />
                </label>
                <h3>Processus</h3>
                {content.about[locale].process.map((step, index) => (
                  <div className="admin-credit-row" key={`${locale}-process-${index}`}>
                    <input
                      aria-label="Titre de l’étape"
                      value={step.title}
                      onChange={(event) =>
                        edit((draft) => {
                          draft.about[locale].process[index].title =
                            event.target.value;
                        })
                      }
                    />
                    <textarea
                      aria-label="Description de l’étape"
                      rows={3}
                      value={step.text}
                      onChange={(event) =>
                        edit((draft) => {
                          draft.about[locale].process[index].text =
                            event.target.value;
                        })
                      }
                    />
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() =>
                        edit((draft) => {
                          draft.about[locale].process.splice(index, 1);
                        })
                      }
                    >
                      Retirer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    edit((draft) => {
                      draft.about[locale].process.push({
                        title: "Nouvelle étape",
                        text: "Description",
                      });
                    })
                  }
                >
                  + Ajouter une étape
                </button>
              </section>
            ))}
          </div>
        ) : null}

        {tab === "projects" ? (
          <div className="admin-project-layout">
            <aside className="admin-project-list">
              {content.projects
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    aria-current={
                      selectedProject?.id === project.id ? "page" : undefined
                    }
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <span>{String(project.order).padStart(2, "0")}</span>
                    <strong>{project.title.fr}</strong>
                    <small>
                      {project.status === "published" ? "Visible" : "Masqué"}
                    </small>
                  </button>
                ))}
              <button
                className="admin-add-project"
                type="button"
                onClick={() => {
                  const project = duplicateProject(
                    content.projects[0],
                    content.projects,
                  );
                  edit((draft) => {
                    draft.projects.push(project);
                  });
                  setSelectedProjectId(project.id);
                }}
              >
                + Nouveau projet
              </button>
            </aside>

            {selectedProject ? (
              <ProjectEditor
                project={selectedProject}
                index={selectedProjectIndex}
                total={content.projects.length}
                onChange={(project) =>
                  edit((draft) => {
                    const index = draft.projects.findIndex(
                      (item) => item.id === selectedProject.id,
                    );
                    draft.projects[index] = project;
                    if (project.id !== selectedProject.id) {
                      setSelectedProjectId(project.id);
                    }
                  })
                }
                onMove={(direction) =>
                  moveProject(selectedProjectIndex, direction)
                }
                onDuplicate={() => {
                  const project = duplicateProject(
                    selectedProject,
                    content.projects,
                  );
                  edit((draft) => {
                    draft.projects.push(project);
                  });
                  setSelectedProjectId(project.id);
                }}
                onQueueMediaDelete={queueMediaDelete}
                onDelete={() => {
                  if (
                    content.projects.length <= 1 ||
                    !window.confirm(
                      `Supprimer définitivement « ${selectedProject.title.fr} » du brouillon ?`,
                    )
                  ) {
                    return;
                  }
                  queueMediaDelete(selectedProject.posterUrl);
                  queueMediaDelete(selectedProject.preview.url);
                  queueMediaDelete(selectedProject.preview.fallbackGifUrl);
                  selectedProject.gallery.forEach((media) =>
                    queueMediaDelete(media.url),
                  );
                  const remaining = content.projects.filter(
                    (project) => project.id !== selectedProject.id,
                  );
                  edit((draft) => {
                    draft.projects = reorderProjects(
                      remaining,
                      remaining.map((project) => project.id),
                    );
                  });
                  setSelectedProjectId(remaining[0].id);
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <PublishBar
        status={saveStatus}
        message={message}
        onPublish={publish}
        publishing={publishing}
      />
    </main>
  );
}
