import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors/AppError";
import {
  buildEditorial,
  parseEditorial,
  selectSolutionSamples,
} from "../src/services/editorial";

const article = `
[TOC]

## Video Solution

<div class="video-container">
<iframe src="https://player.vimeo.com/video/123"></iframe>
</div>

## Solution Article

### Approach 1: Scan

**Intuition**

Check every pair until the values add up.

<iframe src="https://leetcode.com/playground/Ab12Cd34/shared" width="100%"></iframe>

**Complexity Analysis**

* Time complexity: $$O(n^2)$$.
* Space complexity: $$O(1)$$.

---

\`\`\`python
class Solution:
    def solve(self):
        return []
\`\`\`
`;

describe("editorial", () => {
  it("keeps each approach's explanation and replaces playgrounds with code", () => {
    const blocks = parseEditorial(article);
    expect(blocks.some((block) => block.type === "heading" && block.text === "Video Solution")).toBe(false);
    expect(blocks).toEqual(
      expect.arrayContaining([
        { type: "heading", level: 2, text: "Solution Article" },
        { type: "heading", level: 3, text: "Approach 1: Scan" },
        { type: "label", text: "Intuition" },
        { type: "paragraph", text: "Check every pair until the values add up." },
        { type: "playground", uuid: "Ab12Cd34" },
        { type: "label", text: "Complexity Analysis" },
        {
          type: "list",
          items: ["Time complexity: `O(n^2)`.", "Space complexity: `O(1)`."],
        },
        {
          type: "code",
          samples: [
            {
              language: "python",
              label: "Python",
              code: "class Solution:\n    def solve(self):\n        return []",
            },
          ],
        },
      ]),
    );
  });

  it("keeps complexity notes and their explanations in one list", () => {
    const blocks = parseEditorial(`
**Complexity Analysis**

* Time complexity: $$O(n)$$.
Each value is visited once.

* Space complexity: $$O(1)$$.
Only a few variables are stored.
`);
    expect(blocks).toContainEqual({
      type: "list",
      items: [
        "Time complexity: `O(n)`. Each value is visited once.",
        "Space complexity: `O(1)`. Only a few variables are stored.",
      ],
    });
  });

  it("prefers JavaScript and Python over other playground languages", () => {
    expect(
      selectSolutionSamples([
        { langSlug: "cpp", code: "int main(){}" },
        { langSlug: "javascript", code: "function solve(){ return []; }" },
        { langSlug: "python3", code: "class Solution:\n    pass" },
      ]),
    ).toEqual([
      { language: "javascript", label: "JavaScript", code: "function solve(){ return []; }" },
      { language: "python", label: "Python", code: "class Solution:\n    pass" },
    ]);
  });

  it("builds a locked editorial as empty and rejects a bad slug", async () => {
    const api = {
      fetchFromVercel: async () => ({ solution: { canSeeDetail: false, content: "hidden" } }),
      fetchPlayground: async () => [],
    };
    await expect(buildEditorial("two-sum", api)).resolves.toEqual({ blocks: [] });
    await expect(buildEditorial("../etc", api)).rejects.toBeInstanceOf(ValidationError);
  });

  it("fills playground placeholders with the fetched solution", async () => {
    const api = {
      fetchFromVercel: async () => ({ solution: { canSeeDetail: true, content: article } }),
      fetchPlayground: async (uuid: string) => {
        expect(uuid).toBe("Ab12Cd34");
        return [
          { langSlug: "javascript", code: "function solve(){ return [0, 1]; }" },
          { langSlug: "python3", code: "class Solution:\n    def solve(self):\n        return [0, 1]" },
        ];
      },
    };
    const editorial = await buildEditorial("two-sum", api);
    const code = editorial.blocks.find((block) => block.type === "code" && block.samples.length === 2);
    expect(code).toMatchObject({
      type: "code",
      samples: [
        { label: "JavaScript", language: "javascript" },
        { label: "Python", language: "python" },
      ],
    });
    expect(editorial.blocks.some((block) => block.type === "paragraph")).toBe(true);
  });
});
