import { Bot } from "grammy";
import { AppConfig } from "./config.ts";
import { Database } from "./db.ts";
import { defineConcepts, extractSummary } from "./tela.ts";
import { formatTimestamp } from "./utils.ts";

export function getBot(config: AppConfig, database: Database) {
  const bot = new Bot(config.telegram.token);

  bot.command("start", (ctx) => {
    return ctx.chat.type === "private"
      ? ctx.reply(
        "Me adiciona num grupo pra eu começar a ler as mensagens dele e poder resumir :)",
      )
      : ctx.reply(
        "Pra resumir as mensagens, responde à primeira mensagem que quiser resumir com o comando /resumo",
      );
  });

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
        `${msg.originalId}: ${msg.author}, [${formatTimestamp(msg.timestamp)}]${
          msg.inReplyTo ? ` (em resposta a ${msg.inReplyTo})` : ""
        }:`,
        "",
        msg.text,
        "",
      ].join("\n")
    ).join("\n");

    console.log(history);

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

  bot.command("wtf", async (ctx) => {
    if (!ctx.msg.reply_to_message) {
      return ctx.reply("Responda a uma mensagem para usar esse comando");
    }

    const messageText = ctx.msg.reply_to_message.text;

    if (!messageText) {
      return ctx.reply(
        "Responda a uma mensagem de texto para usar esse comando",
      );
    }

    await ctx.replyWithChatAction("typing");

    const { message, concepts } = await defineConcepts(messageText, ctx.match);

    const formattedConcepts = concepts.map(
      (concept) => (`<b>${concept.name}</b>\n${concept.definition}`),
    );

    const formattedMessage = `${message}\n\n${formattedConcepts.join("\n\n")}`;

    return ctx.reply(formattedMessage, { parse_mode: "HTML" });
  });

  bot.on("my_chat_member:from", async (ctx, next) => {
    if (!config.telegram.ownerId) return next();

    if (ctx.myChatMember.from.id !== config.telegram.ownerId) {
      await Promise.allSettled([
        ctx.reply("Nope."),
        ctx.leaveChat(),
      ]);
    }
  });

  bot.on("message:text", async (ctx, next) => {
    if (!ctx.chatId) return next();

    const author = ctx.msg.forward_origin?.type === "user"
      ? ctx.msg.forward_origin.sender_user.first_name
      : ctx.msg.forward_origin?.type === "hidden_user"
      ? ctx.msg.forward_origin.sender_user_name
      : ctx.msg.from.first_name ?? "Unknown";

    await database.storeMessage(ctx.chatId, {
      author,
      text: ctx.msg.text,
      timestamp: ctx.msg.date,
      originalId: ctx.msg.message_id,
      inReplyTo: ctx.msg.reply_to_message?.message_id,
    });

    console.log(
      "Stored message",
      ctx.msg.text,
      "from",
      author,
      "at",
      ctx.chat.title ?? ctx.chat.username ?? ctx.chat.id,
    );

    return next();
  });

  return bot;
}
