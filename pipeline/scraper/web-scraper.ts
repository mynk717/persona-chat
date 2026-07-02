import type { PersonaSourceDocument } from "@/types/persona";

import type { PersonaSourceSeed } from "./sources.config";

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scrapeWebsite(seed: PersonaSourceSeed): Promise<PersonaSourceDocument> {
  const response = await fetch(seed.url, {
    headers: {
      "User-Agent": "persona-chat-pipeline/0.1"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${seed.url}: ${response.status}`);
  }

  const html = await response.text();
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);

  return {
    personaId: seed.personaId,
    sourceType: "website",
    sourceUrl: seed.url,
    title: titleMatch?.[1]?.trim() || seed.label,
    content: stripHtmlTags(html)
  };
}
