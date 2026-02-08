import { logger } from "../../config/logger";

export type MessageStoredType = "simple" | "verbose" | "none";

interface CustomErrorOptions {
  statusCode?: number;
  serviceName?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
  messageStoredType?: MessageStoredType;
}

class CustomError extends Error {
  public readonly statusCode: number;
  public readonly serviceName?: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, options: CustomErrorOptions = {}) {
    super(message);

    this.name = "CustomError";
    this.statusCode = options.statusCode ?? 500;
    this.serviceName = options.serviceName;
    this.details = options.details;

    if (options.messageStoredType !== "none") {
      const base = {
        errorName: this.name,
        statusCode: this.statusCode,
        serviceName: this.serviceName,
        details: this.details,
      };

      if (options.messageStoredType === "verbose") {
        logger.error({ ...base, cause: options.cause }, this.message);
      } else {
        logger.error(base, this.message);
      }
    }
  }
}

export default CustomError;
