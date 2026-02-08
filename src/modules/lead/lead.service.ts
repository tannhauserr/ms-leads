import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../config/logger";
import CustomError from "../../models/custom-error/CustomError";
import { FieldCryptoService } from "../../services/crypto/field-crypto.service";
import { PiiHashService } from "../../services/crypto/pii-hash.service";
import {
  normalizeEmail,
  normalizePhone,
} from "../../services/normalizers/contact-normalizer.service";
import {
  RabbitPubSubService,
} from "../../services/rabbitmq/rabbit-pubsub.service";
import { LeadCreatedEvent } from "../../services/rabbitmq/interfaces";
import { publishLeadCreated } from "../../services/rabbitmq/publish";
import { CreateLeadInput } from "./lead.schema";

interface CreateLeadResult {
  id: string;
}

interface InternalLeadResponse {
  id: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string | null;
  companyName: string;
  country: string;
  businessType: string;
  numberOfStaff: string;
}

export class LeadService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fieldCryptoService: FieldCryptoService,
    private readonly piiHashService: PiiHashService,
    private readonly rabbitPubSubService: RabbitPubSubService,
  ) {}

  public async createLead(
    input: CreateLeadInput,
    correlationId: string,
  ): Promise<CreateLeadResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const normalizedPhone = normalizePhone(input.phone);
    const sanitizedMessage = input.message?.trim() || null;

    try {
      const lead = await this.prisma.lead.create({
        data: {
          companyId: input.companyId,
          source: input.source,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,

          firstNameEnc: this.fieldCryptoService.encrypt(input.firstName),
          lastNameEnc: this.fieldCryptoService.encrypt(input.lastName),
          emailEnc: this.fieldCryptoService.encrypt(normalizedEmail),
          phoneEnc: this.fieldCryptoService.encrypt(normalizedPhone),
          messageEnc: sanitizedMessage
            ? this.fieldCryptoService.encrypt(sanitizedMessage)
            : null,

          companyName: input.companyName,
          country: input.country,
          businessType: input.businessType,
          numberOfStaff: input.numberOfStaff,

          emailHash: this.piiHashService.hashNormalizedValue(normalizedEmail),
          phoneHash: this.piiHashService.hashNormalizedValue(normalizedPhone),
        },
      });

      const event: LeadCreatedEvent = {
        eventId: randomUUID(),
        type: "lead.created",
        occurredAt: lead.createdDate.toISOString(),
        leadId: lead.id,
        source: lead.source,
        correlationId,
      };

      await publishLeadCreated(this.rabbitPubSubService, event);

      logger.info(
        {
          correlationId,
          leadId: lead.id,
          source: lead.source,
        },
        "Lead created and event published",
      );

      return { id: lead.id };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError("Unable to create lead", {
        statusCode: 500,
        serviceName: "LeadService.createLead",
        cause: error,
        messageStoredType: "verbose",
      });
    }
  }

  public async getLeadByIdInternal(
    leadId: string,
    correlationId: string,
  ): Promise<InternalLeadResponse> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new CustomError("Lead not found", {
        statusCode: 404,
        serviceName: "LeadService.getLeadByIdInternal",
        messageStoredType: "simple",
      });
    }

    logger.info({ correlationId, leadId }, "Internal lead lookup");

    return {
      id: lead.id,
      source: lead.source,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      createdDate: lead.createdDate.toISOString(),
      firstName: this.fieldCryptoService.decrypt(lead.firstNameEnc),
      lastName: this.fieldCryptoService.decrypt(lead.lastNameEnc),
      email: this.fieldCryptoService.decrypt(lead.emailEnc),
      phone: this.fieldCryptoService.decrypt(lead.phoneEnc),
      message: lead.messageEnc ? this.fieldCryptoService.decrypt(lead.messageEnc) : null,
      companyName: lead.companyName,
      country: lead.country,
      businessType: lead.businessType,
      numberOfStaff: lead.numberOfStaff,

      
    };
  }
}
