import { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new SubscriptionsController();

router.use(authGuard, tenantGuard);

router.get("/plans", controller.getPlans);
router.get("/current", controller.getCurrentPlan);
router.post("/upgrade", roleGuard("RESELLER"), controller.upgradePlan);
router.post("/cancel", roleGuard("RESELLER"), controller.cancelPlan);

export default router;
