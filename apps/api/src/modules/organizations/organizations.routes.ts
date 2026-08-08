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
router.get("/resellers", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.listResellers);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.create);
router.patch("/:id/status", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.updateStatus);

export default router;
