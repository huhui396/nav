export const runtime = 'edge';
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await initDb();
    const db = getDb();
    const rows = await db`
      SELECT id, original_text, generated_x_posts, generated_linkedin,
             generated_instagram, generated_newsletter, generated_email,
             is_favorited, duration_ms, created_at::text AS created_at
      FROM history_logs
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 30
    `;
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[/api/history]", err);
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
  }
}
