import { readFile } from "fs/promises";
import path from "path";

import type { MessageIntent } from "@/lib/persona-loader";
import type { PersonaResource, PersonaResourceCatalog } from "@/types/persona";

const catalogCache = new Map<string, PersonaResourceCatalog>();

const topicKeywords: Record<string, string[]> = {
  javascript: ["javascript", "js", "ecmascript"],
  react: ["react", "frontend", "hooks", "component"],
  nodejs: ["node", "nodejs", "backend", "express", "api"],
  typescript: ["typescript", "ts"],
  systemdesign: ["system design", "architecture", "scalability", "microservice"],
  aiagents: ["ai agent", "ai agents", "agent", "agents", "genai", "llm", "rag"],
  masterji: ["masterji"],
  career: ["career", "job", "resume", "interview", "salary", "roadmap"],
  motivation: ["motivation", "stuck", "confused", "burnout", "discipline", "consistency"]
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export async function loadResourceCatalog(personaId: string): Promise<PersonaResourceCatalog> {
  const cachedCatalog = catalogCache.get(personaId);

  if (cachedCatalog) {
    return cachedCatalog;
  }

  const catalogPath = path.join(process.cwd(), "catalogs", `${personaId}.json`);
  const contents = await readFile(catalogPath, "utf-8");
  const catalog = JSON.parse(contents) as PersonaResourceCatalog;
  catalogCache.set(personaId, catalog);
  return catalog;
}

export function detectResourceTopics(message: string): string[] {
  const normalized = normalizeText(message);

  return Object.entries(topicKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([topic]) => topic);
}

function scoreResource(resource: PersonaResource, intent: MessageIntent, topics: string[]): number {
  let score = resource.priority;

  if (resource.intents.includes(intent)) {
    score += 20;
  }

  for (const topic of topics) {
    if (resource.tags.includes(topic)) {
      score += 15;
    }
  }

  return score;
}

function hasAliasMatch(resource: PersonaResource, normalizedMessage: string): boolean {
  return (resource.aliases ?? []).some((alias) => normalizedMessage.includes(normalizeText(alias)));
}

function scoreEntityMatch(resource: PersonaResource, normalizedMessage: string): number {
  let score = 0;

  if (hasAliasMatch(resource, normalizedMessage)) {
    score += 60;
  }

  return score;
}

export async function recommendResources(
  personaId: string,
  message: string,
  intent: MessageIntent,
  limit = 3
): Promise<PersonaResource[]> {
  const catalog = await loadResourceCatalog(personaId);
  const normalizedMessage = normalizeText(message);
  const topics = detectResourceTopics(message);

  const rankedResources = [...catalog.resources]
    .filter((resource) => {
      if (hasAliasMatch(resource, normalizedMessage)) {
        return true;
      }

      if (topics.length === 0) {
        return resource.intents.includes(intent);
      }

      return resource.tags.some((tag) => topics.includes(tag)) || resource.intents.includes(intent);
    })
    .sort(
      (left, right) =>
        scoreResource(right, intent, topics) +
          scoreEntityMatch(right, normalizedMessage) -
          (scoreResource(left, intent, topics) + scoreEntityMatch(left, normalizedMessage))
    );

  return rankedResources.slice(0, limit);
}

export function buildResourcePromptBlock(resources: PersonaResource[]): string {
  if (resources.length === 0) {
    return "";
  }

  return [
    "LAYER 3: VERIFIED RESOURCES",
    "If the user's question calls for recommendations, naturally suggest only from this curated list.",
    "Do not invent titles or URLs.",
    ...resources.map(
      (resource) =>
        `- ${resource.title} [${resource.type}] (${resource.tags.join(", ")}): ${resource.description} -> ${resource.url}`
    )
  ].join("\n");
}
