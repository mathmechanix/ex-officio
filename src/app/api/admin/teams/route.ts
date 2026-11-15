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

    const teams = store.getTeams();
    const subTeams = store.getSubTeams();
    const members = store.getDbUsers();

    const hierarchy = teams.map((team) => {
      const childSubTeams = subTeams
        .filter((st) => st.teamId === team.id)
        .map((st) => {
          const subMembers = members.filter((m) => m.subTeamId === st.id);
          return {
            ...st,
            membersCount: subMembers.length,
            members: subMembers.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role,
              employeeId: m.employeeId,
              clearanceBadge: m.clearanceBadge,
            })),
          };
        });

      const teamMembers = members.filter((m) => m.teamId === team.id);

      return {
        ...team,
        subTeams: childSubTeams,
        totalMembersCount: teamMembers.length,
      };
    });

    return NextResponse.json({ success: true, teams: hierarchy, flatSubTeams: subTeams });
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
    const { type, name, description, teamId, leadId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required." },
        { status: 400 }
      );
    }

    if (type === "team") {
      const created = store.createTeam(name, description || "", leadId);
      return NextResponse.json({
        success: true,
        team: created,
        message: `Team "${created.name}" created successfully.`,
      });
    }

    if (type === "subteam") {
      if (!teamId) {
        return NextResponse.json(
          { success: false, error: "Parent teamId is required for creating a sub-team." },
          { status: 400 }
        );
      }
      const created = store.createSubTeam(teamId, name, description || "", leadId);
      return NextResponse.json({
        success: true,
        subTeam: created,
        message: `Sub-team "${created.name}" created successfully.`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type. Must be 'team' or 'subteam'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
