import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import type { z } from "zod";
import * as userService from "../services/user.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { listUsersQuerySchema } from "../validation/schemas";

type UsersListQuery = z.infer<typeof listUsersQuerySchema>;

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as UsersListQuery;
  const { items, total } = await userService.listUsers(q.page, q.limit);
  sendPaginated(res, items, total, q.page, q.limit);
});

export const patchUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUserStatus(req.params.id, req.body.status);
  sendSuccess(res, user, 200, "User status updated");
});

export const patchUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  sendSuccess(res, user, 200, "User role updated");
});
