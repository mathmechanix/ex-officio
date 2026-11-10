import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolved = await params;
    const links = store.getShareLinks(resolved.projectId);
    return NextResponse.json({ success: true, shareLinks: links });
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
    const projectId = resolved.projectId;
    const body = await req.json().catch(() => ({}));

    const accessRole = body.accessRole || "INCOMING_LEAD";
    const redactSecrets = body.redactSecrets !== undefined ? Boolean(body.redactSecrets) : true;
    const expiresInDays = Number(body.expiresInDays) || 14;
    const createdBy = body.createdBy || "Sarah Connor";

    const link = store.createShareLink({
      projectId,
      createdBy,
      accessRole,
      redactSecrets,
      expiresInDays,
    });

    return NextResponse.json({
      success: true,
      shareLink: link,
      sharePath: `/shared/${link.token}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
