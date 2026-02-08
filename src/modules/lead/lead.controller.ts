import { NextFunction, Request, Response } from "express";
import { leadService } from "../../container/app.container";
import { createLeadSchema, leadIdParamsSchema } from "./lead.schema";

export async function createLeadController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = createLeadSchema.parse(req.body);
    const result = await leadService.createLead(payload, req.correlationId);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getLeadByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = leadIdParamsSchema.parse(req.params);
    const result = await leadService.getLeadByIdInternal(
      params.id,
      req.correlationId,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
