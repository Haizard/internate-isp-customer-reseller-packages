import { Router } from "express";
import { RouterAdaptersController } from "./routerAdapters.controller";
import { authGuard } from "../../middleware/authGuard";
import { tenantGuard } from "../../middleware/tenantGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();
const controller = new RouterAdaptersController();

router.use(authGuard, tenantGuard);

router.post("/:routerId/enroll", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.enrollRouter);
router.post("/:routerId/profile", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.applyProfile);
router.get("/:routerId/status", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getStatus);
router.get("/:routerId/sessions", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getSessionSnapshot);

export default router;
