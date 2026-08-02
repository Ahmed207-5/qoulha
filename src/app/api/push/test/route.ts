import { NextResponse } from "next/server";
import { sendPushForNotification, type NotificationRow } from "@/lib/push-notifications";

/**
 * Called by a Supabase Database Webhook (see
 * supabase/migrations/0030_push_notifications_webhook.sql) immediately
 * after any row is inserted into public.notifications — which is every
 * single notification-creating event in the app (new message, reply,
 * comment, reaction, repost, follow, mention, daily space, admin
 * broadcast, moderation), since all of them funnel into that one table.
 *
 * Payload shape is Supabase's standard Database Webhook body:
 * { type: "INSERT" | "UPDATE" | "DELETE", table, schema, record, old_record }
 */
export async function POST(req: Request) {
  const expectedSecret = process.env.PUSH_WEBHOOK_SECRET;

  // If a secret is configured, require it — this endpoint is public on
  // the internet (Supabase calls it over plain HTTPS, not from inside
  // your app), so anyone who finds the URL could otherwise trigger
  // arbitrary push sends.
  if (expectedSecret) {
    const providedSecret = req.headers.get("x-webhook-secret");
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { type?: string; table?: string; record?: NotificationRow };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Ignore anything that isn't a fresh notification row — defensive in
  // case this webhook URL is ever reused for other tables/events later.
  if (body.type !== "INSERT" || body.table !== "notifications" || !body.record) {
    return NextResponse.json({ success: true, skipped: true });
  }

  // Push delivery must never block or fail the request that created the
  // notification — sendPushForNotification() already catches its own
  // errors internally, so this only responds once it's actually done.
  await sendPushForNotification(body.record);

  return NextResponse.json({ success: true });
}
