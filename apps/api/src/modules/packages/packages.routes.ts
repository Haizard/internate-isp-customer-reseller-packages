import { Router } from "express";
import { PackagesController } from "./packages.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new PackagesController();

router.use(authGuard, tenantGuard);

router.get("/", controller.list);
router.get("/popularity", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.popularity);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.create);
router.patch("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN"), controller.update);

export default router;
