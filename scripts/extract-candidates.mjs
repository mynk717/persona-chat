import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import OpenAI from "openai";

import { parseArgs, requireArg } from "./_cli.mjs";

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function readJsonl(contents) {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(safeJsonParse)
    .filter((value) => value && typeof value === "object");
}

function heuristicCandidates(personaId, records) {
  const joined = records.map((r) => String(r.content ?? "")).join("\n");
  const lower = joined.toLowerCase();

  const entities = [];
  const evidence = [];
  const insights = [];
  const examples = [];
  const patterns = [];

  const addEntity = (name) => {
    const normalized = name.toLowerCase();
    if (entities.some((e) => e.name.toLowerCase() === normalized)) {
      return;
    }
    entities.push({
      id: `cand-ent-${normalized.replace(/[^\w]+/g, "-")}`,
      name,
      type: "product",
      aliases: [name],
      description: "Candidate entity inferred from raw text. Verify and edit before promoting.",
      tags: [],
      importance: 5
    });
  };

  const addEvidence = (topic, kind, claim, matchTerm, confidence = 0.7) => {
    const index = lower.indexOf(matchTerm.toLowerCase());
    const excerpt = index >= 0 ? joined.slice(Math.max(0, index - 120), Math.min(joined.length, index + 240)).trim() : claim;
    evidence.push({
      id: `cand-ev-${topic.replace(/[^\w]+/g, "-")}`,
      topic,
      kind,
      claim,
      excerpt,
      sourceUrl: records[0]?.sourceUrl ?? "",
      sourceTitle: records[0]?.title ?? "",
      confidence
    });
  };

  const entityNames = [
    "DDIA",
    "System Design",
    "Trade-offs",
    "Postgres",
    "MongoDB",
    "Redis",
    "Caching",
    "Indexing",
    "OLTP",
    "OLAP",
    "Data Warehouse",
    "Data Lake",
    "ETL",
    "Distributed Systems",
    "IRCTC",
    "Swiggy",
    "Zomato",
    "Zerodha",
    "Cloud",
    "Self-hosting",
    "GDPR",
    "HIPAA",
    "SOC 2",
    "DPDP",
    "AI Agents",
    "GenAI Cohort",
    "JavaScript for Beginners Playlist"
  ];

  for (const name of entityNames) {
    if (lower.includes(name.toLowerCase())) {
      addEntity(name);
    }
  }

  if (lower.includes("trade-offs") || lower.includes("trade offs")) {
    addEvidence(
      "tradeoffs",
      "advice",
      "System design is about trade-offs, not perfect solutions.",
      "trade-off"
    );
    insights.push({
      id: "cand-ins-tradeoffs",
      topic: "system design",
      kind: "teaching_pattern",
      summary: "Frames architecture decisions as explicit trade-offs instead of absolute best practices.",
      backedBy: ["cand-ev-tradeoffs"]
    });
  }

  if (lower.includes("data intensive")) {
    addEvidence(
      "data-intensity",
      "fact",
      "Modern applications become hard when data scale grows faster than a single machine can handle.",
      "data intensive"
    );
    insights.push({
      id: "cand-ins-data-intensity",
      topic: "scaling",
      kind: "experience_pattern",
      summary: "Explains scaling problems through data volume, storage, and access rather than pure compute.",
      backedBy: ["cand-ev-data-intensity"]
    });
  }

  if (lower.includes("oltp")) {
    addEvidence(
      "oltp",
      "fact",
      "OLTP is for fast transactional operations like signups, logins, and small writes.",
      "oltp"
    );
  }

  if (lower.includes("olap")) {
    addEvidence(
      "olap",
      "fact",
      "OLAP is for slower analytical reporting over historical data.",
      "olap"
    );
  }

  if (lower.includes("data warehouse")) {
    addEvidence(
      "data-warehouse",
      "fact",
      "A data warehouse stores cleaned, structured data for reporting and analytics.",
      "data warehouse"
    );
  }

  if (lower.includes("data lake")) {
    addEvidence(
      "data-lake",
      "fact",
      "A data lake stores raw, mixed-format data for downstream processing.",
      "data lake"
    );
  }

  if (lower.includes("cache")) {
    addEvidence(
      "caching",
      "advice",
      "Caching is a general performance layer and is not limited to Redis.",
      "cache"
    );
  }

  if (lower.includes("ai agent") || lower.includes("genai")) {
    addEvidence(
      "aiagents",
      "advice",
      "AI agents are treated as a separate field, and the learner should first master programming basics before moving into GenAI work.",
      "ai agent"
    );
    insights.push({
      id: "cand-ins-aiagents",
      topic: "aiagents",
      kind: "advice_pattern",
      summary: "Recommends fundamentals first for AI-agent questions, then guides the learner toward the GenAI path.",
      backedBy: ["cand-ev-aiagents"]
    });
  }

  if (lower.includes("javascript for beginners playlist")) {
    addEvidence(
      "javascript-playlist",
      "phrase",
      "He explicitly recommends the JavaScript for Beginners Playlist to users starting from scratch.",
      "javascript for beginners playlist"
    );
  }

  if (lower.includes("index")) {
    addEvidence(
      "indexing",
      "analogy",
      "Indexes improve reads and searches, but make writes and updates slower.",
      "index"
    );
  }

  patterns.push(
    {
      id: "cand-pattern-wrong-foundation",
      scenario: "wrong_foundation",
      style: "corrective",
      pattern: "Pushes back on oversimplified answers and re-centers the discussion on trade-offs and fundamentals.",
      backedBy: ["cand-ev-tradeoffs"]
    },
    {
      id: "cand-pattern-request-roadmap",
      scenario: "request_roadmap",
      style: "structured",
      pattern: "Explains concepts as a sequence: what the data is, where it comes from, how it is stored, and how it scales.",
      backedBy: ["cand-ev-data-intensity"]
    },
    {
      id: "cand-pattern-need-motivation",
      scenario: "need_motivation",
      style: "warm-direct",
      pattern: "Uses chai, real-world examples, and practical framing to keep the learner engaged without sugarcoating the difficulty.",
      backedBy: []
    },
    {
      id: "cand-pattern-entity-question",
      scenario: "entity_question",
      style: "reference-driven",
      pattern: "Anchors answers in named products, systems, or companies instead of abstract theory alone.",
      backedBy: []
    }
  );

  examples.push(
    {
      id: "cand-ex-technical-code-first",
      topic: "technical",
      intent: "technical",
      pattern: "Give practical, code-first or system-first explanations with concrete examples from the stack.",
      backedBy: []
    },
    {
      id: "cand-ex-career-projects",
      topic: "career",
      intent: "career",
      pattern: "Focus on consistency, real projects, and the ecosystem rather than certificates alone.",
      backedBy: []
    },
    {
      id: "cand-ex-motivational-chai",
      topic: "motivational",
      intent: "motivational",
      pattern: "Use chai metaphors and a calm but direct tone when a learner is stuck.",
      backedBy: []
    },
    {
      id: "cand-ex-aiagents-fundamentals-first",
      topic: "aiagents",
      intent: "technical",
      pattern: "If the user asks about AI agents or GenAI, say it is a separate field, recommend basics first, and then point them toward the AI-learning path without overpromising.",
      backedBy: ["cand-ev-aiagents"]
    }
  );

  // Very light heuristics to surface common terms; meant only as a backstop.
  if (personaId === "hitesh-choudhary" && lower.includes("masterji")) {
    addEntity("Masterji");
  }
  if (personaId === "piyush-garg" && lower.includes("teachyst")) {
    addEntity("Teachyst");
  }

  return {
    entityCandidates: entities,
    evidenceCandidates: evidence,
    insightCandidates: insights,
    exampleCandidates: examples,
    conversationPatternCandidates: patterns
  };
}

