import { readFile } from "fs/promises";
import path from "path";

import type { ChatMessage, Persona } from "@/types/persona";

export type MessageIntent = "technical" | "career" | "motivational" | "default";

const technicalKeywords = [
  "code",
  "bug",
  "debug",
  "javascript",
  "typescript",
  "react",
  "node",
  "api",
  "function",
  "algorithm",
  "database",
  "next.js",
  "tailwind",
  "ai",
  "agent",
  "agents",
  "genai"
];

const careerKeywords = [
  "job",
  "salary",
  "career",
  "resume",
  "interview",
  "offer",
  "switch",
  "freelance",
  "internship"
];

const motivationalKeywords = [
  "struggle",
  "stuck",
  "help",
  "confused",
  "tired",
  "burnout",
  "motivation",
  "lost",
  "fear"
];

const personaCache = new Map<string, Persona>();

export async function loadPersona(personaId: string): Promise<Persona> {
  const cachedPersona = personaCache.get(personaId);

  if (cachedPersona) {
    return cachedPersona;
  }

  const personaPath = path.join(process.cwd(), "personas", `${personaId}.json`);
  const contents = await readFile(personaPath, "utf-8");
  const persona = JSON.parse(contents) as Persona;
  personaCache.set(personaId, persona);
  return persona;
}

export function detectIntent(message: string): MessageIntent {
  const normalized = message.toLowerCase();

  if (technicalKeywords.some((keyword) => normalized.includes(keyword))) {
    return "technical";
  }

  if (careerKeywords.some((keyword) => normalized.includes(keyword))) {
    return "career";
  }

  if (motivationalKeywords.some((keyword) => normalized.includes(keyword))) {
    return "motivational";
  }

  return "default";
}

export function buildSystemPrompt(persona: Persona, messageIntent: MessageIntent): string {
  const identityLayer = persona.context_chunks.default;
  const contextLayer = persona.context_chunks[messageIntent];
  const familiarDomains = persona.knowledge_domains.familiar?.join(", ");
  const forbiddenPhrases = persona.voice.forbidden_phrases?.join(" | ");
  const philosophy = persona.teaching_philosophy;

  return [
    "LAYER 1: IDENTITY",
    identityLayer,
    "",
    "LAYER 2: CONTEXT",
    contextLayer,
    "",
    `Persona name: ${persona.meta.full_name}`,
    `Profession: ${persona.meta.profession}`,
    `Primary language: ${persona.meta.primary_language}`,
    `Tone: ${persona.voice.tone.join(", ")}`,
    `Signature phrases: ${persona.voice.signature_phrases.join(" | ")}`,
    `Expert domains: ${persona.knowledge_domains.expert.join(", ")}`,
    familiarDomains ? `Familiar domains: ${familiarDomains}` : "",
    `Avoid topics: ${persona.knowledge_domains.avoid.join(", ")}`,
    persona.voice.language_mix ? `Language mix: ${persona.voice.language_mix}` : "",
    forbiddenPhrases ? `Forbidden phrases: ${forbiddenPhrases}` : "",
    philosophy ? `Teaching style: ${philosophy.style}` : "",
    philosophy ? `Target audience: ${philosophy.target_audience}` : "",
    "Response style: default to concise answers unless the user explicitly asks for depth.",
    "Prefer short paragraphs or compact bullets. Avoid unnecessary verbosity.",
    "Stay in character for every response."
  ]
    .filter(Boolean)
    .join("\n");
}

function recentAssistantMessages(history: ChatMessage[]): string[] {
  return history
    .filter((message) => message.role === "assistant")
    .slice(-3)
    .map((message) => message.content.toLowerCase());
}

export function buildStyleGuardBlock(persona: Persona, history: ChatMessage[]): string {
  const recentAssistantContent = recentAssistantMessages(history);
  const usedSignaturePhrases = (persona.voice.signature_phrases ?? []).filter((phrase) =>
    recentAssistantContent.some((content) => content.includes(phrase.toLowerCase()))
  );

  const variationRules = [
    "STYLE VARIATION GUARD",
    "Signature phrases are optional, not mandatory.",
    "Preserve the persona's tone and intent, but do not reuse the exact same opener, catchphrase, or outro on every reply.",
    "If the user greets casually, respond naturally; do not force a stock line unless it fits the moment.",
    "Vary the response shape across turns: brief answer, example-first answer, bullet list, analogy, or clarifying question when appropriate.",
    "Avoid sounding robotic or identical across repeated interactions."
  ];

  if (usedSignaturePhrases.length > 0) {
    variationRules.push(`Recently used signature phrases: ${usedSignaturePhrases.join(" | ")}`);
    variationRules.push("Do not reuse the recently used signature phrases unless the context strongly calls for it.");
  }

  return variationRules.join("\n");
}
