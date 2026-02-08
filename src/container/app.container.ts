import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { FieldCryptoService } from "../services/crypto/field-crypto.service";
import { PiiHashService } from "../services/crypto/pii-hash.service";
import { RabbitPubSubService } from "../services/rabbitmq/rabbit-pubsub.service";
import { LeadService } from "../modules/lead/lead.service";

const fieldCryptoService = new FieldCryptoService(
  env.LEADS_MASTER_KEY,
  env.LEADS_KEY_VERSION,
);
const piiHashService = new PiiHashService(env.LEADS_HASH_KEY);

export const rabbitPubSubService = new RabbitPubSubService();

export const leadService = new LeadService(
  prisma,
  fieldCryptoService,
  piiHashService,
  rabbitPubSubService,
);

