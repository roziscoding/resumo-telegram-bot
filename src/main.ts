import { getBot } from "./bot.ts";
import { config } from "./config.ts";
import { getDatabase } from "./db.ts";

const database = await getDatabase(config);
const bot = getBot(config, database);

bot.start({
  onStart: ({ username }) => {
    console.log(`Listening as @${username}`);
  },
});
