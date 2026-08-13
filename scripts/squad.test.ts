// Store-level sanity check for the 3-slot squad model: create -> add 3 ->
// 4th rejected -> team class/tagline + per-member stack persist.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { createSquad, getSquad, addMember, updateTeam, hasSpace } from "../lib/squadStore.ts";

const id = `test-${crypto.randomBytes(3).toString("hex")}`;
const DIR = path.join(process.cwd(), ".data", "squads");

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`  ⚠ ${msg}`);
    process.exit(1);
  }
}

async function main() {
  const squad = await createSquad("Crew", "SQUAD 26", "BUILD · SHIP · REPEAT");
  assert(squad.members.length === 3, `expected 3 slots, got ${squad.members.length}`);

  let s = await getSquad(squad.id);
  assert(s?.teamClass === "SQUAD 26", "teamClass not persisted");
  assert(s?.teamTagline === "BUILD · SHIP · REPEAT", "teamTagline not persisted");
  assert(hasSpace(s!), "fresh squad should have space");

  // fill all 3 slots with stack
  const fills = [
    { name: "Ada", stack: "react · node" },
    { name: "Grace", stack: "rust · go" },
    { name: "Linus", stack: "linux · c" },
  ];
  for (const f of fills) {
    s = await addMember(squad.id, { name: f.name, stack: f.stack, photoBase64: "data:image/jpeg;base64,AAAA", crop: null });
    assert(!!s, "addMember returned null");
  }
  s = await getSquad(squad.id);
  assert(s!.members.filter(Boolean).length === 3, "expected 3 filled members");
  assert(s!.members[0]!.stack === "react · node", "member stack not persisted");
  assert(!hasSpace(s!), "full squad should not have space");

  // 4th member must be rejected (no new slot, no crash)
  const before = JSON.stringify(s);
  const rejected = await addMember(squad.id, { name: "Fourth", photoBase64: "data:image/jpeg;base64,BBBB" });
  const after = JSON.stringify(rejected);
  assert(after === before, "4th member should have been rejected");
  assert(rejected!.members.filter(Boolean).length === 3, "slot count changed after rejection");

  // team fields: last write wins + persist
  const updated = await updateTeam(squad.id, { teamClass: "SQUAD 27" });
  assert(updated?.teamClass === "SQUAD 27", "teamClass update failed");
  assert(updated?.teamTagline === "BUILD · SHIP · REPEAT", "teamTagline clobbered by partial update");
  const reloaded = await getSquad(squad.id);
  assert(reloaded?.teamClass === "SQUAD 27", "teamClass not persisted across reload");

  console.log("  squad: create → 3 slots → 4th rejected → team/stack persist → OK");
  await fs.rm(path.join(DIR, `${squad.id}.json`), { force: true });
  await fs.rm(path.join(DIR, `${id}.json`), { force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
