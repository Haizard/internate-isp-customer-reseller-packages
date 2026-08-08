import { Router } from "express";
import { RoutersController } from "./routers.controller";
import { authGuard } from "../../middleware/authGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new RoutersController();

router.use(authGuard, tenantGuard);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);

export default router;
