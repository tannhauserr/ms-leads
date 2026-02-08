import { RabbitPubSubService } from "./rabbit-pubsub.service";

export async function initializeSubscriptions(
  rabbitPubSubService: RabbitPubSubService,
): Promise<void> {
  await rabbitPubSubService.initialize();
}
