import { Api } from "grammy";
import { config } from "./src/config.ts";

const api = new Api(config.telegram.token);
await api.setWebhook(Deno.args[0], { secret_token: config.telegram.secret });
console.log(await api.getMe());
console.log(await api.getWebhookInfo());
