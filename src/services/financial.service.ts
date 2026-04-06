import mongoose from "mongoose";
import { FinancialRecord, type FinancialType } from "../models/financialRecord.model";
import { AppError } from "../utils/appError";
import type { AuthUser } from "../types/express";

export type ListRecordsQuery = {
  type?: FinancialType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page: number;
  limit: number;
  /** Admin-only filter */
  userIdFilter?: string;
};

function baseMatchForUser(user: AuthUser): Record<string, unknown> {
  const match: Record<string, unknown> = { deletedAt: null };
  if (user.role !== "admin") {
    match.userId = new mongoose.Types.ObjectId(user.id);
  }
  return match;
}

export async function createRecord(input: {
  amount: number;
  type: FinancialType;
  category: string;
  date: Date;
  notes?: string;
  userId: string;
}) {
  const doc = await FinancialRecord.create({
    amount: input.amount,
    type: input.type,
    category: input.category,
    date: input.date,
    notes: input.notes,
    userId: input.userId,
    deletedAt: null,
  });
  return formatRecord(doc);
}

export async function listRecords(user: AuthUser, q: ListRecordsQuery) {
  const match: Record<string, unknown> = { ...baseMatchForUser(user) };

  if (user.role === "admin" && q.userIdFilter) {
    if (!mongoose.Types.ObjectId.isValid(q.userIdFilter)) {
      throw new AppError("Invalid userId filter", 400);
    }
    match.userId = new mongoose.Types.ObjectId(q.userIdFilter);
  }

  if (q.type) match.type = q.type;
  if (q.category) match.category = new RegExp(`^${escapeRegex(q.category)}$`, "i");
  if (q.startDate || q.endDate) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (q.startDate) range.$gte = q.startDate;
    if (q.endDate) range.$lte = q.endDate;
    match.date = range;
  }
  if (q.search?.trim()) {
    const rx = new RegExp(escapeRegex(q.search.trim()), "i");
    match.$or = [{ notes: rx }, { category: rx }];
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    FinancialRecord.find(match).sort({ date: -1 }).skip(skip).limit(q.limit).lean(),
    FinancialRecord.countDocuments(match),
  ]);
  return { items: items.map(formatLeanRecord), total };
}

export async function getRecordById(user: AuthUser, id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid record id", 400);
  }
  const match: Record<string, unknown> = { _id: id, deletedAt: null };
  if (user.role !== "admin") {
    match.userId = new mongoose.Types.ObjectId(user.id);
  }
  const doc = await FinancialRecord.findOne(match);
  if (!doc) {
    throw new AppError("Record not found", 404);
  }
  return formatRecord(doc);
}

export async function updateRecord(
  id: string,
  input: Partial<{ amount: number; type: FinancialType; category: string; date: Date; notes: string | null }>
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid record id", 400);
  }
  const doc = await FinancialRecord.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { ...input } },
    { new: true, runValidators: true }
  );
  if (!doc) {
    throw new AppError("Record not found", 404);
  }
  return formatRecord(doc);
}

export async function softDeleteRecord(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid record id", 400);
  }
  const doc = await FinancialRecord.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!doc) {
    throw new AppError("Record not found", 404);
  }
  return { id: doc.id, deletedAt: doc.deletedAt };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRecord(doc: mongoose.Document & { _id: mongoose.Types.ObjectId }) {
  const o = doc.toObject();
  return formatLeanRecord(o);
}

function formatLeanRecord(o: Record<string, unknown>) {
  return {
    id: String(o._id),
    amount: o.amount,
    type: o.type,
    category: o.category,
    date: o.date,
    notes: o.notes ?? undefined,
    userId: String(o.userId),
    deletedAt: o.deletedAt ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}
