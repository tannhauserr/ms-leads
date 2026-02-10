import { connect } from "amqplib";
import type { Channel, ChannelModel, Options } from "amqplib";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

interface RabbitConnectionDiagnostics {
  effectiveUrl: string;
  host: string;
  port: number;
  vhost: string;
  user: string;
  frameMax: number;
}

export class RabbitPubSubService {
  private readonly rabbitUrl?: string;
  private readonly rabbitUser: string;
  private readonly rabbitPassword: string;
  private readonly rabbitHost: string;
  private readonly rabbitPort: number;
  private readonly rabbitVhost: string;
  private readonly rabbitFrameMax: number;
  private readonly rabbitPrefetch: number;

  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private initPromise: Promise<Channel> | null = null;

  constructor(rabbitUrl: string = env.RABBITMQ_URL) {
    this.rabbitUrl = rabbitUrl;
    this.rabbitUser = env.RABBITMQ_USER;
    this.rabbitPassword = env.RABBITMQ_PASSWORD;
    this.rabbitHost = env.RABBITMQ_HOST;
    this.rabbitPort = env.RABBITMQ_PORT;
    this.rabbitVhost = env.RABBITMQ_VHOST;
    this.rabbitFrameMax = env.RABBITMQ_FRAME_MAX;
    this.rabbitPrefetch = env.RABBITMQ_PREFETCH;
  }

  public async initialize(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const { connectTarget, diagnostics } = this.resolveConnectionTarget();
      let connection: ChannelModel;

      try {
        connection = await connect(connectTarget);
      } catch (error) {
        const { errorName, errorMessage } = this.getErrorDetails(error);
        logger.error(
          {
            rabbitmq: diagnostics,
            errorName,
            errorMessage,
          },
          "RabbitMQ connection failed during handshake",
        );
        throw error;
      }

      const channel = await connection.createChannel();
      await channel.prefetch(this.rabbitPrefetch);

      connection.on("close", () => {
        logger.warn(
          { rabbitmq: diagnostics },
          "RabbitMQ connection closed",
        );
        this.connection = null;
        this.channel = null;
        this.initPromise = null;
      });

      connection.on("error", (error) => {
        const { errorName, errorMessage } = this.getErrorDetails(error);
        logger.error(
          {
            rabbitmq: diagnostics,
            errorName,
            errorMessage,
          },
          "RabbitMQ connection error",
        );
        this.connection = null;
        this.channel = null;
        this.initPromise = null;
      });

      this.connection = connection;
      this.channel = channel;
      return channel;
    })();

    try {
      return await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.initPromise = null;
  }

  private resolveConnectionTarget(): {
    connectTarget: string | Options.Connect;
    diagnostics: RabbitConnectionDiagnostics;
  } {
    const urlValue = this.rabbitUrl?.trim();

    if (urlValue) {
      const effectiveUrl = this.ensureFrameMaxInUrl(urlValue);
      const parsed = this.safeParseUrl(effectiveUrl);
      const diagnostics: RabbitConnectionDiagnostics = {
        effectiveUrl: this.maskAmqpUrl(effectiveUrl),
        host: parsed?.hostname ?? this.rabbitHost,
        port: parsed?.port ? Number(parsed.port) : this.rabbitPort,
        vhost: parsed ? this.parseVhostFromPath(parsed.pathname) : this.rabbitVhost,
        user: parsed?.username ? decodeURIComponent(parsed.username) : this.rabbitUser,
        frameMax: this.rabbitFrameMax,
      };

      return {
        connectTarget: effectiveUrl,
        diagnostics,
      };
    }

    const connectTarget: Options.Connect = {
      protocol: "amqp",
      hostname: this.rabbitHost,
      port: this.rabbitPort,
      username: this.rabbitUser,
      password: this.rabbitPassword,
      vhost: this.rabbitVhost,
      frameMax: this.rabbitFrameMax,
    };

    const diagnostics: RabbitConnectionDiagnostics = {
      effectiveUrl: this.maskAmqpUrl(this.buildUrlFromParts()),
      host: this.rabbitHost,
      port: this.rabbitPort,
      vhost: this.rabbitVhost,
      user: this.rabbitUser,
      frameMax: this.rabbitFrameMax,
    };

    return { connectTarget, diagnostics };
  }

  private ensureFrameMaxInUrl(urlValue: string): string {
    const parsed = this.safeParseUrl(urlValue);
    if (!parsed) {
      return urlValue;
    }

    if (!parsed.searchParams.has("frameMax") && !parsed.searchParams.has("frame_max")) {
      parsed.searchParams.set("frameMax", String(this.rabbitFrameMax));
    }

    return parsed.toString();
  }

  private buildUrlFromParts(): string {
    const encodedUser = encodeURIComponent(this.rabbitUser);
    const encodedPassword = encodeURIComponent(this.rabbitPassword);
    const vhostPath = this.toVhostPath(this.rabbitVhost);
    return `amqp://${encodedUser}:${encodedPassword}@${this.rabbitHost}:${this.rabbitPort}${vhostPath}?frameMax=${this.rabbitFrameMax}`;
  }

  private toVhostPath(vhost: string): string {
    if (vhost === "/") {
      return "/";
    }

    const normalized = vhost.startsWith("/") ? vhost.slice(1) : vhost;
    return `/${encodeURIComponent(normalized)}`;
  }

  private parseVhostFromPath(pathname: string): string {
    if (!pathname || pathname === "/") {
      return "/";
    }

    return decodeURIComponent(pathname.slice(1));
  }

  private safeParseUrl(urlValue: string): URL | null {
    try {
      return new URL(urlValue);
    } catch {
      return null;
    }
  }

  private maskAmqpUrl(urlValue: string): string {
    const parsed = this.safeParseUrl(urlValue);
    if (!parsed) {
      return "[invalid-amqp-url]";
    }

    if (parsed.password) {
      parsed.password = "***";
    }

    return parsed.toString();
  }

  private getErrorDetails(error: unknown): {
    errorName: string;
    errorMessage: string;
  } {
    if (error instanceof Error) {
      return {
        errorName: error.name,
        errorMessage: error.message,
      };
    }

    return {
      errorName: "UnknownError",
      errorMessage: String(error),
    };
  }
}
