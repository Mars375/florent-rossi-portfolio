"use client";

import type {
  LegalContent,
  LegalLocaleContent,
} from "../../../content/legal";

const localeFields: Array<keyof LegalLocaleContent> = [
  "legalTitle",
  "legalIntro",
  "publisherLabel",
  "publisherText",
  "contactLabel",
  "hostLabel",
  "intellectualPropertyLabel",
  "intellectualPropertyText",
  "externalLinksLabel",
  "externalLinksText",
  "privacyTitle",
  "privacyIntro",
  "controllerLabel",
  "controllerText",
  "dataLabel",
  "dataText",
  "purposesLabel",
  "purposesText",
  "providersLabel",
  "providersText",
  "retentionLabel",
  "retentionText",
  "rightsLabel",
  "rightsText",
  "storageLabel",
  "storageText",
  "videosLabel",
  "videosText",
  "loadVideo",
  "externalVideoNotice",
  "footerLegal",
  "footerPrivacy",
  "updatedLabel",
];

export function LegalEditor({
  value,
  onChange,
}: {
  value: LegalContent;
  onChange: (value: LegalContent) => void;
}) {
  const edit = (mutate: (draft: LegalContent) => void) => {
    const draft = structuredClone(value);
    mutate(draft);
    onChange(draft);
  };

  return (
    <div className="admin-panel legal-editor">
      <section className="admin-form-section">
        <h2>Informations partagées</h2>
        <label>
          Dernière mise à jour
          <input
            type="date"
            value={value.updatedAt}
            onChange={(event) =>
              edit((draft) => {
                draft.updatedAt = event.target.value;
              })
            }
          />
        </label>
        <label>
          Hébergeur
          <input
            value={value.host.name}
            onChange={(event) =>
              edit((draft) => {
                draft.host.name = event.target.value;
              })
            }
          />
        </label>
        <label>
          Adresse de l’hébergeur
          <textarea
            value={value.host.address}
            onChange={(event) =>
              edit((draft) => {
                draft.host.address = event.target.value;
              })
            }
          />
        </label>
        <label>
          URL de l’hébergeur
          <input
            type="url"
            value={value.host.url}
            onChange={(event) =>
              edit((draft) => {
                draft.host.url = event.target.value;
              })
            }
          />
        </label>
      </section>

      {(["fr", "en"] as const).map((locale) => (
        <section className="admin-form-section" key={locale}>
          <h2>{locale === "fr" ? "Français" : "English"}</h2>
          {localeFields.map((field) => (
            <label key={field}>
              {field}
              <textarea
                rows={field.endsWith("Text") ? 5 : 2}
                value={value[locale][field]}
                onChange={(event) =>
                  edit((draft) => {
                    draft[locale][field] = event.target.value;
                  })
                }
              />
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}
