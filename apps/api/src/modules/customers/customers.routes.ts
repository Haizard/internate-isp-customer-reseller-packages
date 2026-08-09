import { Router } from "express";
import { CustomersController } from "./customers.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";
import { customerGuard } from "../../middleware/customerGuard";

const router = Router();
const controller = new CustomersController();

router.use(authGuard, tenantGuard);

// Customer self-service (mounted at /me, must be registered before :id routes)
const self = Router();
self.use(customerGuard);
self.get("/", controller.me);
self.patch("/wifi", controller.updateWifi);
self.get("/devices", controller.devices);
self.get("/usage", controller.usage);
self.post("/vouchers/redeem", controller.redeemVoucher);
self.get("/requests", controller.listRequests);
self.post("/requests", controller.createRequest);

router.use("/me", self);

// Admin / reseller CRUD
router.get("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.list);
router.get("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.get);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.create);
router.patch("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.update);

export default router;
