# Persona Completeness Checklist

Use this before treating a persona as production-ready.

## Required coverage

- Identity:
  - full name
  - profession
  - primary language
  - official site or primary public home
- Voice:
  - signature phrases
  - tone
  - explanation style
  - motivational style
- Entities:
  - apps
  - products
  - courses
  - brands
  - any important named public project
- Evidence:
  - source-backed items for facts, advice, analogies, and experience patterns
- Insights:
  - topic-specific distilled patterns
- Examples:
  - reusable explanation patterns for technical, career, and motivational cases
- Resources:
  - recommendation items like playlists, videos, articles, or courses

## Release rule

Do not trust the persona for named-entity questions unless the entity is present in `data/entities` or another grounded runtime layer.

## Audit command

Run:

```bash
npm run audit:personas
```

A passing report does not mean the persona is perfect. It means the minimum required buckets exist so the model is less likely to bluff.
