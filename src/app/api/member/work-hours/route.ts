import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET() {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const user = store.getDbUsers().find((u) => u.id === userId);
    const workLogs = store.getWorkLogs(userId);
    const projects = store.getProjectsForUser(userId, (session.user as any).role);
    const teams = store.getTeams();
    const subTeams = store.getSubTeams();

    const userTeam = teams.find((t) => t.id === user?.teamId);
    const userSubTeam = subTeams.find((s) => s.id === user?.subTeamId);

    const totalHours = workLogs.reduce((acc, log) => acc + (Number(log.hours) || 0), 0);
    const weeklyCapacity = user?.workHoursWeekly || 40;

    return NextResponse.json({
      success: true,
      profile: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        employeeId: user?.employeeId,
        clearanceBadge: user?.clearanceBadge,
        team: userTeam?.name || "Platform Engineering",
        subTeam: userSubTeam?.name || "Core Infrastructure",
        weeklyCapacity,
        totalHoursLogged: totalHours,
      },
      workLogs,
      assignedProjects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        techStack: p.techStack,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role || "MEMBER";
    const body = await req.json();
    const { projectId, hours, taskDescription, logDate } = body;

    if (!projectId || !hours || !taskDescription) {
      return NextResponse.json(
        { success: false, error: "projectId, hours, and taskDescription are required." },
        { status: 400 }
      );
    }

    // Clearance check: member can only log hours on their assigned project
    if (!store.userCanAccessProject(userId, userRole, projectId)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You are not assigned to this project." },
        { status: 403 }
      );
    }

    const project = store.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const newLog = store.addWorkLog({
      userId,
      userName: session.user.name || "Team Member",
      userRole,
      projectId,
      projectName: project.name,
      hours: Number(hours),
      taskDescription: taskDescription.trim(),
      logDate: logDate || new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({
      success: true,
      workLog: newLog,
      message: `Logged ${hours} hours for ${project.name}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
