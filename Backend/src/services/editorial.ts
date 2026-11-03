import { AppError, ValidationError } from "../errors/AppError";
import {
  IExternalProblemApi,
  PlaygroundSnippet,
} from "../interfaces/IExternalProblemApi";

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

type DraftBlock =
  | EditorialBlock
  | { type: "playground"; uuid: string };

const PREFERRED_LANGUAGES: Array<[string, string, string]> = [
  ["javascript", "javascript", "JavaScript"],
  ["python3", "python", "Python"],
  ["python", "python", "Python"],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function cleanInline(value: string): string {
  return decodeEntities(value)
    .replace(/\$\$([^$]+)\$\$/g, "$1")
    .replace(/(^|[^$])\$([^$\n]+)\$(?!\d)/g, "$1$2")
    .replace(/\bO\(([^)]+)\)/g, "`O($1)`")
    .replace(/\s+/g, " ")
    .trim();
}

function languageLabel(slug: string): string {
  const known = PREFERRED_LANGUAGES.find((entry) => entry[0] === slug);
  if (known) return known[2];
  if (slug === "cpp") return "C++";
  if (slug === "csharp") return "C#";
  if (!slug) return "Code";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function selectSolutionSamples(
  rows: PlaygroundSnippet[],
): EditorialCodeSample[] {
  const byLang = new Map(
    rows
      .filter((row) => row.code.trim().length > 0)
      .map((row) => [row.langSlug, row.code.trim().slice(0, 20_000)]),
  );
  const picked: EditorialCodeSample[] = [];
  for (const [slug, language, label] of PREFERRED_LANGUAGES) {
    const code = byLang.get(slug);
    if (!code || picked.some((sample) => sample.label === label)) continue;
    picked.push({ language, label, code });
  }
  if (picked.length > 0) return picked;
  const fallback = rows.find((row) => row.code.trim().length > 0);
  if (!fallback) return [];
  return [
    {
      language: fallback.langSlug || "text",
      label: languageLabel(fallback.langSlug),
      code: fallback.code.trim().slice(0, 20_000),
    },
  ];
}

function liftPreformattedCode(raw: string): string {
  return raw.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_match, inner: string) => {
    const code = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
    return code ? `\n\`\`\`\n${code}\n\`\`\`\n` : "";
  });
}

