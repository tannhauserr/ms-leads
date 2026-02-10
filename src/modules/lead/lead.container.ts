import { prisma } from "../../config/prisma";
import { fieldCryptoService, piiHashService, rabbitPubSubService } from "../../container/app.container";
import { leadAntiBotService } from "../../services/security/lead-antibot.service";
import { LeadService } from "./lead.service";


export const leadService = new LeadService(
  prisma,
  fieldCryptoService,
  piiHashService,
  rabbitPubSubService,
);

export { leadAntiBotService };
