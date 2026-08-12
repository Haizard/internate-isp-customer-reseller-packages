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
router.post("/:routerId/users", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createRouterUser);
router.post("/:routerId/vouchers", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createVoucher);
router.post("/:routerId/disconnect", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.disconnectUser);
router.post("/:routerId/suspend", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.suspendUser);
router.post("/:routerId/queues", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createQueue);
router.post("/:routerId/pools", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createPool);
router.post("/:routerId/pppoe-profiles", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createPppoeProfile);
router.post("/:routerId/hotspot-profiles", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.createHotspotProfile);
router.post("/:routerId/reconcile", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.reconcile);
router.post("/:routerId/simulation", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.setSimulation);
router.get("/:routerId/status", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getStatus);
router.get("/:routerId/sessions", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getSessions);
router.get("/:routerId/usage", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getUsage);
router.get("/:routerId/health", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getHealth);
router.get("/:routerId/commands", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getCommands);
router.post("/:routerId/commands/:commandId/retry", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.retryCommand);
router.get("/:routerId/lifecycle", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.getLifecycleState);

export default router;
