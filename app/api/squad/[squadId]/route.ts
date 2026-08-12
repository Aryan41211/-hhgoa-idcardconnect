import { NextRequest, NextResponse } from "next/server";
import { getSquad, addMember, hasSpace } from "@/lib/squadStore";

// Sanitise a base64 png is small enough to store. Client already downscales.
function sanitizePhoto(b: string): string {
  if (typeof b !== "string" || b.length < 40 || b.length > 4_000_000) return "";
  return b;
}

export async function GET(_: NextRequest, { params }: { params: { squadId: string } }) {
  const id = String(params?.squadId ?? "").replace(/[^a-z0-9]/g, "");
  const squad = await getSquad(id);
  if (!squad) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    id: squad.id,
    team: squad.team,
    members: squad.members.map((m) => ({
      has: !!m,
      name: m?.name,
      photoBase64: m?.photoBase64 ?? null,
      crop: m?.crop ?? null,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { squadId: string } }) {
  const id = String(params?.squadId ?? "").replace(/[^a-z0-9]/g, "");
  const squad = await getSquad(id);
  if (!squad) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!hasSpace(squad)) return NextResponse.json({ error: "squad is full" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const photoBase64 = sanitizePhoto(body?.photoBase64);
  if (!photoBase64) return NextResponse.json({ error: "missing photo" }, { status: 400 });

  const updated = await addMember(id, {
    name: typeof body?.name === "string" ? body.name.slice(0, 24) : undefined,
    photoBase64,
    crop: body?.crop,
  });
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ members: updated.members.length, url: `/squad/${id}` });
}