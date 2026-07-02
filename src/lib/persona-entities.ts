import { readFile } from "fs/promises";
import path from "path";

import type { PersonaEntitiesDocument, PersonaEntity } from "@/types/persona";

const entityCache = new Map<string, PersonaEntitiesDocument>();

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

async function readEntities(personaId: string): Promise<PersonaEntitiesDocument> {
  const cached = entityCache.get(personaId);

  if (cached) {
    return cached;
  }

  const filePath = path.join(process.cwd(), "data", "entities", `${personaId}.json`);
  const contents = await readFile(filePath, "utf-8");
  const document = JSON.parse(contents) as PersonaEntitiesDocument;
  entityCache.set(personaId, document);
  return document;
}

function flattenEntities(document: PersonaEntitiesDocument): PersonaEntity[] {
  return [
    ...document.apps,
    ...document.products,
    ...document.courses,
    ...document.brands,
    ...document.communities,
    ...document.projects,
    ...document.companies
  ];
}

function scoreEntity(entity: PersonaEntity, normalizedMessage: string): number {
  let score = entity.importance;

  if (normalizedMessage.includes(normalizeText(entity.name))) {
    score += 100;
  }

  for (const alias of entity.aliases) {
    if (normalizedMessage.includes(normalizeText(alias))) {
      score += 80;
    }
  }

  for (const tag of entity.tags) {
    if (normalizedMessage.includes(normalizeText(tag))) {
      score += 10;
    }
  }

  return score;
}

export async function matchEntities(
  personaId: string,
  message: string,
  limit = 3
): Promise<PersonaEntity[]> {
  const normalizedMessage = normalizeText(message);
  const document = await readEntities(personaId);

  return flattenEntities(document)
    .map((entity) => ({
      entity,
      score: scoreEntity(entity, normalizedMessage)
    }))
    .filter((item) => item.score > item.entity.importance)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.entity);
}

export async function buildEntityPromptBlock(
  personaId: string,
  message: string
): Promise<string> {
  const matchedEntities = await matchEntities(personaId, message);

  if (matchedEntities.length === 0) {
    return "";
  }

  return [
    "LAYER 3: NAMED ENTITIES",
    "If the user mentions one of these entities, treat it as real grounded persona knowledge.",
    "Do not reinterpret an existing named entity as a hypothetical idea.",
    ...matchedEntities.map(
      (entity) =>
        `- ${entity.name} [${entity.type}]: ${entity.description}${entity.url ? ` -> ${entity.url}` : ""}`
    )
  ].join("\n");
}
