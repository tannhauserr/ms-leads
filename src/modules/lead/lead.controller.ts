import { NextFunction, Request, Response } from "express";
import { createLeadSchema, leadIdParamsSchema } from "./lead.schema";
import { leadAntiBotService, leadService } from "./lead.container";

export async function createLeadController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const correlationId = req.correlationId ?? "unknown-correlation-id";
    const payload = createLeadSchema.parse(req.body);
    await leadAntiBotService.assertIsHumanLeadRequest(payload, {
      correlationId,
      remoteIp: req.ip ?? "0.0.0.0",
    });
    const result = await leadService.createLead(payload, correlationId);

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
    const correlationId = req.correlationId ?? "unknown-correlation-id";
    const params = leadIdParamsSchema.parse(req.params);
    const result = await leadService.getLeadByIdInternal(
      params.id,
      correlationId,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
