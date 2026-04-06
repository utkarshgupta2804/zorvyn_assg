import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const financialBase = {
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  date: z.coerce.date(),
  notes: z.string().optional(),
};

export const createFinancialRecordSchema = z.object({
  ...financialBase,
  userId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid userId"),
});

export const updateFinancialRecordSchema = z
  .object({
    amount: z.number().positive().optional(),
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(1).optional(),
    date: z.coerce.date().optional(),
    notes: z.union([z.string(), z.null()]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export const listRecordsQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/)
    .optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["viewer", "analyst", "admin"]),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id"),
});

export const dashboardRecentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
