import { Router } from "express";
import { UsersController } from "./users.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new UsersController();

router.use(authGuard, tenantGuard);

router.get("/", controller.list);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.create);

export default router;
