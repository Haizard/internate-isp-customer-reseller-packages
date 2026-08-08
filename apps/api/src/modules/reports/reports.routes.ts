import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new ReportsController();

router.use(authGuard, tenantGuard);

router.get("/resellers", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.resellerSummary);
router.get("/packages", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.packagePopularity);
router.get("/earnings", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.earningsByReseller);

export default router;