export function parseEditorial(raw: string): DraftBlock[] {
  const lines = liftPreformattedCode(raw).replace(/\r\n/g, "\n").split("\n");
  const blocks: DraftBlock[] = [];
  let list: string[] | null = null;
  let fence: { lang: string; lines: string[] } | null = null;
  let skippingVideo = false;

  const flushList = () => {
    if (list && list.length > 0) blocks.push({ type: "list", items: list });
    list = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? "";
    if (fence) {
      if (rawLine.trim().startsWith("```")) {
        const code = fence.lines.join("\n").trim();
        if (code) {
          blocks.push({
            type: "code",
            samples: [
              {
                language: fence.lang || "text",
                label: languageLabel(fence.lang),
                code: code.slice(0, 20_000),
              },
            ],
          });
        }
        fence = null;
      } else {
        fence.lines.push(rawLine);
      }
      continue;
    }

    const line = rawLine.trim();
    if (line.startsWith("```")) {
      flushList();
      fence = { lang: line.slice(3).trim().toLowerCase(), lines: [] };
      continue;
    }

    const playground = /playground\/([A-Za-z0-9]{4,32})\/shared/i.exec(line);
    if (playground?.[1]) {
      flushList();
      blocks.push({ type: "playground", uuid: playground[1] });
      continue;
    }

    if (/^#{1,3}\s+video solution\b/i.test(line)) {
      flushList();
      skippingVideo = true;
      continue;
    }
    if (skippingVideo) {
      if (/^#{1,2}\s+\S/.test(line) && !/video solution/i.test(line)) {
        skippingVideo = false;
      } else {
        continue;
      }
    }

    if (
      !line ||
      line === "[TOC]" ||
      /^<\/?div\b/i.test(line) ||
      /^<\/?iframe\b/i.test(line)
    ) {
      if (!line && list) {
        const next = lines
          .slice(index + 1)
          .map((candidate) => candidate.trim())
          .find((candidate) => candidate.length > 0);
        if (next && /^(?:\*|-|\d+\.)\s+\S/.test(next)) continue;
      }
      flushList();
      continue;
    }
    if (line === "---") {
      flushList();
      blocks.push({ type: "divider" });
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading?.[1] && heading[2]) {
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length === 2 ? 2 : 3,
        text: cleanInline(heading[2]).replace(/\*\*/g, ""),
      });
      continue;
    }

    const item = /^(?:\*|-|\d+\.)\s+(.+)$/.exec(line);
    if (item?.[1]) {
      list ??= [];
      list.push(cleanInline(item[1]));
      continue;
    }

    if (list && list.length > 0) {
      const continuation = cleanInline(line.replace(/<[^>]+>/g, ""));
      if (continuation) {
        const last = list.length - 1;
        list[last] = `${list[last]} ${continuation}`;
        continue;
      }
    }

    flushList();
    const cleaned = cleanInline(line.replace(/<[^>]+>/g, ""));
    if (!cleaned) continue;
    const label = /^\*\*([^*]+)\*\*$/.exec(cleaned);
    if (label?.[1]) {
      blocks.push({ type: "label", text: label[1].trim() });
      continue;
    }
    blocks.push({ type: "paragraph", text: cleaned });
  }

  flushList();
  const compact: DraftBlock[] = [];
  for (const block of blocks) {
    if (
      block.type === "divider" &&
      (compact.length === 0 || compact[compact.length - 1]?.type === "divider")
    ) {
      continue;
    }
    compact.push(block);
  }
  while (compact[compact.length - 1]?.type === "divider") compact.pop();
  return compact;
}

async function hydratePlaygrounds(
  drafts: DraftBlock[],
  fetchPlayground: IExternalProblemApi["fetchPlayground"],
): Promise<EditorialBlock[]> {
  const ids = [
    ...new Set(
      drafts
        .filter(
          (block): block is { type: "playground"; uuid: string } =>
            block.type === "playground",
        )
        .map((block) => block.uuid),
    ),
  ].slice(0, 8);
  const samples = new Map<string, EditorialCodeSample[]>();
  await Promise.all(
    ids.map(async (uuid) => {
      try {
        samples.set(uuid, selectSolutionSamples(await fetchPlayground(uuid)));
      } catch {
        samples.set(uuid, []);
      }
    }),
  );

  const blocks: EditorialBlock[] = [];
  for (const draft of drafts) {
    if (draft.type !== "playground") {
      blocks.push(draft);
      continue;
    }
    const code = samples.get(draft.uuid) ?? [];
    if (code.length > 0) blocks.push({ type: "code", samples: code });
  }
  return blocks;
}

export async function buildEditorial(
  slug: string,
  api: Pick<IExternalProblemApi, "fetchFromVercel" | "fetchPlayground">,
): Promise<{ blocks: EditorialBlock[] }> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    throw new ValidationError("Invalid problem");
  }
  let raw: unknown;
  try {
    raw = await api.fetchFromVercel(slug);
  } catch {
    throw new AppError("Editorial is unavailable right now.", 503);
  }
  const solution = isRecord(raw) ? raw["solution"] : undefined;
  if (!isRecord(solution) || solution["canSeeDetail"] === false) {
    return { blocks: [] };
  }
  const content = solution["content"];
  if (typeof content !== "string" || !content.trim()) return { blocks: [] };
  const drafts = parseEditorial(content.slice(0, 200_000));
  return { blocks: await hydratePlaygrounds(drafts, (uuid) => api.fetchPlayground(uuid)) };
}
