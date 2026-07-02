import { readFile, mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

import { asOptionalString, parseArgs, requireArg } from "./_cli.mjs";

function chunkText(text, maxChars) {
  const chunks = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextCursor = Math.min(text.length, cursor + maxChars);
    const slice = text.slice(cursor, nextCursor).trim();
    if (slice) {
      chunks.push(slice);
    }
    cursor = nextCursor;
  }

  return chunks;
}

function nowIso() {
  return new Date().toISOString();
}

const args = parseArgs(process.argv);

if (args.help || args.h) {
  console.log(
    [
      "Usage:",
      "  node scripts/ingest-raw.mjs \\",
      "    --persona <personaId> \\",
      "    --sourceType <youtube|website|social> \\",
      "    --sourceUrl <url> \\",
      "    --title <title> \\",
      "    --file <path-to-text> \\",
      "    [--publishedAt <iso>] \\",
      "    [--maxChunkChars <number>]",
      "",
      "Example:",
      "  npm run ingest:raw -- --persona hitesh-choudhary --sourceType youtube --sourceUrl \"https://www.youtube.com/watch?v=...\" --title \"...\" --file /tmp/transcript.txt"
    ].join("\n")
  );
  process.exit(0);
}

const personaId = requireArg(args, "persona");
const sourceType = requireArg(args, "sourceType");
const sourceUrl = requireArg(args, "sourceUrl");
const title = requireArg(args, "title");
const filePath = requireArg(args, "file");
const publishedAt = asOptionalString(args.publishedAt);

const maxChunkChars = Number(args.maxChunkChars ?? 2600);
if (!Number.isFinite(maxChunkChars) || maxChunkChars < 400) {
  throw new Error("--maxChunkChars must be a number >= 400");
}

const rawDir = path.join(process.cwd(), "data", "raw");
await mkdir(rawDir, { recursive: true });

const rawFile = path.join(rawDir, `${personaId}.jsonl`);

const text = await readFile(filePath, "utf-8");
const chunks = chunkText(text, maxChunkChars);

const batchId = `raw-${personaId}-${Date.now()}`;
const lines = chunks.map((content, index) => {
  const record = {
    id: `${batchId}-${String(index + 1).padStart(3, "0")}`,
    personaId,
    sourceType,
    sourceUrl,
    title,
    publishedAt,
    ingestedAt: nowIso(),
    content
  };

  return `${JSON.stringify(record)}\n`;
});

await appendFile(rawFile, lines.join(""), "utf-8");

console.log(`Appended ${chunks.length} record(s) to ${rawFile}`);
