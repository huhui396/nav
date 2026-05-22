import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

function mockAiTransform(text: string): {
  xPosts: string[];
  linkedin: string;
} {
  const words = text.trim().split(/\s+/);
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const topics = words.slice(0, 5).join(" ");
  const firstSentence = sentences[0] ?? topics;
  const midSentence = sentences[Math.floor(sentences.length / 2)] ?? topics;
  const lastSentence = sentences[sentences.length - 1] ?? topics;

  const xPosts = [
    `🔥 ${firstSentence}\n\nThis is the insight everyone needs right now. Thread below 👇\n\n#AI #ContentCreator #Viral`,
    `💡 Hot take: "${midSentence}"\n\nMost people overlook this. Here's why it matters:\n→ Saves time\n→ Scales impact\n→ Changes everything\n\nRetweet if you agree 🚀`,
    `The secret nobody talks about:\n\n"${lastSentence}"\n\nI've been in this space for years and this is the #1 lesson.\n\nSave this for later. ✅\n\n#Productivity #Growth`,
  ];

  const linkedin = `I want to share something that changed how I think about content creation.

${firstSentence}

After spending considerable time analyzing this, here are my three key takeaways:

1️⃣ **Context is everything.** ${sentences[1] ?? firstSentence} Understanding the nuance here separates average results from exceptional ones.

2️⃣ **Consistency beats perfection.** The professionals who win long-term aren't necessarily the most talented — they're the most consistent.

3️⃣ **${midSentence}** This one insight alone is worth more than most courses you'll ever buy.

The bottom line? ${lastSentence}

If this resonated with you, I'd love to hear your perspective in the comments. What's the biggest lesson you've learned about content strategy?

#ContentMarketing #LinkedInGrowth #PersonalBrand #Entrepreneurship`;

  return { xPosts, linkedin };
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide at least 20 characters of text." },
        { status: 400 }
      );
    }

    const start = Date.now();
    await new Promise((r) => setTimeout(r, 800));
    const { xPosts, linkedin } = mockAiTransform(text);
    const durationMs = Date.now() - start;

    await initDb();
    const db = getDb();
    await db`
      INSERT INTO history_logs (original_text, generated_x_posts, generated_linkedin, duration_ms)
      VALUES (${text.slice(0, 2000)}, ${JSON.stringify(xPosts)}, ${linkedin}, ${durationMs})
    `;

    return NextResponse.json({ xPosts, linkedin, durationMs });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Internal server error. Check your DATABASE_URL env var." },
      { status: 500 }
    );
  }
}
