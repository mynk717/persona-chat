import { readFile } from "node:fs/promises";
import path from "node:path";

const personaIds = ["hitesh-choudhary", "piyush-garg"];
const baseDir = process.cwd();

async function readJson(relativePath) {
  const filePath = path.join(baseDir, relativePath);
  const contents = await readFile(filePath, "utf-8");
  return JSON.parse(contents);
}

function buildChecks(persona, entities, evidence, insights, examples, resources) {
  const entityCount =
    entities.apps.length +
    entities.products.length +
    entities.courses.length +
    entities.brands.length +
    entities.communities.length +
    entities.projects.length +
    entities.companies.length;

  return [
    {
      label: "Identity metadata",
      passed: Boolean(persona.meta.full_name && persona.meta.profession && persona.meta.primary_language),
      detail: `${persona.meta.full_name} / ${persona.meta.profession}`
    },
    {
      label: "Signature phrases",
      passed: persona.voice.signature_phrases.length >= 1,
      detail: `${persona.voice.signature_phrases.length} phrase(s)`
    },
    {
      label: "Named entities coverage",
      passed: entityCount >= 3,
      detail: `${entityCount} entity record(s)`
    },
    {
      label: "Evidence coverage",
      passed: evidence.items.length >= 4,
      detail: `${evidence.items.length} evidence item(s)`
    },
    {
      label: "Insights coverage",
      passed: insights.insights.length >= 4,
      detail: `${insights.insights.length} insight(s)`
    },
    {
      label: "Examples coverage",
      passed: examples.examples.length >= 3,
      detail: `${examples.examples.length} example(s)`
    },
    {
      label: "Resource catalog coverage",
      passed: resources.resources.length >= 3,
      detail: `${resources.resources.length} resource(s)`
    }
  ];
}

for (const personaId of personaIds) {
  const [persona, entities, evidence, insights, examples, resources] = await Promise.all([
    readJson(`personas/${personaId}.json`),
    readJson(`data/entities/${personaId}.json`),
    readJson(`data/evidence/${personaId}.json`),
    readJson(`data/insights/${personaId}.json`),
    readJson(`data/examples/${personaId}.json`),
    readJson(`catalogs/${personaId}.json`)
  ]);

  console.log(`\n${personaId}`);

  for (const check of buildChecks(persona, entities, evidence, insights, examples, resources)) {
    console.log(`- ${check.passed ? "PASS" : "FAIL"}: ${check.label} (${check.detail})`);
  }
}
