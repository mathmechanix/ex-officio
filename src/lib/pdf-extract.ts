import zlib from "zlib";

/**
 * Extracts readable text from a PDF buffer by inflating FlateDecode streams
 * and parsing PDF text-showing operators (Tj / TJ) as well as literal strings.
 */
export function extractTextFromPdfBuffer(buffer: Buffer, fileName: string): string {
  try {
    const rawLatin1 = buffer.toString("latin1");
    const chunks: string[] = [];

    // 1. Decompress FlateDecode / compressed streams and scan text operators
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]*endstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(rawLatin1)) !== null) {
      const streamBody = match[1];
      const streamBytes = Buffer.from(streamBody, "latin1");
      let decoded = "";

      try {
        const inflated = zlib.inflateSync(streamBytes);
        decoded = inflated.toString("utf8");
      } catch {
        try {
          // Sometimes there are extra leading/trailing bytes or raw uncompressed stream
          const inflated = zlib.inflateRawSync(streamBytes);
          decoded = inflated.toString("utf8");
        } catch {
          decoded = streamBytes.toString("utf8");
        }
      }

      const extractedFromStream = extractPdfTextOperators(decoded);
      if (extractedFromStream) {
        chunks.push(extractedFromStream);
      }
    }

    // 2. Also scan top-level uncompressed PDF objects if stream extraction yielded little
    if (chunks.join(" ").trim().length < 20) {
      const topLevel = extractPdfTextOperators(rawLatin1);
      if (topLevel) {
        chunks.push(topLevel);
      }
    }

    // 3. Fallback to readable printable ASCII runs if PDF used custom encodings
    let combined = chunks
      .join("\n")
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E\n]/g, "")
      .trim();

    if (combined.length < 25) {
      const asciiRuns = rawLatin1.match(/[A-Za-z0-9][A-Za-z0-9 ,.;:!?'"()\-_/\\@#$%&*+=\[\]{}]{12,}/g);
      const filteredRuns = (asciiRuns || []).filter(
        (line) =>
          !/^(FlateDecode|Type|Font|Catalog|Pages|MediaBox|Resources|Filter|Length|Parent|Kids|Count|Encoding|Subtype|BaseFont|endobj|endstream|xref|trailer)/.test(
            line.trim()
          )
      );
      if (filteredRuns.length > 0) {
        combined = filteredRuns.slice(0, 60).join(" ").trim();
      }
    }

    if (combined.length >= 20) {
      return combined.slice(0, 15000);
    }

    return `PDF Artifact "${fileName}" (${(buffer.length / 1024).toFixed(1)} KB) ingested on ${new Date().toLocaleDateString()}. Note: Document appears image-scanned or compressed with custom font glyphs; binary artifact preserved for handover verification.`;
  } catch (err) {
    console.warn("PDF extraction warning:", err);
    return `PDF Artifact "${fileName}" (${(buffer.length / 1024).toFixed(1)} KB) uploaded and archived for project handover continuity.`;
  }
}

function extractPdfTextOperators(source: string): string {
  const parts: string[] = [];

  // Match (...) Tj or (...) '
  const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|')/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(source)) !== null) {
    const clean = unescapePdfString(m[1]);
    if (clean.trim()) parts.push(clean);
  }

  // Match [(...) ...] TJ arrays
  const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((m = tjArrayRegex.exec(source)) !== null) {
    const inner = m[1];
    const strRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
    let innerMatch: RegExpExecArray | null;
    const rowParts: string[] = [];
    while ((innerMatch = strRegex.exec(inner)) !== null) {
      rowParts.push(unescapePdfString(innerMatch[1]));
    }
    const joined = rowParts.join("");
    if (joined.trim()) parts.push(joined);
  }

  return parts.join(" ").trim();
}

function unescapePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}
