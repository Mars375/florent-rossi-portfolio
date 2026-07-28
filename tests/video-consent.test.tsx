import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ExternalVideoConsentView } from "../app/components/ExternalVideoConsent";
import { VideoEmbed } from "../app/components/VideoEmbed";
import { defaultContent } from "../lib/content/fallback";

const externalProject = defaultContent.projects[0];
const consentCopy = defaultContent.legal.fr;

test("does not contact an external video provider before consent", () => {
  const markup = renderToStaticMarkup(
    <VideoEmbed
      project={externalProject}
      locale="fr"
      consentCopy={consentCopy}
    />,
  );

  assert.doesNotMatch(markup, /<iframe/);
  assert.doesNotMatch(markup, /player\.vimeo\.com/);
  assert.match(markup, /Charger la vidéo/);
  assert.match(markup, /afterdark-poster\.jpg/);
});

test("renders the sandboxed iframe only in the consented view", () => {
  const markup = renderToStaticMarkup(
    <ExternalVideoConsentView
      consented
      embedUrl="https://player.vimeo.com/video/76979871"
      notice="External service"
      buttonLabel="Load video"
      provider="Vimeo"
      posterUrl="/media/florent/afterdark-poster.jpg"
      title="Afterdark"
      onConsent={() => undefined}
    />,
  );

  assert.match(markup, /<iframe/);
  assert.match(markup, /player\.vimeo\.com\/video\/76979871/);
  assert.match(
    markup,
    /sandbox="allow-scripts allow-same-origin allow-presentation"/,
  );
});

test("keeps direct MP4 playback immediate", () => {
  const directProject = structuredClone(externalProject);
  directProject.fullVideo = {
    provider: "mp4",
    url: "https://example.com/film.mp4",
  };

  const markup = renderToStaticMarkup(
    <VideoEmbed
      project={directProject}
      locale="en"
      consentCopy={defaultContent.legal.en}
    />,
  );

  assert.match(markup, /<video/);
  assert.match(markup, /src="https:\/\/example\.com\/film\.mp4"/);
  assert.doesNotMatch(markup, /Load video/);
});
