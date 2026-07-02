import type { PersonaSourceDocument, ValidatedPersonaInsight } from "@/types/persona";

export function buildVerifiedInsights(
  documents: PersonaSourceDocument[]
): ValidatedPersonaInsight[] {
  const sourceMap = new Map<string, string[]>();

  for (const document of documents) {
    const normalizedTitle = document.title.trim().toLowerCase();
    const existing = sourceMap.get(normalizedTitle) ?? [];
    sourceMap.set(normalizedTitle, [...existing, document.sourceUrl]);
  }

  return [...sourceMap.entries()].map(([label, evidence]) => ({
    label,
    evidence,
    confidence: Math.min(1, evidence.length / 2)
  }));
}
