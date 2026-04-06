import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import type { z } from "zod";
import * as dashboardService from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";
import { dashboardRecentQuerySchema } from "../validation/schemas";

type RecentQuery = z.infer<typeof dashboardRecentQuerySchema>;

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getSummary(req.user!);
  sendSuccess(res, data);
});

export const recent = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as RecentQuery;
  const data = await dashboardService.getRecentActivity(req.user!, q.limit);
  sendSuccess(res, data);
});

export const monthlyTrends = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getMonthlyTrends(req.user!);
  sendSuccess(res, data);
});
