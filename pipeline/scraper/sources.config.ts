export type SupportedSourceType = "website" | "youtube" | "social";

export interface PersonaSourceSeed {
  personaId: string;
  type: SupportedSourceType;
  url: string;
  label: string;
}

export const personaSources: Record<string, PersonaSourceSeed[]> = {
  "hitesh-choudhary": [
    {
      personaId: "hitesh-choudhary",
      type: "website",
      url: "https://hitesh.ai/",
      label: "Official website"
    },
    {
      personaId: "hitesh-choudhary",
      type: "youtube",
      url: "https://www.youtube.com/@HiteshChoudharydotcom",
      label: "YouTube channel"
    }
  ],
  "piyush-garg": [
    {
      personaId: "piyush-garg",
      type: "website",
      url: "https://www.piyushgarg.dev/",
      label: "Official website"
    },
    {
      personaId: "piyush-garg",
      type: "youtube",
      url: "https://www.youtube.com/@PiyushGargDev",
      label: "YouTube channel"
    }
  ]
};
