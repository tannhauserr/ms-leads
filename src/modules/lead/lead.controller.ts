import { NextFunction, Request, Response } from "express";
import { createLeadSchema, leadIdParamsSchema } from "./lead.schema";
import { LeadService } from "./lead.service";
import { LeadAntiBotService } from "../../services/security/lead-antibot.service";

export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadAntiBotService: LeadAntiBotService,
  ) {}

  public createLead = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? "unknown-correlation-id";
      const payload = createLeadSchema.parse(req.body);
      await this.leadAntiBotService.assertIsHumanLeadRequest(payload, {
        correlationId,
        remoteIp: req.ip ?? "0.0.0.0",
      });
      const result = await this.leadService.createLead(payload, correlationId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getLeadById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? "unknown-correlation-id";
      const params = leadIdParamsSchema.parse(req.params);
      const result = await this.leadService.getLeadByIdInternal(
        params.id,
        correlationId,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
