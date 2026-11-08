import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext";
import { WorkspaceProvider } from "../src/context/WorkspaceContext";
import { useWorkspace } from "../src/context/workspaceState";
import { useSubmission } from "../src/hooks/useSubmission";
import { submissionApi } from "../src/api/submissionApi";
vi.mock("../src/api/submissionApi", () => ({
  submissionApi: { submit: vi.fn(), get: vi.fn() },
}));
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.resetAllMocks();
});
function sessionToken(): string {
  const payload = btoa(JSON.stringify({ username: "ada" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `hdr.${payload}.sig`;
}
function Controls() {
  const { dispatch, state } = useWorkspace();
  const { submitCode } = useSubmission();
  return (
    <>
      <button
        onClick={() =>
          dispatch({
            type: "SET_PROBLEM",
            payload: { problemId: "1", code: "function solve(){}" },
          })
        }
      >
        Setup
      </button>
      <button onClick={submitCode}>Submit</button>
      <span data-testid="busy">{String(state.isSubmitting)}</span>
    </>
  );
}
it("synchronously prevents duplicate submit clicks and clears busy on terminal result", async () => {
  let release!: (value: { mode: "queued"; submissionId: string }) => void;
  vi.mocked(submissionApi.submit).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  vi.mocked(submissionApi.get).mockResolvedValue({
    id: "id",
    status: "completed",
    verdict: "Accepted",
    passedTestCases: 1,
    totalTestCases: 1,
    executionTimeMs: 1,
  } as Awaited<ReturnType<typeof submissionApi.get>>);
  sessionStorage.setItem("nx_token", sessionToken());
  render(
    <MemoryRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Controls />
        </WorkspaceProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("Setup"));
  fireEvent.click(screen.getByText("Submit"));
  fireEvent.click(screen.getByText("Submit"));
  expect(submissionApi.submit).toHaveBeenCalledTimes(1);
  await act(async () => release({ mode: "queued", submissionId: "id" }));
  await waitFor(() =>
    expect(screen.getByTestId("busy").textContent).toBe("false"),
  );
});
