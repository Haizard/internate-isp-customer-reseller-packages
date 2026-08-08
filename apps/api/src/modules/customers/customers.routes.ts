import { Router } from "express";
import { CustomersController } from "./customers.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";
import { customerGuard } from "../../middleware/customerGuard";

const router = Router();
const controller = new CustomersController();

router.use(authGuard, tenantGuard);

// Customer self-service (must be registered before :id routes)
const self = Router();
self.use(customerGuard);
self.get("/me", controller.me);
self.patch("/me/wifi", controller.updateWifi);
self.get("/me/devices", controller.devices);
self.get("/me/usage", controller.usage);
self.post("/me/vouchers/redeem", controller.redeemVoucher);
self.get("/me/requests", controller.listRequests);
self.post("/me/requests", controller.createRequest);

router.use("/me", self);

// Admin / reseller CRUD
router.get("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.list);
router.get("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.get);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.create);
router.patch("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER"), controller.update);

export default router;
