import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getDb,
  initDb,
  getMonthlyUsage,
  getUserPlan,
  upsertUser,
  FREE_LIMIT,
} from "@/lib/db";

function mockAiTransform(text: string): {
  xPosts: string[];
  linkedin: string;
  instagram: string;
  newsletter: string;
  emailSubject: string;
} {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  const words = text.trim().split(/\s+/);
  const topic = words.slice(0, 4).join(" ");

  const s0 = sentences[0] ?? topic;
  const s1 = sentences[1] ?? s0;
  const sMid = sentences[Math.floor(sentences.length / 2)] ?? s0;
  const sLast = sentences[sentences.length - 1] ?? s0;

  const xPosts = [
    `🔥 ${s0}\n\nThis insight changes everything. Full breakdown 🧵👇\n\n#ContentCreator #AI #Growth`,
    `Most people get this completely wrong:\n\n"${sMid}"\n\nAfter testing this for months, here's what actually works:\n→ Focus on depth, not breadth\n→ Consistency beats perfection\n→ Value first, always\n\nBookmark this 📌`,
    `Unpopular opinion: ${sLast}\n\nThe data backs this up entirely.\n\nDisagree? I want to hear why 👇\n\n#HotTake #Productivity #Success`,
  ];

  const linkedin = `Something I keep thinking about:\n\n${s0}\n\nAfter exploring this deeply, three things stand out:\n\n✅ ${s1}\n\n✅ ${sMid}\n\n✅ ${sLast}\n\nThe professionals who win long-term aren't the smartest — they're the most consistent. They show up every single day.\n\nWhat's your take? I'd love different perspectives in the comments.\n\n#ProfessionalDevelopment #ContentStrategy #Growth #Leadership`;

  const instagram = `✨ ${s0}\n\n💡 This one idea can transform how you think about ${topic}.\n\nDouble tap if this resonates ❤️\nSave this for when you need a reminder 📌\n\n.\n.\n.\n#ContentCreator #Mindset #GrowthMindset #Inspiration #Motivation #Success #Entrepreneur #Tips #Knowledge #Wisdom`;

  const newsletter = `Hi there,\n\n${s0} ${s1}\n\n${sMid} This keeps coming back to me the more I sit with it.\n\nThe key takeaway: ${sLast}\n\nI hope this gave you something to think about. Hit reply — I read every response.\n\nUntil next time,`;

  const emailSubject = s0.length <= 60 ? s0 : s0.slice(0, 57) + "...";

  return { xPosts, linkedin, instagram, newsletter, emailSubject };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to generate content." }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide at least 20 characters of text." },
        { status: 400 }
      );
    }

    await initDb();

    const user = await currentUser();
    if (user) await upsertUser(userId, user.emailAddresses[0]?.emailAddress ?? "");

    const plan = await getUserPlan(userId);
    if (plan === "free") {
      const usage = await getMonthlyUsage(userId);
      if (usage >= FREE_LIMIT) {
        return NextResponse.json(
          { error: "FREE_LIMIT_REACHED", usage, limit: FREE_LIMIT },
          { status: 402 }
        );
      }
    }

    const start = Date.now();
    await new Promise((r) => setTimeout(r, 800));
    const { xPosts, linkedin, instagram, newsletter, emailSubject } = mockAiTransform(text);
    const durationMs = Date.now() - start;

    const db = getDb();
    const rows = await db`
      INSERT INTO history_logs (user_id, original_text, generated_x_posts, generated_linkedin, generated_instagram, generated_newsletter, generated_email, duration_ms)
      VALUES (${userId}, ${text.slice(0, 2000)}, ${JSON.stringify(xPosts)}, ${linkedin}, ${instagram}, ${newsletter}, ${emailSubject}, ${durationMs})
      RETURNING id
    ` as { id: number }[];

    const usage = await getMonthlyUsage(userId);
    return NextResponse.json({
      id: rows[0]?.id,
      xPosts,
      linkedin,
      instagram,
      newsletter,
      emailSubject,
      durationMs,
      usage,
      plan,
      limit: FREE_LIMIT,
    });
  } catch (err) {
    console.error("[/api/generate]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Internal server error." }, { status: 500 });
  }
}
