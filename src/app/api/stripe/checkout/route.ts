import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json().catch(() => ({ plan: "monthly" }));
  const priceId = plan === "yearly"
    ? (process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_1Ta76hL9Kw61s9iON7YvbfxJ")
    : (process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_1Ta6qvL9Kw61s9iOnUeUfm38");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://magical-queijadas-5ef229.netlify.app";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId },
    });
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
