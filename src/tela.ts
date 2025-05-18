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
