import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: Request) {
  try {
    await store.ready();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const notifications = store.getNotifications(projectId);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await store.ready();
    const body = await req.json().catch(() => ({}));
    const updated = store.markNotificationRead(body.id);
    await store.flush();
    const unreadCount = updated.filter((n) => !n.read).length;

    return NextResponse.json({ success: true, notifications: updated, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
