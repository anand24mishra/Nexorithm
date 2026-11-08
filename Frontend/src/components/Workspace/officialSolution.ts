import { API_BASE } from "../../api/authApi";
import { editorialFromProblemPayload } from "./editorialArticle";

export interface EditorialCodeSample {
  language: string;
  label: string;
  code: string;
}

export type EditorialBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "label"; text: string }
  | { type: "list"; items: string[] }
  | { type: "divider" }
  | { type: "code"; samples: EditorialCodeSample[] };

function isBlock(value: unknown): value is EditorialBlock {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const type = (value as { type?: unknown }).type;
  return (
    type === "heading" ||
    type === "paragraph" ||
    type === "label" ||
    type === "list" ||
    type === "divider" ||
    type === "code"
  );
}

const PUBLIC_PROBLEM_URL = "https://leetcode-api-pied.vercel.app/problem";

async function fetchPublishedEditorial(
  slug: string,
  signal?: AbortSignal,
): Promise<EditorialBlock[] | null> {
  const response = await fetch(
    `${API_BASE}/problems/${encodeURIComponent(slug)}/editorial`,
    { signal },
  );
  if (response.status === 404 || response.status === 405) return null;
  if (!response.ok) throw new Error("Editorial is unavailable right now.");
  const body = (await response.json()) as { blocks?: unknown };
  return Array.isArray(body.blocks) ? body.blocks.filter(isBlock) : [];
}

async function fetchPublicEditorial(
  slug: string,
  signal?: AbortSignal,
): Promise<EditorialBlock[]> {
  const response = await fetch(
    `${PUBLIC_PROBLEM_URL}/${encodeURIComponent(slug)}`,
    { signal },
  );
  if (!response.ok) throw new Error("Editorial is unavailable right now.");
  return editorialFromProblemPayload(await response.json());
}

export async function fetchOfficialSolution(
  slug: string,
  signal?: AbortSignal,
): Promise<EditorialBlock[]> {
  const published = await fetchPublishedEditorial(slug, signal).catch(
    (error: unknown) => {
      if (signal?.aborted) throw error;
      return null;
    },
  );
  if (published && published.length > 0) return published;
  return fetchPublicEditorial(slug, signal);
}
