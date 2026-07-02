# Raw Ingestion (Offline)

This app keeps chat fast by never scraping during a user message. Instead, you ingest raw source text offline and convert it into grounded runtime data.

## Raw format

- Stored as JSONL: `data/raw/{personaId}.jsonl`
- Each line is a JSON object with source metadata and a `content` field.

## Ingest text/transcripts

Example:

```bash
npm run ingest:raw -- \
  --persona hitesh-choudhary \
  --sourceType youtube \
  --sourceUrl "https://www.youtube.com/watch?v=VIDEO_ID" \
  --title "Video Title" \
  --file /path/to/transcript.txt
```

Notes:
- The script chunks large files into multiple JSONL records to keep items manageable for later extraction.
- This does not change runtime persona behavior until you run candidate extraction and manually promote the candidates.

## Fetch YouTube captions with Google ADC

If you have already completed Google OAuth with the YouTube scope, you can fetch caption text directly into `data/raw`:

```bash
npm run fetch:youtube -- \
  --persona hitesh-choudhary \
  --videoId VIDEO_ID_1 \
  --videoId VIDEO_ID_2 \
  --title "Video Title" \
  --sourceUrl "https://www.youtube.com/watch" \
  --publishedAt "2026-07-02T00:00:00Z"
```

Notes:
- This uses the Google Application Default Credentials file in `~/.config/gcloud/application_default_credentials.json`.
- The auth grant must include `youtube.force-ssl` or the caption fetch will fail.
- The command is meant for your selected training set, not every video on the channel.

## Extract candidates (review step)

```bash
npm run extract:candidates -- --persona hitesh-choudhary
```

Output:
- `data/candidates/{personaId}.json`

This file is meant for manual review. You decide what to merge into:
- `data/entities/*`
- `data/evidence/*`
- `data/insights/*`
- `data/examples/*`
- `catalogs/*`
