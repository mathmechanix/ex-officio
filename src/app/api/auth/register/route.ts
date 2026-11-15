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

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Attack Prevention: Rate limit registrations
    const rateLimit = store.checkRateLimit(`reg-${cleanEmail}`, 5, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }

    await store.ready();
    const existing = store.findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const newUser = store.createUser({
      name: name.trim().slice(0, 80),
      email: cleanEmail,
      passwordHash: password, // store.createUser auto-hashes with bcrypt
      role: role === "ADMIN" ? "MEMBER" : (role || "MEMBER"), // public signups default to MEMBER
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
