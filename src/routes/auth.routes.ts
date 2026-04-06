import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validation/schemas";

const router = Router();

router.post("/register", validateMiddleware(registerSchema), authController.register);
router.post("/login", validateMiddleware(loginSchema), authController.login);

export default router;
