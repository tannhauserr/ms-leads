import { Request, Response } from "express";

export class NotFoundMiddleware {
  public static handle(_req: Request, res: Response): void {
    res.status(404).json({ message: "Not found" });
  }
}
