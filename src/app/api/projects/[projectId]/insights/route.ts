import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolved = await params;
    const insights = store.getInsights(resolved.projectId);
    return NextResponse.json({ success: true, insights });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { insightId, status } = body;

    if (!insightId || !["NEEDS_REVIEW", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid insightId and status are required" },
        { status: 400 }
      );
    }

    const updated = store.updateInsightStatus(insightId, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Insight not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, insight: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolved = await params;
    const body = await req.json();
    const { title, content, category, severity } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content required" }, { status: 400 });
    }

    const insight = store.addInsight({
      projectId: resolved.projectId,
      title,
      content,
      category: category || "TECHNICAL_DECISION",
      severity: severity || "MEDIUM",
      confidenceScore: 1.0,
      isConflicting: false,
      status: "APPROVED",
      evidence: [
        {
          id: `ev-manual-${Date.now()}`,
          sourceType: "DOCUMENT",
          sourceId: "MANUAL_LEAD_NOTE",
          sourceTitle: "Project Lead Manual Addition",
          relevanceScore: 1.0,
          excerpt: content.slice(0, 140),
        },
      ],
    });

    return NextResponse.json({ success: true, insight });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
