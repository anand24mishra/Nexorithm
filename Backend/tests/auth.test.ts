import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { globalErrorHandler } from "../src/middleware/errorHandler";
const secret = "test-only-secret-at-least-32-characters";
const app = express();
app.get("/private", authenticateToken(secret), (req, res) =>
  res.json(req.user),
);
app.use(globalErrorHandler);
describe("JWT boundary", () => {
  it("rejects missing authentication", async () =>
    expect((await request(app).get("/private")).status).toBe(401));
  it("rejects expired tokens", async () =>
    expect(
      (
        await request(app)
          .get("/private")
          .auth(
            jwt.sign({ userId: "a".repeat(24) }, secret, { expiresIn: -1 }),
            { type: "bearer" },
          )
      ).status,
    ).toBe(401));
  it("rejects alternate algorithms", async () =>
    expect(
      (
        await request(app)
          .get("/private")
          .auth(
            jwt.sign({ userId: "a".repeat(24) }, secret, {
              algorithm: "HS384",
            }),
            { type: "bearer" },
          )
      ).status,
    ).toBe(401));
  it("validates payload claims", async () =>
    expect(
      (
        await request(app)
          .get("/private")
          .auth(jwt.sign({ userId: {} }, secret, { expiresIn: 60 }), {
            type: "bearer",
          })
      ).status,
    ).toBe(401));
  it("accepts valid JWT", async () =>
    expect(
      (
        await request(app)
          .get("/private")
          .auth(
            jwt.sign(
              { userId: "a".repeat(24), username: "test", role: "user" },
              secret,
              { expiresIn: 60 },
            ),
            { type: "bearer" },
          )
      ).status,
    ).toBe(200));
});
