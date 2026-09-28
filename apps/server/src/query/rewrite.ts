import type { ChatMessage } from "@turium-assignment/contracts";
import { generateText } from "ai";
import type { LanguageModel } from "ai";

const SYSTEM = `You turn the latest question in a conversation into one standalone search query.
Resolve pronouns and references ("it", "the second one") using the conversation.
Output only the query, with no quotes or explanation.`;

export async function rewriteQuery(model: LanguageModel, history: ChatMessage[], question: string) {
  const transcript = history.map((message) => `${message.role}: ${message.content}`).join("\n");
  const { text } = await generateText({
    model,
    system: SYSTEM,
    prompt: `Conversation:\n${transcript}\n\nLatest question: ${question}`,
  });
  return text.trim() || question;
}
