import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId;
    const body = await req.json().catch(() => ({}));

    const status = body.status === "IN_REVIEW" ? "IN_REVIEW" : "PUBLISHED";
    const publishedBy = body.publishedBy || "Sarah Connor";
    const leadNotes = body.leadNotes;

    const handover = store.publishHandover(projectId, publishedBy, status, leadNotes);
    await store.flush();

    return NextResponse.json({
      success: true,
      handover,
      message:
        status === "PUBLISHED"
          ? "Handover dossier approved, signed, and published to incoming team members."
          : "Handover dossier reopened for lead editing.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId;
    const body = await req.json();

    if (!body.stepId) {
      return NextResponse.json({ success: false, error: "stepId is required" }, { status: 400 });
    }

    const handover = store.toggleTransitionStep(projectId, body.stepId);
    await store.flush();
    return NextResponse.json({ success: true, handover });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
