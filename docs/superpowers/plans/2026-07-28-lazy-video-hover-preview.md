# Lazy Video Hover Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a polished project-card preview by lazily playing the local MP4 on real mouse hover or keyboard focus, with GIF fallback and no initial animation download.

**Architecture:** Keep every card poster-first, derive its preferred MP4 and fallback GIF through pure preview helpers, and use the actual pointer event rather than browser capability media queries. `ProjectCard` mounts a muted inline video only after an eligible interaction, pauses it when interaction ends, and falls back to the GIF after media failure.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Node test runner with TSX, local MP4/GIF media, Vercel.

## Global Constraints

- Initial server and client rendering must request only the poster.
- A real mouse pointer or keyboard focus may activate motion.
- Touch pointers and `prefers-reduced-motion: reduce` must keep the poster static.
- Prefer the project's local MP4; use its GIF only after MP4 failure or when the project is configured directly as GIF.
- Keep the video muted, looped, inline, and `preload="none"`.
- Pause rather than discard a successfully mounted video when interaction ends.
- Preserve the playing badge, progress bar, project links, focus styles, and no-zoom behavior.
- Do not add a runtime dependency or change the content schema/admin interface.

---

### Task 1: Replace capability-gated GIF hover with lazy MP4 playback

**Files:**
- Modify: `lib/content/preview.ts`
- Modify: `app/components/ProjectCard.tsx`
- Modify: `app/globals.css`
- Modify: `tests/preview.test.ts`
- Modify: `tests/project-card.test.tsx`

**Interfaces:**
- Produces: `projectPreviewSources(project): { videoUrl: string; gifUrl: string }`.
- Produces: `canActivateAnimatedPreview({ videoUrl, gifUrl, interaction, reducedMotion }): boolean`.
- `interaction` is `"mouse" | "focus" | "touch"`.
- Consumes: existing `Project.preview`, `Project.posterUrl`, playing label, and three-second progress styles.

- [ ] **Step 1: Write the failing preview-policy tests**

Replace the capability-query policy test in `tests/preview.test.ts` with:

```ts
import {
  canActivateAnimatedPreview,
  projectPreviewSources,
} from "../lib/content/preview";

test("prefers MP4 with GIF fallback for project-card motion", () => {
  assert.deepEqual(projectPreviewSources(project), {
    videoUrl: "/media/florent/afterdark-loop.mp4",
    gifUrl: "/media/florent/afterdark-preview.gif",
  });
});

test("activates motion from real mouse or focus but not touch or reduced motion", () => {
  const eligible = {
    videoUrl: "/media/florent/afterdark-loop.mp4",
    gifUrl: "/media/florent/afterdark-preview.gif",
    reducedMotion: false,
  };

  assert.equal(
    canActivateAnimatedPreview({ ...eligible, interaction: "mouse" }),
    true,
  );
  assert.equal(
    canActivateAnimatedPreview({ ...eligible, interaction: "focus" }),
    true,
  );
  assert.equal(
    canActivateAnimatedPreview({ ...eligible, interaction: "touch" }),
    false,
  );
  assert.equal(
    canActivateAnimatedPreview({
      ...eligible,
      interaction: "mouse",
      reducedMotion: true,
    }),
    false,
  );
  assert.equal(
    canActivateAnimatedPreview({
      videoUrl: "",
      gifUrl: "",
      interaction: "mouse",
      reducedMotion: false,
    }),
    false,
  );
});
```

Extend `tests/project-card.test.tsx` so the static-render test also asserts:

```ts
assert.doesNotMatch(markup, /<video/);
assert.doesNotMatch(markup, /afterdark-preview\.gif/);
assert.doesNotMatch(markup, /afterdark-loop\.mp4/);
```

Add this PostCSS assertion to the existing card-style test:

```ts
let sharedMediaGeometry: Record<string, string> = {};

root.walkRules((rule) => {
  const selectors = rule.selectors.map((selector) => selector.trim());
  if (
    selectors.includes(".project-media img") &&
    selectors.includes(".project-media video")
  ) {
    rule.walkDecls((declaration) => {
      if (
        ["position", "inset", "width", "height", "object-fit"].includes(
          declaration.prop,
        )
      ) {
        sharedMediaGeometry[declaration.prop] = declaration.value;
      }
    });
  }
});

assert.deepEqual(sharedMediaGeometry, {
  position: "absolute",
  inset: "0",
  width: "100%",
  height: "100%",
  "object-fit": "cover",
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/preview.test.ts tests/project-card.test.tsx
```

Expected: FAIL because `projectPreviewSources` and
`canActivateAnimatedPreview` do not exist and the current policy still requires
capability media-query booleans.

- [ ] **Step 3: Implement the pure preview policy**

In `lib/content/preview.ts`, keep `projectPreviewGifUrl` for compatibility and
add:

```ts
export type PreviewInteraction = "mouse" | "focus" | "touch";

export function projectPreviewSources(project: Project) {
  return {
    videoUrl: project.preview.type === "video" ? project.preview.url : "",
    gifUrl: projectPreviewGifUrl(project),
  };
}

export function canActivateAnimatedPreview({
  videoUrl,
  gifUrl,
  interaction,
  reducedMotion,
}: {
  videoUrl: string;
  gifUrl: string;
  interaction: PreviewInteraction;
  reducedMotion: boolean;
}): boolean {
  return (
    Boolean(videoUrl || gifUrl) &&
    !reducedMotion &&
    interaction !== "touch"
  );
}
```

Remove the obsolete `canHover` and `finePointer` policy.

- [ ] **Step 4: Implement poster-first lazy video interaction**

Update `ProjectCard` to:

1. subscribe only to `prefers-reduced-motion`;
2. use `onPointerEnter`/`onPointerLeave`, accepting only
   `event.pointerType === "mouse"`;
3. keep focus as the keyboard activation path;
4. set `hasActivated` after the first eligible mouse/focus interaction;
5. mount the MP4 only when `hasActivated` is true;
6. call `video.play()` while active and `video.pause()` when inactive;
7. set `videoFailed` when loading or playback rejects;
8. display the GIF only while active after MP4 failure;
9. return to the poster if the GIF also fails.

The mounted video must use:

```tsx
<video
  ref={videoRef}
  muted
  loop
  playsInline
  preload="none"
  poster={project.posterUrl}
  aria-hidden="true"
  onError={() => setVideoFailed(true)}
>
  <source src={videoUrl} type="video/mp4" />
</video>
```

Keep the video mounted after successful activation and toggle a visibility
class so later hovers reuse the fetched media.

- [ ] **Step 5: Style video and fallback without zoom**

Make `.project-media video` share the image geometry:

```css
.project-media img,
.project-media video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Use opacity/visibility classes only. Do not add transform scaling or transform
transitions.

- [ ] **Step 6: Run focused and complete verification**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/preview.test.ts tests/project-card.test.tsx
node node_modules/tsx/dist/cli.mjs --test "tests/**/*.test.ts" "tests/**/*.test.tsx"
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
git diff --check
```

Expected: all commands succeed with pristine output.

- [ ] **Step 7: Commit**

```powershell
git add lib/content/preview.ts app/components/ProjectCard.tsx app/globals.css tests/preview.test.ts tests/project-card.test.tsx
git commit -m "fix: restore lazy video hover previews"
```

---
