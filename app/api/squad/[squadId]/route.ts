import { NextRequest, NextResponse } from "next/server";
import { getSquad, addMember, updateTeam, hasSpace, type Squad } from "@/lib/squadStore";

// Sanitise a base64 png is small enough to store. Client already downscales.
function sanitizePhoto(b: string): string {
  if (typeof b !== "string" || b.length < 40 || b.length > 4_000_000) return "";
  return b;
}

function cleanString(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\r\n\t]/g, " ").trim().slice(0, max);
  return s || undefined;
}

export async function GET(_: NextRequest, { params }: { params: { squadId: string } }) {
  const id = String(params?.squadId ?? "").replace(/[^a-z0-9]/g, "");
  const squad = await getSquad(id);
  if (!squad) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    id: squad.id,
    team: squad.team,
    teamClass: squad.teamClass ?? null,
    teamTagline: squad.teamTagline ?? null,
    members: squad.members.map((m) => ({
      has: !!m,
      name: m?.name,
      stack: m?.stack ?? null,
      photoBase64: m?.photoBase64 ?? null,
      crop: m?.crop ?? null,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { squadId: string } }) {
  const id = String(params?.squadId ?? "").replace(/[^a-z0-9]/g, "");
  const squad = await getSquad(id);
  if (!squad) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  let updated: Squad | null = null;

  // Team-level fields are always applied (last write wins).
  const teamClass = cleanString(body?.teamClass, 60);
  const teamTagline = cleanString(body?.teamTagline, 60);
  if (teamClass !== undefined || teamTagline !== undefined) {
    updated = await updateTeam(id, { teamClass, teamTagline });
  }

  // Member join — photo is the join credential.
  const photoBase64 = sanitizePhoto(body?.photoBase64);
  if (photoBase64) {
    if (!hasSpace(updated ?? squad)) return NextResponse.json({ error: "squad is full" }, { status: 409 });
    updated = await addMember(id, {
      name: cleanString(body?.name, 24),
      stack: cleanString(body?.stack, 40),
      photoBase64,
      crop: body?.crop,
    });
  } else if (updated === null) {
    return NextResponse.json({ error: "missing photo" }, { status: 400 });
  }

  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ members: updated.members.filter(Boolean).length, url: `/squad/${id}` });
}