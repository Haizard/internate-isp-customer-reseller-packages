import { Router } from "express";
import { RoutersController } from "./routers.controller";
import { authGuard } from "../../middleware/authGuard";
import { tenantGuard } from "../../middleware/tenantGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();
const controller = new RoutersController();

router.use(authGuard, tenantGuard);

router.get("/", controller.list);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.create);
router.patch("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.update);

export default router;
