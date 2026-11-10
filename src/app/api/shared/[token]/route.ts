import { NextResponse } from "next/server";
import { store } from "@/lib/store";

function redactText(text: string, enableRedact: boolean): string {
  if (!enableRedact) return text;
  return text
    .replace(/\/etc\/cron\.d\/[^\s,.;]+/g, "[REDACTED_INTERNAL_PATH]")
    .replace(/ghp_[a-zA-Z0-9]+/g, "[REDACTED_TOKEN]")
    .replace(/AIza[0-9A-Za-z-_]+/g, "[REDACTED_KEY]");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const link = store.getShareLinkByToken(resolved.token);

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired handover share token." },
        { status: 404 }
      );
    }

    const project = store.getProjectById(link.projectId);
    const handover = store.getHandoverState(link.projectId);
    const rawDocuments = store.getDocuments(link.projectId);
    const rawInsights = store.getInsights(link.projectId).filter((i) => i.status !== "REJECTED");

    const documents = rawDocuments.map((d) => ({
      ...d,
      content: redactText(d.content, link.redactSecrets),
      aiSummary: d.aiSummary ? redactText(d.aiSummary, link.redactSecrets) : undefined,
    }));

    const insights = rawInsights.map((i) => ({
      ...i,
      content: redactText(i.content, link.redactSecrets),
      conflictDetails: i.conflictDetails ? redactText(i.conflictDetails, link.redactSecrets) : undefined,
    }));

    return NextResponse.json({
      success: true,
      shareMeta: link,
      project,
      handover,
      documents,
      insights,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
