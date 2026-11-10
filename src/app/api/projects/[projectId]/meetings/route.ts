import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const { projectId } = await params;
    const meetings = store.getMeetings(projectId);
    return NextResponse.json({ success: true, meetings });
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
    const { projectId } = await params;
    const body = await req.json();

    const { title, summary, decisions, actionItems, attendees, duration } = body;

    if (!title || !summary) {
      return NextResponse.json({ success: false, error: "Title and notes summary required" }, { status: 400 });
    }

    // Automatically extract bullet decisions from summary if none explicitly supplied
    const extractedDecisions =
      Array.isArray(decisions) && decisions.length > 0
        ? decisions
        : summary
            .split(/[.\n]/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 15 && /decid|approv|migrat|switch|assign|deploy/i.test(s))
            .slice(0, 3);

    const newMeeting = store.addMeeting({
      projectId,
      title,
      date: "Just now",
      duration: duration || "30 mins",
      attendees:
        Array.isArray(attendees) && attendees.length > 0
          ? attendees
          : ["Alex Chen", "Priya Sharma", "Sarah Connor"],
      summary,
      decisions:
        extractedDecisions.length > 0
          ? extractedDecisions
          : ["Recorded architectural handover sync decision in project knowledge log."],
      actionItems:
        Array.isArray(actionItems) && actionItems.length > 0
          ? actionItems
          : [{ task: `Review notes & follow up on "${title}"`, assignee: "Priya Sharma", done: false }],
    });

    await store.flush();

    return NextResponse.json({ success: true, meeting: newMeeting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await store.ready();
    const body = await req.json();
    const { meetingId, itemIndex } = body;

    if (!meetingId || typeof itemIndex !== "number") {
      return NextResponse.json({ success: false, error: "meetingId and itemIndex required" }, { status: 400 });
    }

    const updated = store.toggleMeetingActionItem(meetingId, itemIndex);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Meeting or task not found" }, { status: 404 });
    }
    await store.flush();

    return NextResponse.json({ success: true, meeting: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
