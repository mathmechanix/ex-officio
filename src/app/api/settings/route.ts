import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET() {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const hasKey = Boolean(store.getGeminiKey());
    return NextResponse.json({
      success: true,
      user: session?.user || null,
      geminiConfigured: hasKey,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const body = await req.json();

    let dirty = false;
    if (body.name && session?.user?.email) {
      store.updateUserName(session.user.email, body.name.trim());
      dirty = true;
    }

    if (typeof body.geminiKey === "string" && body.geminiKey.trim().length > 0) {
      store.setGeminiKey(body.geminiKey.trim());
      dirty = true;
    }

    if (dirty) {
      await store.flush();
    }

    return NextResponse.json({
      success: true,
      geminiConfigured: Boolean(store.getGeminiKey()),
      message: "Settings updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
