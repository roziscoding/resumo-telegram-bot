import { webhookCallback } from "grammy";
import { getBot } from "./bot.ts";
import { config } from "./config.ts";
import { getDatabase } from "./db.ts";

const database = await getDatabase(config);
const bot = await getBot(config, database);

const handleUpdate = webhookCallback(bot, "std/http", {
  secretToken: config.telegram.secret,
});

Deno.serve({
  onListen: ({ port }) => {
    console.log(`Listening on port ${port}`);
  },
}, async (req) => {
  if (req.method === "POST") {
    return await handleUpdate(req);
  }

  return new Response();
});
