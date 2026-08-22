import { Router } from "express";
import { OrganizationsController } from "./organizations.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new OrganizationsController();

router.use(authGuard, tenantGuard);

router.get("/", controller.list);
router.get("/overview", controller.overview);
router.get("/platform-overview", roleGuard("PLATFORM_OWNER"), controller.platformOverview);
router.get("/resellers", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.listResellers);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.create);
router.patch("/:id/status", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.updateStatus);
router.patch("/branding", roleGuard("RESELLER", "ISP_ADMIN"), controller.updateBranding);

export default router;
