import { Bot } from "grammy";
import { AppConfig } from "./config.ts";
import { Database } from "./db.ts";
import { extractSummary } from "./tela.ts";
import { formatTimestamp } from "./utils.ts";

export function getBot(config: AppConfig, database: Database) {
  const bot = new Bot(config.telegram.token);

  bot.command("resumo", async (ctx, next) => {
    if (!ctx.chatId) return next();

    if (!ctx.msg.reply_to_message) {
      return ctx.reply("Responda a uma mensagem para usar esse comando");
    }

    const startTime = ctx.msg.reply_to_message.date;

    if (!startTime) return next();

    const selectedMessages = await database.getMessages(ctx.chatId, startTime);

    const history = selectedMessages.map((msg) =>
      [
        `${msg.author}, [${formatTimestamp(msg.timestamp)}]`,
        "",
        msg.text,
        "",
      ].join("\n")
    ).join("\n");

    await ctx.replyWithChatAction("typing");

    const { summary, ongoing_discussion: ongoing } = await extractSummary(
      history,
    );

    const formattedSummary: string[] = [
      `Resumo das últimas ~${selectedMessages.length} mensagens`,
      "",
      "O que rolou:",
      summary.map((bp) => `- ${bp}`).join("\n"),
    ];

    if (ongoing && ongoing.length) {
      formattedSummary.push(...[
        "",
        "O que tá rolando:",
        ongoing.map((bp) => `- ${bp}`).join("\n"),
      ]);
    }

    return ctx.reply(formattedSummary.join("\n"));
  });

  bot.on("message:text", async (ctx, next) => {
    if (!ctx.chatId) return next();

    const author = ctx.msg.forward_origin?.type === "user"
      ? ctx.msg.forward_origin.sender_user.first_name
      : ctx.msg.forward_origin?.type === "hidden_user"
      ? ctx.msg.forward_origin.sender_user_name
      : "Unknown";

    await database.storeMessage(ctx.chatId, {
      author,
      text: ctx.msg.text,
      timestamp: ctx.msg.date,
    });

    console.log("Stored message", JSON.stringify(ctx.msg, null, 2));

    return next();
  });

  return bot;
}
