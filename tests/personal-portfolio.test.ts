import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";

test("presents Florent Rossi as one art director seeking a permanent role", () => {
  const parsed = parsePortfolioContent(content);
  const publicCopy = JSON.stringify({
    site: parsed.site,
    navigation: parsed.navigation,
    home: parsed.home,
    about: parsed.about,
  });

  assert.equal(parsed.site.name, "Florent Rossi");
  assert.equal(parsed.site.email, "m.rossiflorent@gmail.com");
  assert.equal(parsed.navigation.fr.about, "À propos");
  assert.equal(parsed.navigation.en.about, "About");
  assert.match(parsed.home.fr.intro, /poste permanent/i);
  assert.match(parsed.home.en.intro, /permanent position/i);
  assert.match(parsed.about.fr.intro, /je suis Florent Rossi/i);
  assert.match(parsed.about.en.intro, /I’m Florent Rossi/i);
  assert.doesNotMatch(
    publicCopy,
    /\bAtelier Vif\b|\bthe studio\b|\bcreative studio\b|\bNous\b|\bWe\b/,
  );
  assert.ok(
    parsed.projects.every((project) =>
      project.credits.some(
        (credit) =>
          credit.role === "Creative Direction" &&
          credit.name === "Florent Rossi",
      ),
    ),
  );
});

test("uses one distinct local motion loop and poster per project", () => {
  const parsed = parsePortfolioContent(content);
  const previews = parsed.projects.map((project) => project.preview.url);
  const posters = parsed.projects.map((project) => project.posterUrl);

  assert.equal(new Set(previews).size, 5);
  assert.equal(new Set(posters).size, 5);
  assert.ok(previews.every((url) => /^\/media\/florent\/.+-loop\.mp4$/.test(url)));
  assert.ok(posters.every((url) => /^\/media\/florent\/.+-poster\.jpg$/.test(url)));
});

test("keeps static public and admin branding personal", async () => {
  const files = [
    "app/[locale]/about/page.tsx",
    "app/admin/(protected)/layout.tsx",
    "app/admin/login/page.tsx",
    "app/admin/AdminEditor.tsx",
  ];
  const renderedCopy = await Promise.all(
    files.map((file) => readFile(resolve(process.cwd(), file), "utf8")),
  );

  assert.match(renderedCopy[0], /À propos|Florent Rossi/);
  assert.match(renderedCopy[1], /Florent Rossi/);
  assert.match(renderedCopy[2], /Florent Rossi/);
  assert.match(renderedCopy[3], /florent-rossi-content\.json/);
  assert.doesNotMatch(renderedCopy.join("\n"), /Atelier Vif|Studio & Contact/);
});
