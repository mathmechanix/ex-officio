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

    const workLogs = store.getWorkLogs();
    const members = store.getAllMembersWithMetrics();
    const projects = store.getProjectsForUser(undefined, "ADMIN");

    const totalHours = workLogs.reduce((acc, log) => acc + (Number(log.hours) || 0), 0);
    const totalWeeklyCapacity = members.reduce((acc, m) => acc + (Number(m.workHoursWeekly) || 40), 0);

    // Group hours by project
    const hoursByProject: Record<string, { projectName: string; hours: number; logsCount: number }> = {};
    workLogs.forEach((l) => {
      if (!hoursByProject[l.projectId]) {
        hoursByProject[l.projectId] = { projectName: l.projectName, hours: 0, logsCount: 0 };
      }
      hoursByProject[l.projectId].hours += Number(l.hours) || 0;
      hoursByProject[l.projectId].logsCount += 1;
    });

    // Group hours by member
    const hoursByMember: Record<string, { userName: string; userRole: string; hours: number; weeklyCapacity: number }> = {};
    members.forEach((m) => {
      hoursByMember[m.id] = {
        userName: m.name,
        userRole: m.role,
        hours: m.hoursLoggedTotal,
        weeklyCapacity: m.workHoursWeekly,
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalHours,
        totalWeeklyCapacity,
        utilizationRate: totalWeeklyCapacity > 0 ? Math.round((totalHours / totalWeeklyCapacity) * 100) : 0,
        logsCount: workLogs.length,
      },
      workLogs,
      hoursByProject: Object.values(hoursByProject),
      hoursByMember: Object.values(hoursByMember),
    });
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
    const { userId, projectId, hours, taskDescription, logDate } = body;

    if (!userId || !projectId || !hours || !taskDescription) {
      return NextResponse.json(
        { success: false, error: "userId, projectId, hours, and taskDescription are required." },
        { status: 400 }
      );
    }

    const targetUser = store.getDbUsers().find((u) => u.id === userId);
    const targetProject = store.getProjectById(projectId);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Member not found." }, { status: 404 });
    }
    if (!targetProject) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const newLog = store.addWorkLog({
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: targetUser.role,
      projectId: targetProject.id,
      projectName: targetProject.name,
      hours: Number(hours),
      taskDescription: taskDescription.trim(),
      logDate: logDate || new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({
      success: true,
      workLog: newLog,
      message: `Logged ${hours} hours for ${targetUser.name} on ${targetProject.name}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
