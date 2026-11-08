import { describe, expect, it } from "vitest";
import { Difficulty, type NexorithmProblem } from "../src/types";
import { parseArguments } from "../src/services/contracts";
import {
  applyAuthoritativeSuite,
  testCasesFromExamples,
} from "../src/services/exampleSuite";

const longestSubstring = `
<p><strong class="example">Example 1:</strong></p>
<pre>
<strong>Input:</strong> s = &quot;abcabcbb&quot;
<strong>Output:</strong> 3
<strong>Explanation:</strong> The answer is &quot;abc&quot;, with the length of 3.
</pre>
<p><strong class="example">Example 2:</strong></p>
<pre>
<strong>Input:</strong> s = &quot;bbbbb&quot;
<strong>Output:</strong> 1
<strong>Explanation:</strong> The answer is &quot;b&quot;, with the length of 1.
</pre>
<p><strong class="example">Example 3:</strong></p>
<pre>
<strong>Input:</strong> s = &quot;pwwkew&quot;
<strong>Output:</strong> 3
</pre>`;

function lengthOfLongestSubstring(s: string): number {
  let best = 0;
  let start = 0;
  const seen = new Map<string, number>();
  for (let i = 0; i < s.length; i++) {
    const previous = seen.get(s[i]);
    if (previous !== undefined && previous >= start) start = previous + 1;
    seen.set(s[i], i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}

function problem(overrides: Partial<NexorithmProblem> = {}): NexorithmProblem {
  return {
    id: "3",
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: Difficulty.MEDIUM,
    content: longestSubstring,
    tags: [],
    starterCode: { javascript: "", python: "" },
    testCases: [],
    sampleInput: "",
    sampleOutput: "",
    hints: [],
    acRate: 0,
    ...overrides,
  };
}

describe("example suite", () => {
  it("builds judge arguments from published Input/Output examples", () => {
    const cases = testCasesFromExamples(longestSubstring);
    expect(cases).toEqual([
      { input: '"abcabcbb"', expectedOutput: "3", isHidden: false },
      { input: '"bbbbb"', expectedOutput: "1", isHidden: false },
      { input: '"pwwkew"', expectedOutput: "3", isHidden: false },
    ]);
    const contract = {
      functionName: "lengthOfLongestSubstring",
      inputMode: "legacy-lines" as const,
      comparison: "json" as const,
    };
    for (const testCase of cases) {
      const args = parseArguments(testCase.input, contract);
      expect(JSON.stringify(lengthOfLongestSubstring(String(args[0])))).toBe(
        testCase.expectedOutput,
      );
    }
  });

  it("splits named parameters onto legacy judge lines", () => {
    const cases = testCasesFromExamples(
      "<pre>Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9.</pre>",
    );
    expect(cases).toEqual([
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        isHidden: false,
      },
    ]);
  });

  it("keeps a nested argument together", () => {
    const cases = testCasesFromExamples(
      'Input: grid = [\n["1","1"],\n["1","0"]\n]\nOutput: 1',
    );
    expect(cases[0]).toEqual({
      input: '[["1","1"],["1","0"]]',
      expectedOutput: "1",
      isHidden: false,
    });
  });

  it("does not invent a suite for class-style examples", () => {
    const cases = testCasesFromExamples(
      'Input:\n["LRUCache","put","get"]\n[[2],[1,1],[1]]\nOutput:\n[null,null,1]',
    );
    expect(cases).toEqual([]);
  });

  it("keeps an existing suite and fills only an empty one", () => {
    const seeded = problem({
      testCases: [{ input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" }],
      sampleOutput: "[0,1]",
    });
    expect(applyAuthoritativeSuite(seeded)).toBe(seeded);

    const imported = applyAuthoritativeSuite(
      problem({ sampleInput: '"abcabcbb"' }),
    );
    expect(imported.testCases).toHaveLength(3);
    expect(imported.sampleInput).toBe('"abcabcbb"');
    expect(imported.sampleOutput).toBe("3");
  });
});
