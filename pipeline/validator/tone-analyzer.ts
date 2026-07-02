import type { PersonaSourceDocument, ValidatedPersonaInsight } from "@/types/persona";

const candidatePhrases = [
  "hanji",
  "chai",
  "build",
  "system",
  "project",
  "consistency",
  "career"
];

export function extractToneSignals(
  documents: PersonaSourceDocument[]
): ValidatedPersonaInsight[] {
  const joinedContent = documents.map((document) => document.content.toLowerCase()).join(" ");

  return candidatePhrases
    .filter((phrase) => joinedContent.includes(phrase))
    .map((phrase) => ({
      label: `phrase:${phrase}`,
      evidence: documents
        .filter((document) => document.content.toLowerCase().includes(phrase))
        .map((document) => document.sourceUrl),
      confidence: 0.5
    }));
}
