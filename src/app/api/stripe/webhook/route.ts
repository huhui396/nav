export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb, initDb } from "@/lib/db";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const customerId = session.customer as string;
    if (userId) {
      await db`
        UPDATE users SET plan = 'pro', stripe_customer_id = ${customerId}
        WHERE id = ${userId}
      `;
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await db`UPDATE users SET plan = 'free' WHERE stripe_customer_id = ${customerId}`;
  }

  return NextResponse.json({ received: true });
}
