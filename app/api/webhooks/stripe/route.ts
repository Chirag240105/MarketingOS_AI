import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return NextResponse.json({ ok: false, error: "Stripe is not configured" }, { status: 503 });

  try {
    const stripe = new Stripe(key);
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as Stripe.Subscription;
      const period = subscription as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
      const workspaceId = subscription.metadata.workspaceId;
      if (workspaceId) {
        const existing = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subscription.id } });
        const statusMap: Record<string, "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "UNPAID" | "PAUSED"> = {
          incomplete: "INCOMPLETE", incomplete_expired: "INCOMPLETE_EXPIRED", trialing: "TRIALING", active: "ACTIVE", past_due: "PAST_DUE", canceled: "CANCELLED", unpaid: "UNPAID", paused: "PAUSED",
        };
        const data = {
          workspaceId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          status: statusMap[subscription.status] || "INCOMPLETE",
          plan: "PRO" as const,
          currentPeriodStart: period.current_period_start ? new Date(period.current_period_start * 1000) : null,
          currentPeriodEnd: period.current_period_end ? new Date(period.current_period_end * 1000) : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
        if (existing) await prisma.subscription.update({ where: { id: existing.id }, data });
        else await prisma.subscription.create({ data });
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Webhook verification failed" }, { status: 400 });
  }
}
