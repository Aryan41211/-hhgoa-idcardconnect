// Filesystem-backed collaborative squad state (no auth — the link is the
// credential, fine for the hackathon review window).

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type SquadMember = { name?: string; stack?: string; photoBase64?: string; crop?: { x: number; y: number; width: number; height: number } | null };
export type Squad = {
  id: string;
  members: (SquadMember | undefined)[];
  team?: string;
  teamClass?: string;
  teamTagline?: string;
  createdAt: string;
};

const MAX_SLOTS = 3;
const DIR = path.join(process.cwd(), ".data", "squads");

function file(id: string) {
  return path.join(DIR, `${id}.json`);
}

export async function createSquad(team?: string, teamClass?: string, teamTagline?: string): Promise<Squad> {
  const id = crypto.randomBytes(5).toString("hex");
  const squad: Squad = { id, members: new Array(MAX_SLOTS).fill(undefined), team, teamClass, teamTagline, createdAt: new Date().toISOString() };
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(id), JSON.stringify(squad));
  return squad;
}

export async function getSquad(id: string): Promise<Squad | null> {
  try {
    const raw = await fs.readFile(file(id), "utf8");
    return JSON.parse(raw) as Squad;
  } catch {
    return null;
  }
}

export async function addMember(id: string, member: SquadMember): Promise<Squad | null> {
  const squad = await getSquad(id);
  if (!squad) return null;
  const idx = squad.members.findIndex((m) => !m);
  if (idx === -1) return squad; // full
  squad.members[idx] = { name: member.name, stack: member.stack, photoBase64: member.photoBase64, crop: member.crop };
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(id), JSON.stringify(squad));
  return squad;
}

export async function updateTeam(
  id: string,
  fields: { teamClass?: string; teamTagline?: string }
): Promise<Squad | null> {
  const squad = await getSquad(id);
  if (!squad) return null;
  if (typeof fields.teamClass === "string") squad.teamClass = fields.teamClass; // last write wins
  if (typeof fields.teamTagline === "string") squad.teamTagline = fields.teamTagline;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(id), JSON.stringify(squad));
  return squad;
}

export function hasSpace(squad: Squad): boolean {
  return squad.members.some((m) => !m);
}
