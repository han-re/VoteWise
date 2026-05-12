import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface TrackerSessionSummary {
  session_id: string;
  date: string;
  card_summary: string;
  headline_summary: string;
  key_speakers: { name: string; party: string; contribution_count: number }[];
  duration_estimate_minutes: number;
}

const DATA_DIR = path.join(process.cwd(), "..", "data", "mla-tracker", "sessions");

function readSummary(slug: string): TrackerSessionSummary | null {
  try {
    const full = path.join(DATA_DIR, slug, "summary.json");
    return JSON.parse(fs.readFileSync(full, "utf-8")) as TrackerSessionSummary;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sessions = fs
      .readdirSync(DATA_DIR)
      .filter((name) => !name.startsWith("_"))
      .map((slug) => ({ slug, summary: readSummary(slug) }))
      .filter((item): item is { slug: string; summary: TrackerSessionSummary } => Boolean(item.summary))
      .map(({ slug, summary }) => ({
        session_id: slug,
        date: summary.date,
        title: summary.card_summary,
        agenda_summary: summary.headline_summary,
        attendee_count: summary.key_speakers.length,
        speech_count_total: summary.key_speakers.reduce(
          (total, speaker) => total + speaker.contribution_count,
          0
        ),
        source: "tracker" as const,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
