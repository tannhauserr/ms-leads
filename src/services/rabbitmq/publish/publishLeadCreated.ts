import type { RabbitPubSubService } from "../rabbit-pubsub.service";
import type { LeadCreatedEvent } from "../interfaces";
import {
  leadCreatedExchange,
  leadCreatedRoutingKey,
} from "../lead/keys";

export async function publishLeadCreated(
  rabbitPubSubService: RabbitPubSubService,
  event: LeadCreatedEvent,
): Promise<void> {
  const channel = await rabbitPubSubService.initialize();
  await channel.assertExchange(leadCreatedExchange, "topic", { durable: true });

  const payload = Buffer.from(JSON.stringify(event));
  const published = channel.publish(
    leadCreatedExchange,
    leadCreatedRoutingKey,
    payload,
    {
      persistent: true,
      contentType: "application/json",
    },
  );

  if (!published) {
    await new Promise<void>((resolve) => {
      channel.once("drain", () => resolve());
    });
  }
}

