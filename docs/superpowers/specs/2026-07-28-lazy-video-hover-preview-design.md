# Lazy Video Hover Preview Design

## Goal

Restore a visible, polished project preview on the portfolio home page without
making the initial page load download every animation.

## Confirmed root cause

The current cards only enable their GIF when both `(hover: hover)` and
`(pointer: fine)` match. Embedded and hybrid browsers can dispatch a real mouse
or pointer hover while one of those capability queries remains false. The
preview then stays permanently on the poster even though all five GIF and MP4
assets are valid and available in production.

## Chosen behavior

- Render only the static poster during the initial server render and page load.
- On the first real mouse hover, or keyboard focus of the project media link,
  mount the project's short local MP4 preview and play it muted, looped, and
  inline.
- Do not preload the MP4 before that first interaction.
- Pause the preview when hover or focus leaves. Keep the already fetched media
  available for a fast subsequent hover.
- If the MP4 cannot load or play, use the project's GIF as the visual fallback.
- Keep the static poster for touch pointers and when
  `prefers-reduced-motion: reduce` is active.
- Preserve the existing playing badge, three-second progress indicator, project
  navigation, keyboard focus styling, and no-zoom media treatment.

## Architecture

`ProjectCard` owns the interaction and playback state. A small pure preview
policy in `lib/content/preview.ts` decides whether an interaction may activate
motion based on:

- a usable MP4 or GIF source;
- pointer type (`mouse` for hover);
- keyboard focus;
- reduced-motion preference.

The card remains poster-first. It creates a `<video>` only after an eligible
interaction. The existing `preview.url` is the preferred MP4 source and
`preview.fallbackGifUrl` remains the fallback rather than the primary preview.
No content-schema or administration change is required.

## Performance

The committed MP4 loops are generally smaller than their GIF equivalents and
provide smoother color and motion. Because no animation source is requested
until interaction, the home page retains its current poster-first loading
profile. Only previews a visitor actually explores are downloaded.

## Failure handling

- MP4 load or playback failure switches that card to its GIF fallback.
- GIF failure returns the card to its poster for the rest of the mounted page.
- A failed preview never blocks the project link.
- Leaving the card pauses playback without resetting navigation or card state.

## Verification

Tests will prove:

1. the initial rendered card contains only the poster;
2. mouse hover and keyboard focus are eligible even when browser capability
   media queries would have rejected a hybrid device;
3. touch interaction and reduced motion keep the poster static;
4. MP4 is preferred and GIF remains the fallback;
5. no media zoom is introduced;
6. focused tests, the full suite, lint, TypeScript, and the production build
   remain green.

Production verification will confirm that the home HTML remains poster-first
and that preview assets are served successfully. Real interactive inspection
will be performed when a Browser backend is available.
