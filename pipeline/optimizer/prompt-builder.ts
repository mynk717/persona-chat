import { buildSystemPrompt, detectIntent } from "@/lib/persona-loader";
import type { Persona } from "@/types/persona";

export function buildPromptForMessage(persona: Persona, message: string): string {
  return buildSystemPrompt(persona, detectIntent(message));
}