async function openaiCandidates(openai, personaId, records) {
  const payload = records.slice(0, 12).map((record) => ({
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    title: record.title,
    publishedAt: record.publishedAt,
    content: String(record.content ?? "").slice(0, 6000)
  }));

  const system = [
    "You extract persona-grounding candidates from raw public content.",
    "Return STRICT JSON only. No markdown, no commentary.",
    "Do not invent URLs, products, or quotes.",
    "Prefer extracting reusable patterns (banter/sarcasm + helpful correction) with evidence pointers.",
    "",
    "JSON shape:",
    "{",
    '  "entityCandidates": [{ "id": "...", "name": "...", "type": "app|product|course|brand|community|project|company", "aliases": ["..."], "description": "...", "url": "optional", "tags": ["..."], "importance": 1-10 }],',
    '  "evidenceCandidates": [{ "id": "...", "topic": "...", "kind": "fact|advice|phrase|analogy|experience", "claim": "...", "excerpt": "...", "sourceUrl": "...", "sourceTitle": "...", "confidence": 0-1 }],',
    '  "insightCandidates": [{ "id": "...", "topic": "...", "kind": "teaching_pattern|advice_pattern|tone_pattern|experience_pattern", "summary": "...", "backedBy": ["evidenceId"] }],',
    '  "exampleCandidates": [{ "id": "...", "topic": "...", "intent": "technical|career|motivational|default", "pattern": "...", "backedBy": ["evidenceId"] }],',
    '  "conversationPatternCandidates": [{ "id": "...", "scenario": "wrong_foundation|shortcut_seeking|beginner_confusion|request_roadmap|need_motivation|entity_question", "style": "...", "pattern": "...", "backedBy": ["evidenceId"] }]',
    "}",
    "",
    `personaId: ${personaId}`
  ].join("\n");

  const user = [
    "Raw records:",
    JSON.stringify(payload)
  ].join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  const content = response.choices[0]?.message?.content ?? "";
  const trimmed = content.trim();
  const parsed = JSON.parse(trimmed);

  return parsed;
}

