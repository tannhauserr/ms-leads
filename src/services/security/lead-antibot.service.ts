import { env } from "../../config/env";
import { logger } from "../../config/logger";
import CustomError from "../../models/custom-error/CustomError";
import { CreateLeadInput } from "../../modules/lead/lead.schema";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface AntiBotContext {
  correlationId: string;
  remoteIp: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export class LeadAntiBotService {
  constructor(
    private readonly turnstileSecretKey: string,
    private readonly nodeEnv: string,
    private readonly minFormFillMs: number,
  ) {}

  public async assertIsHumanLeadRequest(
    payload: CreateLeadInput,
    context: AntiBotContext,
  ): Promise<void> {
    if (payload.hp && payload.hp.trim().length > 0) {
      this.throwBotRejectedError();
    }

    const elapsedMs = Date.now() - payload.startedAt;
    if (elapsedMs < this.minFormFillMs) {
      this.throwBotRejectedError();
    }

    if (!this.turnstileSecretKey.trim()) {
      if (this.nodeEnv === "production") {
        throw new CustomError("Anti-bot service misconfigured", {
          statusCode: 500,
          serviceName: "LeadAntiBotService.assertIsHumanLeadRequest",
          messageStoredType: "simple",
        });
      }

      logger.warn(
        { correlationId: context.correlationId },
        "TURNSTILE_SECRET_KEY is missing; skipping Turnstile check outside production",
      );
      return;
    }

    const verifyResponse = await this.verifyTurnstileToken(
      payload.turnstileToken,
      context,
    );

    if (!verifyResponse.success) {
      logger.warn(
        {
          correlationId: context.correlationId,
          errorCodes: verifyResponse["error-codes"] ?? [],
          hostname: verifyResponse.hostname,
        },
        "Turnstile rejected lead request",
      );
      this.throwBotRejectedError();
    }
  }

  private async verifyTurnstileToken(
    token: string,
    context: AntiBotContext,
  ): Promise<TurnstileVerifyResponse> {
    try {
      const body = new URLSearchParams({
        secret: this.turnstileSecretKey,
        response: token,
        remoteip: context.remoteIp,
      });

      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!response.ok) {
        throw new CustomError("Unable to validate anti-bot challenge", {
          statusCode: 502,
          serviceName: "LeadAntiBotService.verifyTurnstileToken",
          details: { statusCode: response.status },
          messageStoredType: "simple",
        });
      }

      const parsed = (await response.json()) as TurnstileVerifyResponse;
      return parsed;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError("Unable to validate anti-bot challenge", {
        statusCode: 502,
        serviceName: "LeadAntiBotService.verifyTurnstileToken",
        cause: error,
        messageStoredType: "verbose",
      });
    }
  }

  private throwBotRejectedError(): never {
    throw new CustomError("Request rejected", {
      statusCode: 429,
      serviceName: "LeadAntiBotService.assertIsHumanLeadRequest",
      messageStoredType: "none",
    });
  }
}

export const leadAntiBotService = new LeadAntiBotService(
  env.TURNSTILE_SECRET_KEY,
  env.NODE_ENV,
  env.LEAD_MIN_FORM_FILL_MS,
);
