import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type { ChatMessage } from "@/types/persona";

const MAX_HISTORY = 10;

export function trimHistory(history: ChatMessage[]): ChatMessage[] {
  return history.slice(-MAX_HISTORY);
}

export function addMessage(history: ChatMessage[], message: ChatMessage): ChatMessage[] {
  return trimHistory([...history, message]);
}

export function buildMessages(
  history: ChatMessage[],
  systemPrompt: string
): ChatCompletionMessageParam[] {
  const trimmedHistory = trimHistory(history);

  return [
    {
      role: "system",
      content: systemPrompt
    },
    ...trimmedHistory.map<ChatCompletionMessageParam>((message) => ({
      role: message.role,
      content: message.content
    }))
  ];
}
