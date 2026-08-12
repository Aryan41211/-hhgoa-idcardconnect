// Quick sanity check for the Builder Title rules table.
import { builderTitle } from "../lib/titles.ts";

const cases: [string, string][] = [
  ["Rust / Solidity", "Chaos Engineer, Borrow-Checker Division"],
  ["iOS / Android dev", "Thumb-First Architect, Play Store Wizard"],
  ["AWS / Kubernetes", "Container Shepherd, Blast-Radius Minimizer"],
  ["LLM fine-tuning", "Prompt Deity, Hallucination Patcher"],
  ["Figma + branding", "Visual Provocateur, Gradient Evangelist"],
  ["hardware tinkerer", "Hardware Alchemist, Soldering Hero"],
  ["banana stand", ""], // no keyword → stable fallback
];

let ok = true;
for (const [input, expectKeyword] of cases) {
  const title = builderTitle(input);
  console.log(`  "${input}"  ->  ${title}`);
  if (!expectKeyword) {
    // fallback must be deterministic for the same input
    const again = builderTitle(input);
    if (again !== title) {
      console.error("  ⚠ fallback not deterministic");
      ok = false;
    }
  } else {
    const expected = cases.find((c) => c[0] === input)![1];
    if (title !== expected) {
      console.error(`  ⚠ mismatch: expected "${expected}"`);
      ok = false;
    }
  }
}
console.log(ok ? "TITLES OK" : "TITLES FAILED");
process.exit(ok ? 0 : 1);