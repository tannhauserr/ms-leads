import dotenv from "dotenv";
import { z } from "zod";

const runtimeNodeEnv = process.env.NODE_ENV ?? "development";

dotenv.config();
dotenv.config({ path: `.env.${runtimeNodeEnv}` });

const base64KeySchema = z
  .string()
  .min(1)
  .refine((value) => Buffer.from(value, "base64").length > 0, {
    message: "Must be a valid base64 string",
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/ms_leads?schema=public"),

  // Optional: if provided, this URL has priority over separate vars.
  RABBITMQ_URL: z.string().optional().default(""),
  RABBITMQ_USER: z.string().min(1).default("guest"),
  RABBITMQ_PASSWORD: z.string().min(1).default("guest"),
  RABBITMQ_HOST: z.string().min(1).default("localhost"),
  RABBITMQ_PORT: z.coerce.number().int().positive().default(5672),
  RABBITMQ_VHOST: z.string().min(1).default("/"),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(1),

  LEADS_MASTER_KEY: base64KeySchema.default(
    Buffer.from("replace-this-master-key").toString("base64"),
  ),
  LEADS_KEY_VERSION: z.coerce.number().int().positive().default(1),
  LEADS_HASH_KEY: base64KeySchema.default(
    Buffer.from("replace-this-hash-key").toString("base64"),
  ),

  INTERNAL_API_TOKEN: z.string().min(1).default("change-me-internal-token"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;
