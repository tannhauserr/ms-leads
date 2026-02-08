import { Server } from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";
import { rabbitPubSubService } from "./container/app.container";
import { initializeSubscriptions } from "./services/rabbitmq/initializeSubscriptions";

async function bootstrap(): Promise<void> {
  await initializeSubscriptions(rabbitPubSubService);

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "ms-leads is running");
  });

  registerShutdown(server);
}

function registerShutdown(server: Server): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.warn({ signal }, "Shutdown signal received");

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      await rabbitPubSubService.close();
      await prisma.$disconnect();

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught exception");
    void shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled rejection");
    void shutdown("unhandledRejection");
  });
}

void bootstrap().catch((error) => {
  logger.error({ err: error }, "Application bootstrap failed");
  process.exit(1);
});
