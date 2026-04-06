import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateMiddleware } from "../middleware/validate.middleware";
import {
  idParamSchema,
  listUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

router.get("/", validateMiddleware(listUsersQuerySchema, "query"), userController.listUsers);
router.patch(
  "/:id/status",
  validateMiddleware(idParamSchema, "params"),
  validateMiddleware(updateUserStatusSchema),
  userController.patchUserStatus
);
router.patch(
  "/:id/role",
  validateMiddleware(idParamSchema, "params"),
  validateMiddleware(updateUserRoleSchema),
  userController.patchUserRole
);

export default router;
