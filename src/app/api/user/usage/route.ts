export const runtime = 'edge';
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { initDb, getMonthlyUsage, getUserPlan, FREE_LIMIT } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDb();
  const [usage, plan] = await Promise.all([
    getMonthlyUsage(userId),
    getUserPlan(userId),
  ]);
  return NextResponse.json({ usage, plan, limit: FREE_LIMIT });
}
