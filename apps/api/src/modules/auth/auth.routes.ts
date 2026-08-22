import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authGuard } from "../../middleware/authGuard";

const router = Router();
const controller = new AuthController();

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/refresh", controller.refresh);
router.get("/me", authGuard, controller.me);
router.post("/change-password", authGuard, controller.changePassword);

export default router;
