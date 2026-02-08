export interface LeadCreatedEvent {
    eventId: string;
    type: "lead.created";
    occurredAt: string;
    leadId: string;
    source: string;
    correlationId: string;
}
