import { NextRequest, NextResponse } from "next/server";
import { loadImage } from "@/lib/storage";

export async function GET(_: NextRequest, { params }: { params: { resultId: string } }) {
  const id = String(params?.resultId ?? "").replace(/[^a-f0-9]/g, "");
  if (id.length < 6) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const buf = await loadImage(id);
  if (!buf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}