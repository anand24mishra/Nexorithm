import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { logger } from "../telemetry";
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      fields: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  const status =
    "status" in err &&
    typeof err.status === "number" &&
    [400, 413].includes(err.status)
      ? err.status
      : 500;
  logger.error({
    requestId: res.locals.requestId,
    operation: "http_error",
    errorCategory: status === 500 ? "internal" : "validation",
  });
  res.status(status).json({
    error:
      status === 413
        ? "Request too large"
        : status === 400
          ? "Invalid JSON"
          : "Internal server error",
  });
}
