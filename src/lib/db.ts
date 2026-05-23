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
    CREATE TABLE IF NOT EXISTS history_logs (
      id        SERIAL PRIMARY KEY,
      original_text      TEXT        NOT NULL,
      generated_x_posts  TEXT        NOT NULL,
      generated_linkedin TEXT        NOT NULL,
      duration_ms        INTEGER     NOT NULL,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
