import { Router } from "express";
import { internalAuthMiddleware } from "../../middlewares/internal-auth.middleware";
import { leadsRateLimiter } from "../../middlewares/rate-limit.middleware";
import {
  createLeadController,
  getLeadByIdController,
} from "./lead.controller";

export const leadRouter = Router();

leadRouter.post("/leads", [leadsRateLimiter], createLeadController);
leadRouter.get("/leads/:id", [internalAuthMiddleware], getLeadByIdController);
