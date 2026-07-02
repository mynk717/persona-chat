import type { PersonaSourceDocument } from "@/types/persona";

export interface OptimizedChunk {
  personaId: string;
  tag: "technical" | "career" | "motivational" | "default";
  content: string;
}

function inferChunkTag(text: string): OptimizedChunk["tag"] {
  const normalized = text.toLowerCase();

  if (/(react|node|typescript|code|api|database)/.test(normalized)) {
    return "technical";
  }

  if (/(career|job|salary|resume|interview)/.test(normalized)) {
    return "career";
  }

  if (/(motivation|struggle|confused|stuck|consistency)/.test(normalized)) {
    return "motivational";
  }

  return "default";
}

export function chunkDocuments(
  documents: PersonaSourceDocument[],
  maxChunkLength = 1800
): OptimizedChunk[] {
  const chunks: OptimizedChunk[] = [];

  for (const document of documents) {
    for (let index = 0; index < document.content.length; index += maxChunkLength) {
      const content = document.content.slice(index, index + maxChunkLength).trim();

      if (!content) {
        continue;
      }

      chunks.push({
        personaId: document.personaId,
        tag: inferChunkTag(content),
        content
      });
    }
  }

  return chunks;
}
