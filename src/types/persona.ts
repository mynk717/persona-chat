export interface PersonaMeta {
  full_name: string;
  profession: string;
  primary_language: string;
  avatar_url: string;
  theme_color: string;
  nationality?: string;
  sources_scraped?: string[];
  last_updated?: string;
}

export interface PersonaVoice {
  tone: string[];
  signature_phrases: string[];
  language_mix?: string;
  forbidden_phrases?: string[];
  speech_patterns: {
    sentence_length: string;
    uses_humor: boolean | string;
    uses_analogies: boolean;
    code_explanation_style?: string;
  };
}

export interface PersonaKnowledge {
  expert: string[];
  familiar?: string[];
  avoid: string[];
}

export interface PersonaContextChunks {
  default: string;
  technical: string;
  career: string;
  motivational: string;
}

export interface Persona {
  id: string;
  meta: PersonaMeta;
  voice: PersonaVoice;
  knowledge_domains: PersonaKnowledge;
  context_chunks: PersonaContextChunks;
  live_connectors?: {
    youtube_channel_id?: string;
    tmdb_person_id?: string;
    wikidata_qid?: string;
  };
  teaching_philosophy?: {
    style: string;
    target_audience: string;
    motivational_triggers: string[];
    common_analogies: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  personaId: string;
  provenance?: ChatProvenance;
}

export interface ChatSession {
  messages: ChatMessage[];
  personaId: string;
  createdAt: string;
}

export interface ChatProvenance {
  intent: "technical" | "career" | "motivational" | "default";
  chips: string[];
}

export interface PersonaSourceDocument {
  personaId: string;
  sourceType: "website" | "youtube" | "social";
  sourceUrl: string;
  title: string;
  content: string;
  publishedAt?: string;
}

export interface ValidatedPersonaInsight {
  label: string;
  evidence: string[];
  confidence: number;
}

export interface PersonaResource {
  id: string;
  title: string;
  type: "youtube_playlist" | "youtube_video" | "course" | "article" | "movie" | "fight";
  url: string;
  description: string;
  tags: string[];
  aliases?: string[];
  intents: Array<"technical" | "career" | "motivational" | "default">;
  priority: number;
}

export interface PersonaResourceCatalog {
  personaId: string;
  resources: PersonaResource[];
}

export interface PersonaEvidenceItem {
  id: string;
  topic: string;
  kind: "fact" | "advice" | "phrase" | "analogy" | "experience";
  claim: string;
  excerpt: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
}

export interface PersonaEvidenceDocument {
  personaId: string;
  items: PersonaEvidenceItem[];
}

export interface PersonaInsight {
  id: string;
  topic: string;
  kind: "teaching_pattern" | "advice_pattern" | "tone_pattern" | "experience_pattern";
  summary: string;
  backedBy: string[];
}

export interface PersonaInsightsDocument {
  personaId: string;
  insights: PersonaInsight[];
}

export interface PersonaExample {
  id: string;
  topic: string;
  intent: "technical" | "career" | "motivational" | "default";
  pattern: string;
  backedBy: string[];
}

export interface PersonaExamplesDocument {
  personaId: string;
  examples: PersonaExample[];
}

export interface PersonaEntity {
  id: string;
  name: string;
  type: "app" | "product" | "course" | "brand" | "community" | "project" | "company";
  aliases: string[];
  description: string;
  url?: string;
  tags: string[];
  importance: number;
}

export interface PersonaEntitiesDocument {
  personaId: string;
  apps: PersonaEntity[];
  products: PersonaEntity[];
  courses: PersonaEntity[];
  brands: PersonaEntity[];
  communities: PersonaEntity[];
  projects: PersonaEntity[];
  companies: PersonaEntity[];
}
