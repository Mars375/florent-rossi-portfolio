import type { LocalizedText } from "../../../content/schema";

export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
}) {
  return (
    <fieldset className="admin-localized-field">
      <legend>{label}</legend>
      {(["fr", "en"] as const).map((locale) => (
        <label key={locale}>
          <span>{locale.toUpperCase()}</span>
          {multiline ? (
            <textarea
              value={value[locale]}
              rows={4}
              onChange={(event) =>
                onChange({ ...value, [locale]: event.target.value })
              }
            />
          ) : (
            <input
              value={value[locale]}
              onChange={(event) =>
                onChange({ ...value, [locale]: event.target.value })
              }
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}
