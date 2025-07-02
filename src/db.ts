import { neon } from "@neondatabase/serverless";
import { AppConfig } from "./config.ts";

type Message = {
  author: string;
  text: string;
  timestamp: number;
};

export async function getDatabase(config: AppConfig) {
  const sql = neon(config.database.connectionString);

  await sql`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP,
    chatId TEXT NOT NULL
  )`;

  async function storeMessage(chatId: number, message: Message) {
    await sql`INSERT INTO messages(author, text, timestamp, chatId) VALUES (
      ${message.author},
      ${message.text},
      ${new Date(message.timestamp * 1000).toISOString()},
      ${String(chatId)}
    )`;
  }

  async function getMessages(
    chatId: number,
    startTime: number,
  ): Promise<Message[]> {
    const messages = await sql`SELECT * FROM messages WHERE timestamp >= ${
      new Date(
        startTime * 1000,
      ).toISOString()
    } AND chatId = ${String(chatId)} ORDER BY timestamp ASC`;
    return messages as Message[];
  }

  return { storeMessage, getMessages };
}

export type Database = Awaited<ReturnType<typeof getDatabase>>;
