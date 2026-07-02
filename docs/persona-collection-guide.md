# Persona Collection Guide

## Goal

Build persona files that are reusable across the chat app and future automation pipeline.

## Recommended workflow

1. Collect public sources for a persona.
2. Store raw content per source.
3. Validate tone, recurring phrases, expertise, and avoid-topics across multiple sources.
4. Condense the validated data into `personas/{personaId}.json`.
5. Use the optimized context chunks at runtime in the chat engine.

## Source types

- Official website and blog posts
- YouTube channel pages and transcripts
- Public social posts
- Talks, interviews, and podcasts

## Manual-first rule

For the first version, create the persona JSON manually after reviewing the source material. This gives you a reference target for the later scraper and validator.

## Validation checklist

- Confirm profession, topic expertise, and language style from at least two sources.
- Only include signature phrases that appear consistently in public material.
- Keep avoid-topics explicit so the prompt stays bounded.
- Keep context chunks concise and task-focused.

## Current status

- `personas/_schema.json` defines the reusable contract.
- `personas/hitesh-choudhary.json` and `personas/piyush-garg.json` are the current manual ground truth.
- `pipeline/` now contains the base scraper, validator, and optimizer structure for future automation.
