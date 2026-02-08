import { connect } from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { env } from "../../config/env";


export class RabbitPubSubService {
  private readonly rabbitUrl: string;

  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private initPromise: Promise<Channel> | null = null;

  constructor(rabbitUrl: string = env.RABBITMQ_URL) {
    this.rabbitUrl = rabbitUrl;
  }

  public async initialize(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const connection = await connect(this.rabbitUrl);
      const channel = await connection.createChannel();

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
