import type { EditorialBlock, EditorialCodeSample } from "./officialSolution";

type DraftBlock = EditorialBlock | { type: "playground"; uuid: string };

const PREFERRED_LANGUAGES: Array<[string, string, string]> = [
  ["javascript", "javascript", "JavaScript"],
  ["python3", "python", "Python"],
  ["python", "python", "Python"],
];

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

function liftPreformattedCode(raw: string): string {
  return raw.replace(
    /<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_match, inner: string) => {
      const code = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
      return code ? `\n\`\`\`\n${code}\n\`\`\`\n` : "";
    },
  );
}

function parseDrafts(raw: string): DraftBlock[] {
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

export function parseEditorialArticle(raw: string): EditorialBlock[] {
  return parseDrafts(raw).filter(
    (block): block is EditorialBlock => block.type !== "playground",
  );
}

export function editorialFromProblemPayload(
  payload: unknown,
): EditorialBlock[] {
  if (!payload || typeof payload !== "object") return [];
  const solution = (payload as { solution?: unknown }).solution;
  if (!solution || typeof solution !== "object") return [];
  const record = solution as { canSeeDetail?: unknown; content?: unknown };
  if (record.canSeeDetail === false) return [];
  if (typeof record.content !== "string" || !record.content.trim()) return [];
  return parseEditorialArticle(record.content.slice(0, 200_000));
}

export type { EditorialCodeSample };
