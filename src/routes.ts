import { Router } from "express";
import { leadRouter } from "./modules/lead/lead.routes";

export const routes = Router();

// Rutas de leads
routes.use("/api", leadRouter);


