import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { authApi } from "../src/api/authApi";
import { AuthContext } from "../src/context/authState";
import { readReturnPath, safeInternalPath } from "../src/lib/returnTo";
import { LoginPage } from "../src/pages/LoginPage";
import { SignupPage } from "../src/pages/SignupPage";

vi.mock("../src/api/authApi", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("safeInternalPath", () => {
  it("allows an in-app problem path", () => {
    expect(safeInternalPath("/problem/two-sum")).toBe("/problem/two-sum");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeInternalPath("//evil.example")).toBeNull();
  });

  it("rejects absolute URLs", () => {
    expect(safeInternalPath("https://evil.example")).toBeNull();
  });

  it("rejects the login page", () => {
    expect(safeInternalPath("/login")).toBeNull();
  });
});

describe("readReturnPath", () => {
  it("reads a safe from path", () => {
    expect(readReturnPath({ from: "/problem/two-sum" })).toBe(
      "/problem/two-sum",
    );
  });

  it("falls back to the dashboard", () => {
    expect(readReturnPath({})).toBe("/dashboard");
  });
});

function Destination() {
  const location = useLocation();
  return createElement("h1", null, location.pathname);
}

function renderAuth(pathname: "/login" | "/signup", from?: string) {
  const login = vi.fn();
  render(
    createElement(
      MemoryRouter,
      {
        initialEntries: [{ pathname, state: from ? { from } : {} }],
      },
      createElement(
        AuthContext.Provider,
        {
          value: {
            token: null,
            isAuthenticated: false,
            username: null,
            isReady: true,
            login,
            logout: vi.fn(),
            googleLogin: vi.fn(),
          },
        },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/login",
            element: createElement(LoginPage),
          }),
          createElement(Route, {
            path: "/signup",
            element: createElement(SignupPage),
          }),
          createElement(Route, {
            path: "/problem/two-sum",
            element: createElement(Destination),
          }),
          createElement(Route, {
            path: "/dashboard",
            element: createElement(Destination),
          }),
        ),
      ),
    ),
  );
  return { login };
}

function fillLogin() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "longpassword" },
  });
  fireEvent.submit(screen.getByLabelText("Password").closest("form")!);
}

function fillSignup() {
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "ada" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "longpassword" },
  });
  fireEvent.submit(screen.getByLabelText("Password").closest("form")!);
}

describe("auth return path", () => {
  it("replaces history with the dashboard after email login", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: "token",
      user: { username: "ada" },
    });
    const { login } = renderAuth("/login", "/problem/two-sum");

    fillLogin();

    expect(
      await screen.findByRole("heading", { name: "/dashboard" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "/problem/two-sum" }),
    ).toBeNull();
    expect(login).toHaveBeenCalledWith("token", "ada");
  });

  it("replaces history with the dashboard after switching from login to signup", async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      token: "token",
      user: { username: "ada" },
    });
    const { login } = renderAuth("/login", "/problem/two-sum");

    fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
    fillSignup();

    expect(
      await screen.findByRole("heading", { name: "/dashboard" }),
    ).toBeTruthy();
    expect(login).toHaveBeenCalledWith("token", "ada");
  });

  it("replaces history with the dashboard after signup", async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      token: "token",
      user: { username: "ada" },
    });
    const { login } = renderAuth("/signup", "/problem/two-sum");

    fillSignup();

    expect(
      await screen.findByRole("heading", { name: "/dashboard" }),
    ).toBeTruthy();
    expect(login).toHaveBeenCalledWith("token", "ada");
  });
});
