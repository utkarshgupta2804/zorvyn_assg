import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/response";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, result, 201, "Registered");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  sendSuccess(res, result, 200, "Logged in");
});
