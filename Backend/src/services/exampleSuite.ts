import { NexorithmProblem, TestCase } from "../types";

const EXAMPLE =
  /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=\s*(?:Explanation\s*:|Example\b|Constraints\s*:|Follow-up\s*:|Input\s*:)|$)/gi;

function decodeProblemText(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|pre|div|li|h[1-6]|tr|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;|&#38;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;|&#60;/gi, "<")
    .replace(/&gt;|&#62;/gi, ">")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\u00a0/g, " ");
}

function toJsonLiteral(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return null;
  }
}

function splitAssignments(input: string): string[] | null {
  const values: string[] = [];
  const source = input.trim();
  let index = 0;
  while (index < source.length) {
    const name = /^[A-Za-z_][A-Za-z0-9_]*\s*=\s*/.exec(source.slice(index));
    if (!name) return null;
    index += name[0].length;
    const start = index;
    let depth = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;
    for (; index < source.length; index++) {
      const char = source[index];
      if (quote) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === "\\") {
          escaped = true;
          continue;
        }
        if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === "[" || char === "{" || char === "(") depth += 1;
      else if (char === "]" || char === "}" || char === ")") depth -= 1;
      else if (char === "," && depth === 0) {
        if (/^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(source.slice(index + 1)))
          break;
      }
    }
    if (quote || depth !== 0) return null;
    const json = toJsonLiteral(source.slice(start, index));
    if (json == null) return null;
    values.push(json);
    if (source[index] === ",") {
      index += 1;
      while (" \n\r\t".includes(source[index] ?? "")) index += 1;
    }
  }
  return values.length ? values : null;
}

function normalizeInput(block: string): string | null {
  const trimmed = block.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed)) {
    const values = splitAssignments(trimmed);
    return values ? values.join("\n") : null;
  }
  return toJsonLiteral(trimmed);
}

export function testCasesFromExamples(content: string): TestCase[] {
  if (!content.trim()) return [];
  const text = decodeProblemText(content);
  const cases: TestCase[] = [];
  for (const match of text.matchAll(EXAMPLE)) {
    if (cases.length >= 100) break;
    const input = normalizeInput(match[1] ?? "");
    const expectedOutput = toJsonLiteral(match[2] ?? "");
    if (!input || expectedOutput == null) continue;
    if (input.length > 20000 || expectedOutput.length > 20000) continue;
    cases.push({ input, expectedOutput, isHidden: false });
  }
  return cases;
}

export function applyAuthoritativeSuite<T extends NexorithmProblem>(
  problem: T,
): T {
  if (problem.testCases.length > 0) return problem;
  const testCases = testCasesFromExamples(problem.content);
  if (!testCases.length) return problem;
  return {
    ...problem,
    testCases,
    sampleInput: problem.sampleInput || testCases[0].input,
    sampleOutput: problem.sampleOutput || testCases[0].expectedOutput,
  };
}
