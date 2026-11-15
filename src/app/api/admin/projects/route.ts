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

    const projects = store.getProjectsForUser(undefined, "ADMIN");
    const teams = store.getTeams();
    const subTeams = store.getSubTeams();

    const enhancedProjects = projects.map((p) => {
      const members = store.getProjectMembers(p.id);
      const team = teams.find((t) => t.id === p.teamId);
      const subTeam = subTeams.find((s) => s.id === p.subTeamId);
      const handover = store.getHandoverState(p.id);
      const insights = store.getInsights(p.id);
      const totalHours = members.reduce((acc: number, m: any) => acc + (Number(m.hoursLogged) || 0), 0);

      const doneSteps = handover.transitionSteps?.filter((s: any) => s.done).length || 0;
      const totalSteps = handover.transitionSteps?.length || 1;
      const progressPercent = Math.round((doneSteps / totalSteps) * 100);

      return {
        ...p,
        teamName: team?.name || "Platform Engineering",
        subTeamName: subTeam?.name || "Core Infrastructure",
        assignedMembers: members,
        membersCount: members.length,
        totalHoursLogged: totalHours,
        progressPercent,
        handoverStatus: handover.status,
        insightsCount: insights.length,
      };
    });

    return NextResponse.json({ success: true, projects: enhancedProjects });
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
    const { action } = body;

    if (action === "assign") {
      const { projectId, userId, role } = body;
      if (!projectId || !userId) {
        return NextResponse.json(
          { success: false, error: "projectId and userId are required." },
          { status: 400 }
        );
      }
      store.assignMemberToProject(projectId, userId, role || "CONTRIBUTOR");
      const members = store.getProjectMembers(projectId);
      return NextResponse.json({
        success: true,
        message: "Member assigned to project successfully.",
        members,
      });
    }

    if (action === "remove") {
      const { projectId, userId } = body;
      if (!projectId || !userId) {
        return NextResponse.json(
          { success: false, error: "projectId and userId are required." },
          { status: 400 }
        );
      }
      store.removeMemberFromProject(projectId, userId);
      const members = store.getProjectMembers(projectId);
      return NextResponse.json({
        success: true,
        message: "Member removed from project.",
        members,
      });
    }

    if (action === "create") {
      const { name, description, techStack, isExclusive, teamId, subTeamId, departingMember } = body;
      if (!name) {
        return NextResponse.json(
          { success: false, error: "Project name is required." },
          { status: 400 }
        );
      }
      const created = store.createProject({
        name,
        description: description || "Enterprise knowledge handover repository",
        techStack: Array.isArray(techStack) ? techStack : [techStack || "TypeScript"],
        isExclusive: isExclusive !== undefined ? Boolean(isExclusive) : true,
        teamId: teamId || "team-platform",
        subTeamId: subTeamId || "sub-auth",
        departingMember: departingMember || {
          name: "Unassigned",
          role: "Principal Engineer",
          leavingDate: "in 2 weeks",
          criticalOwnership: "System Core",
        },
        creatorUserId: (session.user as any).id,
      });
      return NextResponse.json({
        success: true,
        project: created,
        message: `Project ${created.name} provisioned.`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action. Valid actions: 'assign', 'remove', 'create'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
