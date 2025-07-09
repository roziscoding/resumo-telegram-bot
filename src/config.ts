import { z } from "zod";

export const AppConfig = z.object({
  TELEGRAM_TOKEN: z.string(),
  TELA_TOKEN: z.string(),
  TELA_CANVAS_ID: z.string(),
  ENVIRONMENT: z.enum(["dev", "prod"]).optional().default("dev"),
  DATABSE_CONNECTION_STRING: z.string(),
  OWNER_ID: z.string().optional(),
}).transform((env) => ({
  telegram: {
    token: env.TELEGRAM_TOKEN,
    secret: env.TELEGRAM_TOKEN.replace(/[^a-z0-9]/ig, ""),
    ownerId: env.OWNER_ID ? parseInt(env.OWNER_ID, 10) : undefined,
  },
  tela: {
    token: env.TELA_TOKEN,
    canvasId: env.TELA_CANVAS_ID,
  },
  environment: env.ENVIRONMENT,
  database: {
    connectionString: env.DATABSE_CONNECTION_STRING,
  },
}));

export const config = AppConfig.parse(Deno.env.toObject());
export type AppConfig = z.infer<typeof AppConfig>;