const args = parseArgs(process.argv);

if (args.help || args.h) {
  console.log(
    [
      "Usage:",
      "  node scripts/extract-candidates.mjs --persona <personaId> [--mode openai|heuristic]",
      "",
      "Notes:",
      "- --mode openai uses OPENAI_API_KEY and extracts structured candidates.",
      "- Output is written to data/candidates/{personaId}.json (manual review; not auto-promoted).",
      "",
      "Example:",
      "  npm run extract:candidates -- --persona hitesh-choudhary --mode openai"
    ].join("\n")
  );
  process.exit(0);
}

const personaId = requireArg(args, "persona");
const mode = String(args.mode ?? "openai").toLowerCase();

const rawFile = path.join(process.cwd(), "data", "raw", `${personaId}.jsonl`);
const rawContents = await readFile(rawFile, "utf-8").catch(() => "");

if (!rawContents.trim()) {
  throw new Error(`No raw records found at ${rawFile}. Ingest first via npm run ingest:raw.`);
}

const records = readJsonl(rawContents).filter((record) => record.personaId === personaId);

if (records.length === 0) {
  throw new Error(`No records for personaId=${personaId} in ${rawFile}`);
}

let extracted;
let extractor = "heuristic";

if (mode === "openai") {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for --mode openai");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  extracted = await openaiCandidates(openai, personaId, records);
  extractor = "openai";
} else if (mode === "heuristic") {
  extracted = heuristicCandidates(personaId, records);
  extractor = "heuristic";
} else {
  throw new Error("--mode must be openai or heuristic");
}

const outputDir = path.join(process.cwd(), "data", "candidates");
await mkdir(outputDir, { recursive: true });

const outputPath = path.join(outputDir, `${personaId}.json`);

const document = {
  personaId,
  generatedAt: nowIso(),
  extractor,
  rawSource: {
    file: rawFile,
    recordCount: records.length
  },
  ...extracted
};

await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8");

console.log(`Wrote candidates to ${outputPath}`);
