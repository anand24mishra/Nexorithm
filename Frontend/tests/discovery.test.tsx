import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { pageWindow } from "../src/components/ProblemList/ProblemList";
import { RecommendationCard } from "../src/components/Dashboard/RecommendationCard";
import { SubmissionItem } from "../src/components/Dashboard/SubmissionItem";

afterEach(cleanup);

it("returns each page once when the last page is inside a short catalog", () => {
  const pages = pageWindow(4, 4);
  expect(pages).toEqual([1, 2, 3, 4]);
  expect(new Set(pages).size).toBe(pages.length);
});

it("links a recommendation when a slug is passed", () => {
  render(
    <MemoryRouter>
      <RecommendationCard
        title="Two Sum"
        difficulty="EASY"
        tags={["Array"]}
        acceptance={49}
        slug="two-sum"
      />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("link", { name: /Two Sum/ }).getAttribute("href"),
  ).toBe("/problem/two-sum");
});

it("links a submission when a slug is passed", () => {
  render(
    <MemoryRouter>
      <SubmissionItem
        title="Two Sum"
        status="ACCEPTED"
        timestamp="just now"
        language="PYTHON"
        slug="two-sum"
      />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("link", { name: /Two Sum/ }).getAttribute("href"),
  ).toBe("/problem/two-sum");
});

it("renders a submission as text when slug is missing", () => {
  render(
    <SubmissionItem
      title="Add Two Numbers"
      status="Runtime Error"
      timestamp="just now"
      language="PYTHON"
    />,
  );
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByText("Runtime Error")).toBeDefined();
  expect(screen.getByText("Add Two Numbers")).toBeDefined();
});
