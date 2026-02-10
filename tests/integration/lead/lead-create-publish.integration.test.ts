import { PrismaClient } from "@prisma/client";
import { LeadService } from "../../../src/modules/lead/lead.service";
import { FieldCryptoService } from "../../../src/services/crypto/field-crypto.service";
import { PiiHashService } from "../../../src/services/crypto/pii-hash.service";
import { RabbitPubSubService } from "../../../src/services/rabbitmq/rabbit-pubsub.service";
import {
  leadCreatedExchange,
  leadCreatedRoutingKey,
} from "../../../src/services/rabbitmq/lead/keys";

const MASTER_KEY_BASE64 = Buffer.from("lead-service-master-key").toString("base64");
const HASH_KEY_BASE64 = Buffer.from("lead-service-hash-key").toString("base64");

describe("LeadService integration (publish lead.created)", () => {
  it("publishes lead.created event so another microservice can consume it", async () => {
    const mockLeadId = "e0ec3a2e-76f8-4ba1-a5f6-26f3f036d4a3";
    const correlationId = "81638f57-ec9d-4556-b6b3-61843833880a";

    const mockCreate = jest.fn().mockResolvedValue({
      id: mockLeadId,
      source: "webform",
      createdDate: new Date("2026-02-09T10:00:00.000Z"),
    });

    const prisma = {
      lead: {
        create: mockCreate,
      },
    } as unknown as PrismaClient;

    const assertExchange = jest.fn().mockResolvedValue(undefined);
    const publish = jest.fn().mockReturnValue(true);

    const channel = {
      assertExchange,
      publish,
      once: jest.fn(),
    } as any;

    const rabbit = {
      initialize: jest.fn().mockResolvedValue(channel),
    } as unknown as RabbitPubSubService;

    const service = new LeadService(
      prisma,
      new FieldCryptoService(MASTER_KEY_BASE64, 1),
      new PiiHashService(HASH_KEY_BASE64),
      rabbit,
    );

    const result = await service.createLead(
      {
        source: "webform",
        firstName: "Alfredo",
        lastName: "Gomez",
        email: "  USER@Example.com ",
        phone: " +34 (600) 12-34-56 ",
        companyName: "Red Blue Code",
        country: "Spain",
        businessType: "Salon",
        numberOfStaff: "10",
        acceptPrivacyPolicy: true,
        turnstileToken: "dummy-token-for-service-layer-test",
        startedAt: Date.now() - 10_000,
        hp: "",
      },
      correlationId,
    );

    expect(result).toEqual({ id: mockLeadId });
    expect(mockCreate).toHaveBeenCalledTimes(1);

    expect(assertExchange).toHaveBeenCalledWith(leadCreatedExchange, "topic", {
      durable: true,
    });

    expect(publish).toHaveBeenCalledTimes(1);
    const [exchange, routingKey, payload, options] = publish.mock.calls[0];

    expect(exchange).toBe(leadCreatedExchange);
    expect(routingKey).toBe(leadCreatedRoutingKey);
    expect(options).toEqual({
      persistent: true,
      contentType: "application/json",
    });

    const publishedEvent = JSON.parse(payload.toString("utf8"));
    expect(publishedEvent).toMatchObject({
      type: "lead.created",
      leadId: mockLeadId,
      source: "webform",
      correlationId,
      occurredAt: "2026-02-09T10:00:00.000Z",
    });
    expect(publishedEvent.eventId).toBeDefined();
  });
});
