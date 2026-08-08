import { Router } from "express";
import { VouchersController } from "./vouchers.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new VouchersController();

router.use(authGuard, tenantGuard);

router.get("/", controller.list);
router.post("/batch", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createBatch);

export default router;
