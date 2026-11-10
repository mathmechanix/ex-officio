import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { summarizeDocumentWithGemini } from "@/lib/gemini";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    await store.ready();
    const { documentId } = await params;
    const doc = store.getDocumentById(documentId);

    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const aiSummary = await summarizeDocumentWithGemini(doc.title, doc.content, doc.category);
    store.updateDocumentSummary(documentId, aiSummary);
    await store.flush();

    return NextResponse.json({
      success: true,
      aiSummary,
      documentId,
      message: "Document successfully summarized with Gemini AI.",
    });
  } catch (err: any) {
    console.error("Summarization route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
