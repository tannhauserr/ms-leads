import { Request, Response } from "express";

export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({ message: "Not found" });
}
