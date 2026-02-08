import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import CustomError from "../models/custom-error/CustomError";

export function errorHandlerMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.flatten(),
    });
    return;
  }

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Resource not found" });
      return;
    }

    logger.error(
      { correlationId: req.correlationId, prismaCode: error.code, err: error },
      "Prisma client known error",
    );

    res.status(500).json({ message: "Database error" });
    return;
  }

  logger.error({ correlationId: req.correlationId, err: error }, "Unhandled error");

  res.status(500).json({ message: "Internal server error" });
}
