import { Router } from "express";
import { InternalAuthMiddleware } from "../../middlewares/internal-auth.middleware";
import { LeadRateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { leadController } from "./lead.container";

export const leadRouter = Router();

leadRouter.post("/leads", [LeadRateLimitMiddleware.handle], leadController.createLead);
leadRouter.get("/leads/:id", [InternalAuthMiddleware.handle], leadController.getLeadById);
