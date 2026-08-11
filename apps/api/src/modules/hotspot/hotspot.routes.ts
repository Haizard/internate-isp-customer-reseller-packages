import { Router } from "express";
import { HotspotController } from "./hotspot.controller";

const router = Router();
const controller = new HotspotController();

router.get("/:slug", controller.getHotspot);
router.post("/:slug/redeem", controller.redeem);

export default router;
