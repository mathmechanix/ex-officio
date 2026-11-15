import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET() {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Level 3 Administrator clearance required." },
        { status: 403 }
      );
    }

    const members = store.getAllMembersWithMetrics();
    return NextResponse.json({ success: true, members });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Level 3 Administrator clearance required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role, teamId, subTeamId, employeeId, clearanceBadge, workHoursWeekly } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and initial password are required." },
        { status: 400 }
      );
    }

    const existing = store.findUserByEmail(email.trim().toLowerCase());
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A member with this email already exists." },
        { status: 409 }
      );
    }

    const created = store.createMember({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || "MEMBER",
      teamId: teamId || "team-platform",
      subTeamId: subTeamId || "sub-auth",
      employeeId: employeeId?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    if (workHoursWeekly || clearanceBadge) {
      store.updateUser(created.id, {
        workHoursWeekly: Number(workHoursWeekly) || 40,
        clearanceBadge: clearanceBadge || (role === "ADMIN" ? "LEVEL_3_ADMIN" : role === "PROJECT_LEAD" ? "LEVEL_2_LEAD" : "LEVEL_1_MEMBER"),
      });
    }

    const updatedList = store.getAllMembersWithMetrics();
    const memberProfile = updatedList.find((m) => m.id === created.id);

    return NextResponse.json({
      success: true,
      member: memberProfile || created,
      message: `Employee ${name} (${memberProfile?.employeeId || created.employeeId}) successfully provisioned.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Level 3 Administrator clearance required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, name, role, teamId, subTeamId, employeeId, clearanceBadge, workHoursWeekly, status, password } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required for profile modification." },
        { status: 400 }
      );
    }

    const updated = store.updateUser(userId, {
      name,
      role,
      teamId,
      subTeamId,
      employeeId,
      clearanceBadge,
      workHoursWeekly: workHoursWeekly ? Number(workHoursWeekly) : undefined,
      status,
      password: password && password.length >= 6 ? password : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Member not found." },
        { status: 404 }
      );
    }

    const members = store.getAllMembersWithMetrics();
    const updatedProfile = members.find((m) => m.id === userId);

    return NextResponse.json({
      success: true,
      member: updatedProfile,
      message: `Profile and ID badges updated for ${updatedProfile?.name}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
