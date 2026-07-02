import type { Persona } from "@/types/persona";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validatePersonaShape(persona: Persona): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(persona.id)) {
    errors.push("persona.id is required");
  }

  if (!isNonEmptyString(persona.meta.full_name)) {
    errors.push("meta.full_name is required");
  }

  if (!isNonEmptyString(persona.meta.profession)) {
    errors.push("meta.profession is required");
  }

  if (!Array.isArray(persona.voice.signature_phrases) || persona.voice.signature_phrases.length === 0) {
    errors.push("voice.signature_phrases must contain at least one phrase");
  }

  if (!Array.isArray(persona.knowledge_domains.expert) || persona.knowledge_domains.expert.length === 0) {
    errors.push("knowledge_domains.expert must contain at least one domain");
  }

  if (!isNonEmptyString(persona.context_chunks.default)) {
    errors.push("context_chunks.default is required");
  }

  return errors;
}
