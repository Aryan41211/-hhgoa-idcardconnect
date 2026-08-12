import { NextRequest, NextResponse } from "next/server";
import { createSquad } from "@/lib/squadStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const squad = await createSquad(typeof body?.team === "string" ? body.team.slice(0, 60) : undefined);
    return NextResponse.json({ id: squad.id, url: `/squad/${squad.id}` });
  } catch {
    return NextResponse.json({ error: "failed to create squad" }, { status: 500 });
  }
}