import type { PersonaSourceDocument } from "@/types/persona";

import type { PersonaSourceSeed } from "./sources.config";

export async function scrapeYouTubeChannel(
  seed: PersonaSourceSeed
): Promise<PersonaSourceDocument> {
  void seed;

  throw new Error(
    "YouTube scraping is not implemented yet. Add YouTube Data API and transcript ingestion here."
  );
}
