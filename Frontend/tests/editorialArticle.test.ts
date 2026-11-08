import { describe, expect, it } from "vitest";
import { parseEditorialArticle } from "../src/components/Workspace/editorialArticle";

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
`;

describe("parseEditorialArticle", () => {
  it("keeps the written solution and drops the video and playground frame", () => {
    const blocks = parseEditorialArticle(article);
    expect(
      blocks.some(
        (block) => block.type === "heading" && block.text === "Video Solution",
      ),
    ).toBe(false);
    expect(blocks).toEqual(
      expect.arrayContaining([
        { type: "heading", level: 2, text: "Solution Article" },
        { type: "heading", level: 3, text: "Approach 1: Scan" },
        { type: "label", text: "Intuition" },
        {
          type: "paragraph",
          text: "Check every pair until the values add up.",
        },
        { type: "label", text: "Complexity Analysis" },
        {
          type: "list",
          items: ["Time complexity: `O(n^2)`.", "Space complexity: `O(1)`."],
        },
      ]),
    );
  });
});
