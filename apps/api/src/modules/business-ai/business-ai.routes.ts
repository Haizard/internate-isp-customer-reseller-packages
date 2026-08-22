import { Router } from "express";
import { BusinessAIController } from "./business-ai.controller";
import { authGuard } from "../../middleware/authGuard";

const router = Router();
const controller = new BusinessAIController();

router.use(authGuard);

router.post("/conversations", (req, res, next) => controller.startConversation(req, res, next));
router.get("/conversations", (req, res, next) => controller.listConversations(req, res, next));
router.get("/conversations/:planId", (req, res, next) => controller.getConversation(req, res, next));
router.delete("/conversations/:planId", (req, res, next) => controller.deleteConversation(req, res, next));
router.post("/chat", (req, res, next) => controller.sendMessage(req, res, next));
router.post("/plans/:planId/apply", (req, res, next) => controller.applyPlan(req, res, next));

export default router;
