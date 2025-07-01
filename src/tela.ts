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

export async function defineConcepts(message: string) {
  const completion = await tela.completions.create<
    { message: string },
    {
      concepts: { name: string; definition: string }[];
      message: string;
    }
  >({
    canvasId: "62caa156-1d75-4905-8bcb-185bf845b65f",
    variables: {
      message,
    },
    stream: false,
  });

  return completion.choices[0].message.content;
}
