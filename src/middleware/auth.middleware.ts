import type { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError";
import type { AuthUser } from "../types/express";

type JwtPayload = { sub: string; email: string; role: AuthUser["role"] };

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Unauthorized — missing or invalid Authorization header", 401);
  }
  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server misconfiguration: JWT_SECRET not set", 500);
  }
  const decoded = jwt.verify(token, secret) as JwtPayload;
  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };
  next();
});
