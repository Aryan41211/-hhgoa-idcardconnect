import { NextRequest, NextResponse } from "next/server";
import { createSquad } from "@/lib/squadStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clean = (v: unknown, max: number) =>
      typeof v === "string" ? v.replace(/[\r\n\t]/g, " ").trim().slice(0, max) || undefined : undefined;
    const squad = await createSquad(
      clean(body?.team, 60),
      clean(body?.teamClass, 60),
      clean(body?.teamTagline, 60)
    );
    return NextResponse.json({ id: squad.id, url: `/squad/${squad.id}` });
  } catch {
    return NextResponse.json({ error: "failed to create squad" }, { status: 500 });
  }
}