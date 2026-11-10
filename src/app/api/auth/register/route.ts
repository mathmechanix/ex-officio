import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    await store.ready();
    const cleanEmail = email.trim().toLowerCase();
    const existing = store.findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const newUser = store.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password, // In production, bcrypt.hashSync(password, 10)
      role: role || "MEMBER",
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`,
    });
    await store.flush();

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user." },
      { status: 500 }
    );
  }
}
