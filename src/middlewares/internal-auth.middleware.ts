import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export class InternalAuthMiddleware {
  public static handle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const token = req.header("X-Internal-Token") ?? "";
    const expected = env.INTERNAL_API_TOKEN;

    if (!token || token.length !== expected.length) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const isValid = timingSafeEqual(Buffer.from(token), Buffer.from(expected));

    if (!isValid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    next();
  }
}
