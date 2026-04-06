import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateMiddleware } from "../middleware/validate.middleware";
import { dashboardRecentQuerySchema } from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(["analyst", "admin"]));

router.get("/summary", dashboardController.summary);
router.get("/recent", validateMiddleware(dashboardRecentQuerySchema, "query"), dashboardController.recent);
router.get("/monthly-trends", dashboardController.monthlyTrends);

export default router;
