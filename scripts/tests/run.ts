// Minimal test runner: executes every scripts/*.test.ts file as its own
// process (each test file self-reports and exits 0/1), then fails the run if
// any of them failed. Run via `npm test`.

import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = readdirSync(scriptsDir)
  .filter((f) => f.endsWith(".test.ts"))
  .sort();

if (files.length === 0) {
  console.error("No test files found in scripts/");
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  console.log(`\n▶ ${file}`);
  const res = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      path.join(scriptsDir, file),
    ],
    { stdio: "inherit" }
  );
  if (res.status !== 0) failed++;
}

console.log(`\n${failed === 0 ? "ALL TESTS PASSED" : `${failed} FILE(S) FAILED`} (${files.length} test file(s))`);
process.exit(failed === 0 ? 0 : 1);
