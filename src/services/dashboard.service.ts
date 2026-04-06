import mongoose, { type PipelineStage } from "mongoose";
import { FinancialRecord } from "../models/financialRecord.model";
import type { AuthUser } from "../types/express";

function scopeMatch(user: AuthUser): Record<string, unknown> {
  const base = { deletedAt: null };
  if (user.role === "admin") {
    return base;
  }
  return { ...base, userId: new mongoose.Types.ObjectId(user.id) };
}

export async function getSummary(user: AuthUser) {
  const match = scopeMatch(user);
  const pipeline = [
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
            },
          },
        ],
        categoryTotals: [
          {
            $group: {
              _id: { category: "$category", type: "$type" },
              total: { $sum: "$amount" },
            },
          },
          {
            $group: {
              _id: "$_id.category",
              breakdown: {
                $push: {
                  type: "$_id.type",
                  total: "$total",
                },
              },
              amount: { $sum: "$total" },
            },
          },
          { $sort: { amount: -1 } },
        ],
      },
    },
  ] as PipelineStage[];

  const [row] = await FinancialRecord.aggregate<{
    totals?: { _id: string; total: number }[];
    categoryTotals?: { _id: string; breakdown: { type: string; total: number }[]; amount: number }[];
  }>(pipeline);
  const totals = row?.totals as { _id: string; total: number }[] | undefined;
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of totals ?? []) {
    if (t._id === "income") totalIncome = t.total;
    if (t._id === "expense") totalExpenses = t.total;
  }
  const netBalance = totalIncome - totalExpenses;

  const categoryTotals = (row?.categoryTotals as { _id: string; breakdown: { type: string; total: number }[]; amount: number }[] | undefined)?.map(
    (c) => ({
      category: c._id,
      totalAmount: c.amount,
      byType: c.breakdown.reduce<Record<string, number>>((acc, b) => {
        acc[b.type] = b.total;
        return acc;
      }, {}),
    })
  ) ?? [];

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    categoryTotals,
  };
}

export async function getRecentActivity(user: AuthUser, limit: number) {
  const match = scopeMatch(user);
  const items = await FinancialRecord.find(match).sort({ date: -1 }).limit(limit).lean();
  return items.map((o) => ({
    id: String(o._id),
    amount: o.amount,
    type: o.type,
    category: o.category,
    date: o.date,
    notes: o.notes,
    userId: String(o.userId),
  }));
}

export async function getMonthlyTrends(user: AuthUser) {
  const match = scopeMatch(user);
  const pipeline = [
    { $match: match },
    {
      $addFields: {
        ym: {
          $dateToString: { format: "%Y-%m", date: "$date" },
        },
      },
    },
    {
      $group: {
        _id: { ym: "$ym", type: "$type" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.ym": 1, "_id.type": 1 } },
    {
      $group: {
        _id: "$_id.ym",
        types: {
          $push: {
            type: "$_id.type",
            total: "$total",
          },
        },
      },
    },
  ] as PipelineStage[];

  const rows = await FinancialRecord.aggregate(pipeline);
  return rows.map((r) => {
    const income = r.types.find((t: { type: string }) => t.type === "income")?.total ?? 0;
    const expense = r.types.find((t: { type: string }) => t.type === "expense")?.total ?? 0;
    return {
      month: r._id,
      income,
      expense,
      net: income - expense,
    };
  });
}
