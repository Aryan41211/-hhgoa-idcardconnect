// Lightweight filesystem-backed store for generated images + metadata.
// Works in `next dev` and on any single-instance Node host (incl. Vercel for
// the hackathon review window). Swapping to Vercel Blob later is a drop-in:
// just replace readImage()/writeResult() with Blob calls.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type ResultMeta = {
  id: string;
  format: "frame" | "card" | "squad";
  name?: string;
  stack?: string;
  title?: string;
  animated?: boolean;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data", "results");

function dirFor(id: string) {
  return path.join(DATA_DIR, id);
}
function pngPath(id: string) {
  return path.join(dirFor(id), "image.png");
}
function metaPath(id: string) {
  return path.join(dirFor(id), "meta.json");
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function readFileSafe(p: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(p);
  } catch {
    return null;
  }
}

/** Persist a generated image (base64 PNG) + metadata. Returns the id. */
export async function saveResult(
  base64: string,
  meta: Omit<ResultMeta, "id" | "createdAt">
): Promise<string> {
  const id = crypto.randomBytes(6).toString("hex");
  const buf = Buffer.from(base64, "base64");
  const folder = dirFor(id);
  await ensureDir(folder);
  await Promise.all([
    fs.writeFile(pngPath(id), buf),
    fs.writeFile(
      metaPath(id),
      JSON.stringify({ ...meta, id, createdAt: new Date().toISOString() })
    ),
  ]);
  return id;
}

export async function loadMeta(id: string): Promise<ResultMeta | null> {
  const buf = await readFileSafe(metaPath(id));
  if (!buf) return null;
  try {
    return JSON.parse(buf.toString()) as ResultMeta;
  } catch {
    return null;
  }
}

export async function loadImage(id: string): Promise<Buffer | null> {
  return readFileSafe(pngPath(id));
}

export async function resultExists(id: string): Promise<boolean> {
  return (await readFileSafe(pngPath(id))) !== null;
}
