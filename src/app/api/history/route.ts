import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/turso";

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    const result = await db.execute(
      `SELECT id, original_text, generated_x_posts, generated_linkedin, duration_ms, created_at
       FROM history_logs ORDER BY id DESC LIMIT 20`
    );
    return NextResponse.json({ rows: result.rows });
  } catch (err) {
    console.error("[/api/history]", err);
    return NextResponse.json(
      { error: "Failed to fetch history." },
      { status: 500 }
    );
  }
}
