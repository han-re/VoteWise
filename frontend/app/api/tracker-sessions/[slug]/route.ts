import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATA_DIR = path.join(process.cwd(), "..", "data", "mla-tracker", "sessions");

function readJson<T>(slug: string, filename: string): T | null {
  try {
    const full = path.join(DATA_DIR, slug, filename);
    return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const summary = readJson(slug, "summary.json");

  if (!summary) {
    return NextResponse.json({ detail: "Tracker session not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug,
    summary,
    metadata: readJson(slug, "metadata.json"),
  });
}
