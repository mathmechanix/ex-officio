import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const messages = store.getTeamMessages(resolved.projectId);
    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId;
    const body = await req.json();

    const { toMember, toEmail, subject, message, channel, fromUser } = body;
    if (!toMember || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Recipient, subject, and message are required." },
        { status: 400 }
      );
    }

    const saved = store.addTeamMessage({
      projectId,
      toMember,
      toEmail: toEmail || "",
      fromUser: fromUser || "Sarah Connor",
      subject,
      message,
      channel: channel || "IN_APP",
    });
    await store.flush();

    return NextResponse.json({
      success: true,
      teamMessage: saved,
      message: `Handover message dispatched to ${toMember} (${channel || "IN_APP"}).`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
