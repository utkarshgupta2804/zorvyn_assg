import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import type { z } from "zod";
import * as financialService from "../services/financial.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { listRecordsQuerySchema } from "../validation/schemas";

type RecordsListQuery = z.infer<typeof listRecordsQuerySchema>;

export const createRecord = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    amount: number;
    type: "income" | "expense";
    category: string;
    date: Date;
    notes?: string;
    userId: string;
  };
  const record = await financialService.createRecord(body);
  sendSuccess(res, record, 201, "Record created");
});

export const listRecords = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as RecordsListQuery;
  const user = req.user!;
  const { items, total } = await financialService.listRecords(user, {
    type: q.type,
    category: q.category,
    startDate: q.startDate,
    endDate: q.endDate,
    search: q.search,
    page: q.page,
    limit: q.limit,
    userIdFilter: user.role === "admin" ? q.userId : undefined,
  });
  sendPaginated(res, items, total, q.page, q.limit);
});

export const getRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await financialService.getRecordById(req.user!, req.params.id);
  sendSuccess(res, record);
});

export const updateRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await financialService.updateRecord(req.params.id, req.body);
  sendSuccess(res, record, 200, "Record updated");
});

export const deleteRecord = asyncHandler(async (req: Request, res: Response) => {
  const result = await financialService.softDeleteRecord(req.params.id);
  sendSuccess(res, result, 200, "Record soft-deleted");
});
