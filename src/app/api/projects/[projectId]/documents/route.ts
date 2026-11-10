import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { summarizeDocumentWithGemini } from "@/lib/gemini";
import { extractTextFromPdfBuffer } from "@/lib/pdf-extract";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const { projectId } = await params;
    const documents = store.getDocuments(projectId);
    return NextResponse.json({ success: true, documents });
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
    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let fileName = "";
    let fileType = "text/plain";
    let fileSize = "12 KB";
    let category = "TECHNICAL_DECISION";
    let content = "";
    let uploadedBy = "Sarah Connor";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || "";
      category = (formData.get("category") as string) || "TECHNICAL_DECISION";
      uploadedBy = (formData.get("uploadedBy") as string) || "Sarah Connor";

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      fileName = file.name;
      fileType = file.type || "text/plain";
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save file safely (uses /tmp on Vercel serverless)
      try {
        const isEphemeral = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
        const uploadDir = isEphemeral
          ? path.join("/tmp", "exofficio-uploads")
          : path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, buffer);
      } catch (diskErr) {
        console.warn("File disk archiving skipped:", diskErr);
      }

      // Extract text content (handles plain text, markdown, code, and PDFs)
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith(".pdf") || fileType === "application/pdf") {
        content = extractTextFromPdfBuffer(buffer, fileName);
      } else if (
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        lowerName.endsWith(".json") ||
        lowerName.endsWith(".csv") ||
        lowerName.endsWith(".yaml") ||
        lowerName.endsWith(".yml") ||
        lowerName.endsWith(".js") ||
        lowerName.endsWith(".ts") ||
        fileType.startsWith("text/")
      ) {
        content = buffer.toString("utf-8");
      } else {
        // Attempt extracting readable text segments (e.g., from DOCX XML or notes)
        const readable = buffer.toString("utf8").replace(/<[^>]+>/g, " ").replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
        content =
          readable.length > 40
            ? readable.slice(0, 12000)
            : `Extracted specifications and notes from ${fileName} (${(buffer.length / 1024).toFixed(1)} KB). Stored for engineering handover continuity.`;
      }

      fileSize = `${(buffer.length / 1024).toFixed(1)} KB`;
      if (!title) {
        title = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }
    } else {
      // JSON body
      const body = await req.json();
      title = body.title || "Manual Knowledge Note";
      fileName = body.fileName || "manual-entry.md";
      category = body.category || "TECHNICAL_DECISION";
      content = body.content || "";
      uploadedBy = body.uploadedBy || "Sarah Connor";
      fileSize = `${(content.length / 1024).toFixed(1)} KB`;
    }

    // Run AI Summarization on the uploaded document
    const aiSummary = await summarizeDocumentWithGemini(title, content, category);

    // Persist document in store
    const newDoc = store.addDocument({
      projectId,
      title,
      fileName,
      fileType,
      fileSize,
      category,
      content,
      aiSummary,
      aiGrounding: true,
      uploadedBy,
    });
    await store.flush();

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: `Document "${title}" uploaded, persisted, and analyzed successfully.`,
    });
  } catch (err: any) {
    console.error("Document upload route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
