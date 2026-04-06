import type { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "../utils/appError";
import type { AuthUser } from "../types/express";

export function roleMiddleware(allowed: AuthUser["role"][]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }
    if (!allowed.includes(req.user.role)) {
      throw new AppError("Forbidden — insufficient role", 403);
    }
    next();
  });
}
