import { createTelaClient } from "@meistrari/tela-sdk-js";
import { config } from "./config.ts";

const tela = createTelaClient({ apiKey: config.tela.token });

export async function extractSummary(history: string) {
  const completion = await tela.completions.create<
    { chat_history: string },
    { summary: string[]; ongoing_discussion?: string[] }
  >({
    canvasId: config.tela.canvasId,
    versionId: "tela_ver_n7eja8sbRBKzsTmY3Lq-pg",
    variables: {
      chat_history: history,
    },
    stream: false,
  });

  return completion.choices[0].message.content;
}

export async function defineConcepts(message: string, question?: string) {
  console.log(
    "[tela] Defining concepts for message:",
    message,
    "| question:",
    question,
  );

  type Concept = { name: string; definition: string };

  const completion = await tela.completions.create<
    { message: string; question?: string },
    {
      concepts: Concept[];
      message: string;
    }
  >({
    versionId: "b469e438-b32a-4ec3-b18a-962efb35e1e8",
    variables: {
      message,
      question,
    },
    stream: false,
  });

  return completion.choices[0].message.content;
}

export async function tldr(message: string) {
  const completion = await tela.completions.create<
    { message: string },
    { resumo: string }
  >({
    versionId: "2edf3551-9fa6-46e4-b815-e71dd117b954",
    variables: {
      message,
    },
    stream: false,
  });

  return completion.choices[0].message.content;
}
