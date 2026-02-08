import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const leadsRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 60_000,
  max: env.RATE_LIMIT_MAX || 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {

    // TODO: Se puede mandar un evento a un sistema de alertas para detectar 
    // posibles abusos de la API.

    res.status(429).json({
      message: "Too many requests. Please retry later.",
      code: "RATE_LIMITED",
    });
  },
});
