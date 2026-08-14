import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import organizationRoutes from "./modules/organizations/organizations.routes";
import userRoutes from "./modules/users/users.routes";
import locationRoutes from "./modules/locations/locations.routes";
import routerRoutes from "./modules/routers/routers.routes";
import customerRoutes from "./modules/customers/customers.routes";
import packageRoutes from "./modules/packages/packages.routes";
import voucherRoutes from "./modules/vouchers/vouchers.routes";
import reportRoutes from "./modules/reports/reports.routes";
import routerAdapterRoutes from "./modules/routerAdapters/routerAdapters.routes";
import hotspotRoutes from "./modules/hotspot/hotspot.routes";
import ticketRoutes from "./modules/tickets/tickets.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { config } from "./config";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/locations", locationRoutes);
app.use("/api/v1/routers", routerRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/packages", packageRoutes);
app.use("/api/v1/vouchers", voucherRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/router-adapters", routerAdapterRoutes);
app.use("/api/v1/hotspot", hotspotRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app, config };
