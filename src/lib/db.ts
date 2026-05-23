import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL!);
  }
  return sql;
}

export async function initDb() {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id                 TEXT        PRIMARY KEY,
      email              TEXT,
      plan               TEXT        NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS history_logs (
      id                   SERIAL      PRIMARY KEY,
      user_id              TEXT        NOT NULL,
      original_text        TEXT        NOT NULL,
      generated_x_posts    TEXT        NOT NULL,
      generated_linkedin   TEXT        NOT NULL,
      generated_instagram  TEXT        NOT NULL DEFAULT '',
      generated_newsletter TEXT        NOT NULL DEFAULT '',
      generated_email      TEXT        NOT NULL DEFAULT '',
      is_favorited         BOOLEAN     NOT NULL DEFAULT FALSE,
      duration_ms          INTEGER     NOT NULL,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Migrate existing tables — wrapped individually so one failure doesn't block the rest
  const migrations = [
    db`ALTER TABLE history_logs ADD COLUMN IF NOT EXISTS generated_instagram TEXT NOT NULL DEFAULT ''`,
    db`ALTER TABLE history_logs ADD COLUMN IF NOT EXISTS generated_newsletter TEXT NOT NULL DEFAULT ''`,
    db`ALTER TABLE history_logs ADD COLUMN IF NOT EXISTS generated_email TEXT NOT NULL DEFAULT ''`,
    db`ALTER TABLE history_logs ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN NOT NULL DEFAULT FALSE`,
  ];
  for (const m of migrations) {
    await m.catch((e) => console.warn("[initDb migration]", e?.message));
  }
}

export const FREE_LIMIT = 10;

export async function getMonthlyUsage(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db`
    SELECT COUNT(*) AS cnt FROM history_logs
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', NOW())
  ` as { cnt: string }[];
  return Number(rows[0]?.cnt ?? 0);
}

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const db = getDb();
  const rows = await db`SELECT plan FROM users WHERE id = ${userId}` as { plan: string }[];
  return (rows[0]?.plan as "free" | "pro") ?? "free";
}

export async function upsertUser(userId: string, email: string): Promise<void> {
  const db = getDb();
  await db`
    INSERT INTO users (id, email) VALUES (${userId}, ${email})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  `;
}

export async function toggleFavorite(id: number, userId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db`
    UPDATE history_logs
    SET is_favorited = NOT is_favorited
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING is_favorited
  ` as { is_favorited: boolean }[];
  return rows[0]?.is_favorited ?? false;
}
