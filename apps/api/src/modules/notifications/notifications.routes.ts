import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { authGuard } from "../../middleware/authGuard";
import { tenantGuard } from "../../middleware/tenantGuard";
import { customerGuard } from "../../middleware/customerGuard";

const router = Router();
const controller = new NotificationsController();

router.use(authGuard, tenantGuard, customerGuard);

router.get("/", controller.list);
router.post("/mark-read", controller.markRead);

export default router;
