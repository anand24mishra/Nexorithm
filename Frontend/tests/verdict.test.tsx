import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { VerdictBadge } from "../src/components/common/VerdictBadge";
import { Verdict } from "../src/types";
afterEach(cleanup);
it.each(Object.values(Verdict))("renders verdict %s", (verdict) => {
  render(<VerdictBadge verdict={verdict} />);
  expect(screen.getByText(verdict)).toBeDefined();
});
