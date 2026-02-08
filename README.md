# ms-lead

Microservicio de captura de leads para formularios web públicos.

## ¿Para qué sirve?

Este servicio recibe datos de contacto desde la web, los guarda en PostgreSQL de forma segura y publica un evento en RabbitMQ para que otros sistemas puedan reaccionar.

## Qué hace

- Expone API HTTP para crear y consultar leads.
- Cifra campos sensibles (PII) antes de guardar.
- Genera hashes de email y teléfono para búsqueda/deduplicación sin exponer PII.
- Publica evento `lead.created` sin datos sensibles.
- Incluye endpoint interno para leer un lead desencriptado (protegido por token).

## Seguridad

- Cifrado AES-256-GCM por campo.
- Validación de payload con Zod.
- Honeypot y rate limit básico.
- Logs sin PII.

## Endpoints principales

- `POST /api/leads`
  - Crea un lead.
- `GET /api/leads/:id`
  - Solo interno (`X-Internal-Token`).

## Stack

- Node.js + TypeScript + Express
- Prisma + PostgreSQL
- RabbitMQ
- Jest (tests unitarios)
