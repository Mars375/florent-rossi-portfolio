import {
  parsePortfolioContent,
  type PortfolioContent,
  type Project,
} from "../../content/schema";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export type DraftPublisher = {
  saveDraft(content: PortfolioContent): Promise<PortfolioContent>;
  publish(): Promise<void>;
};

export function reorderProjects(
  projects: Project[],
  orderedIds: string[],
): Project[] {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const chosen = orderedIds
    .map((id) => byId.get(id))
    .filter((project): project is Project => Boolean(project));
  const chosenIds = new Set(chosen.map((project) => project.id));
  const remaining = projects
    .filter((project) => !chosenIds.has(project.id))
    .sort((a, b) => a.order - b.order);

  return [...chosen, ...remaining].map((project, index) => ({
    ...project,
    order: index + 1,
  }));
}

function uniqueCopyValue(
  base: string,
  projects: Project[],
  field: "id" | "slug",
): string {
  const used = new Set(projects.map((project) => project[field]));
  let candidate = `${base}-copy`;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = `${base}-copy-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function duplicateProject(
  source: Project,
  projects: Project[],
): Project {
  const duplicate = structuredClone(source);

  return {
    ...duplicate,
    id: uniqueCopyValue(source.id, projects, "id"),
    slug: uniqueCopyValue(source.slug, projects, "slug"),
    status: "hidden",
    order: projects.length + 1,
    title: {
      en: `${source.title.en} — copy`,
      fr: `${source.title.fr} — copie`,
    },
  };
}

export async function publishDraftWithRepository(
  value: unknown,
  repository: DraftPublisher,
): Promise<ActionResult> {
  try {
    const content = parsePortfolioContent(value);
    await repository.saveDraft(content);
    await repository.publish();
    return { ok: true, message: "Portfolio publié." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Publication impossible : ${error.message}`
          : "Publication impossible.",
    };
  }
}
