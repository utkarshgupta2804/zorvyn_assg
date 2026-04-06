import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";

function isMongoDuplicateKey(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: "APP_ERROR",
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string> = {};
    for (const [k, v] of Object.entries(err.errors)) {
      details[k] = v.message;
    }
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "MONGOOSE_VALIDATION",
        details,
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        message: `Invalid ${err.path}: ${err.value}`,
        code: "CAST_ERROR",
      },
    });
    return;
  }

  if (isMongoDuplicateKey(err)) {
    res.status(409).json({
      success: false,
      error: {
        message: "Duplicate key",
        code: "DUPLICATE_KEY",
        fields: err.keyValue,
      },
    });
    return;
  }

  if (err instanceof Error && err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: { message: "Invalid token", code: "INVALID_TOKEN" },
    });
    return;
  }

  if (err instanceof Error && err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: { message: "Token expired", code: "TOKEN_EXPIRED" },
    });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === "production" ? "Internal server error" : String(err),
      code: "INTERNAL_ERROR",
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: "NOT_FOUND",
    },
  });
}
