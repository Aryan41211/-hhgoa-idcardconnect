import { NextRequest, NextResponse } from "next/server";
import { saveResult } from "@/lib/storage";

const FORMATS = ["frame", "card", "squad", "idcard"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const image = typeof body?.image === "string" ? body.image : "";
    if (!image || image.length < 40) {
      return NextResponse.json({ error: "missing image" }, { status: 400 });
    }
    const format = FORMATS.includes(body?.format) ? body.format : "frame";
    const id = await saveResult(image, {
      format,
      name: typeof body?.name === "string" ? body.name.slice(0, 60) : undefined,
      stack: typeof body?.stack === "string" ? body.stack.slice(0, 80) : undefined,
      title: typeof body?.title === "string" ? body.title.slice(0, 80) : undefined,
    });
    return NextResponse.json({ id, url: `/r/${id}` });
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}