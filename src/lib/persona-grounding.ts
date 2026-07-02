import { readFile } from "fs/promises";
import path from "path";

import type { MessageIntent } from "@/lib/persona-loader";
import type {
  PersonaEvidenceDocument,
  PersonaExample,
  PersonaExamplesDocument,
  PersonaInsight,
  PersonaInsightsDocument
} from "@/types/persona";

const evidenceCache = new Map<string, PersonaEvidenceDocument>();
const insightsCache = new Map<string, PersonaInsightsDocument>();
const examplesCache = new Map<string, PersonaExamplesDocument>();

const topicKeywords: Record<string, string[]> = {
  javascript: ["javascript", "js", "closure", "promise", "async", "event loop"],
  react: ["react", "component", "state", "props", "hooks", "frontend"],
  nodejs: ["node", "nodejs", "express", "backend", "api"],
  typescript: ["typescript", "ts", "type safety"],
  systemdesign: ["system design", "architecture", "scale", "load", "microservice"],
  aiagents: ["ai agent", "ai agents", "agent", "agents", "genai", "llm", "rag"],
  masterji: ["masterji"],
  career: ["career", "job", "resume", "interview", "salary", "roadmap"],
  motivation: ["motivation", "stuck", "confused", "burnout", "discipline", "consistency"]
};

function normalizeText(value: string): string {
  return value.toLowerCase();
}

async function readJsonFile<T>(directory: string, personaId: string): Promise<T> {
  const filePath = path.join(process.cwd(), "data", directory, `${personaId}.json`);
  const contents = await readFile(filePath, "utf-8");
  return JSON.parse(contents) as T;
}

export async function loadEvidence(personaId: string): Promise<PersonaEvidenceDocument> {
  const cached = evidenceCache.get(personaId);
  if (cached) {
    return cached;
  }

  const document = await readJsonFile<PersonaEvidenceDocument>("evidence", personaId);
  evidenceCache.set(personaId, document);
  return document;
}

export async function loadInsights(personaId: string): Promise<PersonaInsightsDocument> {
  const cached = insightsCache.get(personaId);
  if (cached) {
    return cached;
  }

  const document = await readJsonFile<PersonaInsightsDocument>("insights", personaId);
  insightsCache.set(personaId, document);
  return document;
}

export async function loadExamples(personaId: string): Promise<PersonaExamplesDocument> {
  const cached = examplesCache.get(personaId);
  if (cached) {
    return cached;
  }

  const document = await readJsonFile<PersonaExamplesDocument>("examples", personaId);
  examplesCache.set(personaId, document);
  return document;
}

function detectTopics(message: string): string[] {
  const normalized = normalizeText(message);

  return Object.entries(topicKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([topic]) => topic);
}

function scoreTopicMatch(topic: string, topics: string[], intent: MessageIntent): number {
  let score = 0;

  if (topics.includes(topic)) {
    score += 20;
  }

  if (intent === "technical" && ["javascript", "react", "nodejs", "typescript", "systemdesign"].includes(topic)) {
    score += 10;
  }

  if (intent === "career" && topic === "career") {
    score += 10;
  }

  if (intent === "motivational" && topic === "motivation") {
    score += 10;
  }

  return score;
}

export async function matchInsights(
  personaId: string,
  message: string,
  intent: MessageIntent,
  limit = 3
): Promise<PersonaInsight[]> {
  const document = await loadInsights(personaId);
  const topics = detectTopics(message);

  return [...document.insights]
    .sort(
      (left, right) =>
        scoreTopicMatch(right.topic, topics, intent) - scoreTopicMatch(left.topic, topics, intent)
    )
    .slice(0, limit);
}

export async function matchExamples(
  personaId: string,
  message: string,
  intent: MessageIntent,
  limit = 2
): Promise<PersonaExample[]> {
  const document = await loadExamples(personaId);
  const topics = detectTopics(message);

  return document.examples
    .filter((example) => example.intent === intent || intent === "default")
    .sort(
      (left, right) =>
        scoreTopicMatch(right.topic, topics, intent) - scoreTopicMatch(left.topic, topics, intent)
    )
    .slice(0, limit);
}

export async function buildGroundingPromptBlock(
  personaId: string,
  message: string,
  intent: MessageIntent
): Promise<string> {
  const [evidence, insights, examples] = await Promise.all([
    loadEvidence(personaId),
    matchInsights(personaId, message, intent),
    matchExamples(personaId, message, intent)
  ]);

  const evidenceMap = new Map(evidence.items.map((item) => [item.id, item]));
  const usedEvidenceIds = new Set<string>();

  for (const insight of insights) {
    for (const evidenceId of insight.backedBy) {
      usedEvidenceIds.add(evidenceId);
    }
  }

  for (const example of examples) {
    for (const evidenceId of example.backedBy) {
      usedEvidenceIds.add(evidenceId);
    }
  }

  const selectedEvidence = [...usedEvidenceIds]
    .map((evidenceId) => evidenceMap.get(evidenceId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 4);

  return [
    "LAYER 3: GROUNDED PERSONA INSIGHTS",
    "Use these stored patterns and evidence to make the answer feel specific to the persona.",
    "If the user references a named app, product, course, or work and grounded data exists for it, acknowledge that specific entity directly.",
    "If a named entity is not grounded here, do not assume facts. Say you are not fully sure and answer cautiously.",
    "Do not quote evidence verbatim unless naturally brief.",
    ...insights.map((insight) => `- Insight (${insight.topic}): ${insight.summary}`),
    "",
    "LAYER 4: EXAMPLE RESPONSE PATTERNS",
    ...examples.map((example) => `- Example (${example.topic}/${example.intent}): ${example.pattern}`),
    "",
    "LAYER 5: EVIDENCE NOTES",
    ...selectedEvidence.map(
      (item) =>
        `- Evidence (${item.topic}/${item.kind}): ${item.claim} [source: ${item.sourceTitle}]`
    )
  ].join("\n");
}
