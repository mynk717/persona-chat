import type { PersonaSourceDocument } from "@/types/persona";

import type { PersonaSourceSeed } from "./sources.config";

export async function scrapeSocialFeed(seed: PersonaSourceSeed): Promise<PersonaSourceDocument> {
  void seed;

  throw new Error(
    "Social scraping is not implemented yet. Add a compliant public-source collector here."
  );
}
