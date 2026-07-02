import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { GoogleAuth } from "google-auth-library";

import { parseArgs, requireArg } from "./_cli.mjs";

function nowIso() {
  return new Date().toISOString();
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function stripVttMetadata(vttText) {
  return vttText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("WEBVTT"))
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !line.includes("-->"))
    .map(decodeHtmlEntities)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ]
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error("Failed to obtain an access token from ADC credentials.");
  }

  return token;
}

function collectRepeatedArgValues(flagName) {
  const values = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    if (process.argv[index] !== `--${flagName}`) {
      continue;
    }

    const nextValue = process.argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      continue;
    }

    values.push(nextValue);
  }

  return values;
}

async function fetchCaptionTracks(videoId, accessToken) {
  const response = await fetch(
    `https://youtube.googleapis.com/youtube/v3/captions?part=snippet&videoId=${encodeURIComponent(
      videoId
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`captions.list failed for ${videoId}: ${response.status} ${bodyText}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.items) ? payload.items : [];
}

async function downloadCaptionTrack(captionId, accessToken) {
  const response = await fetch(
    `https://youtube.googleapis.com/youtube/v3/captions/${encodeURIComponent(
      captionId
    )}?tfmt=vtt&alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`captions.download failed for ${captionId}: ${response.status} ${bodyText}`);
  }

  return await response.text();
}

const args = parseArgs(process.argv);

if (args.help || args.h) {
  console.log(
    [
      "Usage:",
      "  node scripts/fetch-youtube-captions.mjs \\",
      "    --persona <personaId> \\",
      "    --videoId <youtubeVideoId> [--videoId <youtubeVideoId> ...] \\",
      "    --title <title> \\",
      "    --sourceUrl <url> \\",
      "    [--publishedAt <iso>] \\",
      "    [--sourceType youtube]",
      "",
      "Notes:",
      "- Requires Google ADC auth with youtube.force-ssl scope.",
      "- Pulls caption tracks for the given video IDs and appends text to data/raw/{personaId}.jsonl.",
      "- If a video has no accessible captions, the script exits with an error for that video."
    ].join("\n")
  );
  process.exit(0);
}

const personaId = requireArg(args, "persona");
const title = requireArg(args, "title");
const sourceUrl = requireArg(args, "sourceUrl");
const publishedAt = typeof args.publishedAt === "string" ? args.publishedAt.trim() : undefined;
const sourceType = typeof args.sourceType === "string" ? args.sourceType.trim() : "youtube";

const videoIds = collectRepeatedArgValues("videoId");

if (videoIds.length === 0) {
  throw new Error("Provide at least one --videoId.");
}

const accessToken = await getAccessToken();
const rawDir = path.join(process.cwd(), "data", "raw");
await mkdir(rawDir, { recursive: true });
const rawFile = path.join(rawDir, `${personaId}.jsonl`);

const records = [];

for (const videoId of videoIds) {
  const tracks = await fetchCaptionTracks(videoId, accessToken);
  if (tracks.length === 0) {
    throw new Error(`No captions found for videoId=${videoId}`);
  }

  const track = tracks[0];
  const captionId = track.id;
  if (!captionId) {
    throw new Error(`Caption track missing id for videoId=${videoId}`);
  }

  const vttText = await downloadCaptionTrack(captionId, accessToken);
  const content = stripVttMetadata(vttText);
  if (!content) {
    throw new Error(`Empty transcript after parsing captions for videoId=${videoId}`);
  }

  records.push({
    id: `yt-${personaId}-${videoId}-${Date.now()}`,
    personaId,
    sourceType,
    sourceUrl: `${sourceUrl}?v=${videoId}`,
    title,
    publishedAt,
    ingestedAt: nowIso(),
    videoId,
    captionId,
    content
  });
}

await writeFile(rawFile, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, {
  encoding: "utf-8",
  flag: "a"
});

console.log(`Appended ${records.length} transcript record(s) to ${rawFile}`);
