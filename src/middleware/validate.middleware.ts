import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

type Schema = z.ZodTypeAny;

export type ValidateSource = "body" | "query" | "params";

export function validateMiddleware(schema: Schema, source: ValidateSource = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return next(parsed.error);
    }
    (req as unknown as Record<string, unknown>)[source] = parsed.data;
    next();
  };
}
