import { connect } from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { env } from "../../config/env";


export class RabbitPubSubService {
  private readonly rabbitUrl?: string;
  private readonly rabbitUser: string;
  private readonly rabbitPassword: string;
  private readonly rabbitHost: string;
  private readonly rabbitPort: number;
  private readonly rabbitVhost: string;
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
      const connection = this.rabbitUrl
        ? await connect(this.rabbitUrl)
        : await connect({
            protocol: "amqp",
            hostname: this.rabbitHost,
            port: this.rabbitPort,
            username: this.rabbitUser,
            password: this.rabbitPassword,
            vhost: this.rabbitVhost,
          });
      const channel = await connection.createChannel();
      await channel.prefetch(this.rabbitPrefetch);

      connection.on("close", () => {
        this.connection = null;
        this.channel = null;
        this.initPromise = null;
      });

      connection.on("error", () => {
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
}
