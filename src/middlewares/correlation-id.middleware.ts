import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export class CorrelationIdMiddleware {
  public static handle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const incomingCorrelationId = req.header("X-Request-Id")?.trim();
    const correlationId = incomingCorrelationId || randomUUID();

    req.correlationId = correlationId;
    res.setHeader("X-Request-Id", correlationId);

    const startedAt = Date.now();

    res.on("finish", () => {
      logger.info(
        {
          correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        },
        "HTTP request completed",
      );
    });

    next();
  }
}
