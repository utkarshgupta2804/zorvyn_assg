import { Router } from "express";
import * as financialController from "../controllers/financial.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateMiddleware } from "../middleware/validate.middleware";
import {
  createFinancialRecordSchema,
  idParamSchema,
  listRecordsQuerySchema,
  updateFinancialRecordSchema,
} from "../validation/schemas";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(["admin"]),
  validateMiddleware(createFinancialRecordSchema),
  financialController.createRecord
);

router.get("/", validateMiddleware(listRecordsQuerySchema, "query"), financialController.listRecords);

router.get("/:id", validateMiddleware(idParamSchema, "params"), financialController.getRecord);

router.patch(
  "/:id",
  roleMiddleware(["admin"]),
  validateMiddleware(idParamSchema, "params"),
  validateMiddleware(updateFinancialRecordSchema),
  financialController.updateRecord
);

router.delete(
  "/:id",
  roleMiddleware(["admin"]),
  validateMiddleware(idParamSchema, "params"),
  financialController.deleteRecord
);

export default router;
