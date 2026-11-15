import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId || "proj-apollo-9";

    // Strict clearance check
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const userRole = (session.user as any).role || "MEMBER";
      const hasAccess = store.userCanAccessProject(userId, userRole, projectId);
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: You do not hold security clearance for this project.",
          },
          { status: 403 }
        );
      }
    }

    const project = store.getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const documents = store.getDocuments(projectId);
    const insights = store.getInsights(projectId);
    const timeline = store.getTimeline(projectId);
    const meetings = store.getMeetings(projectId);
    const notifications = store.getNotifications();
    const handover = store.getHandoverState(projectId);
    const shareLinks = store.getShareLinks(projectId);
    const teamMessages = store.getTeamMessages(projectId);
    const handoverQuestions = store.getHandoverQuestions(projectId);
    const workLogs = store.getWorkLogsForProject(projectId);

    const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
    const approvedCount = insights.filter((i) => i.status === "APPROVED").length;
    const highRiskCount = insights.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length;
    const needsReviewCount = insights.filter((i) => i.status === "NEEDS_REVIEW").length;

    const doneSteps = handover.transitionSteps.filter((s) => s.done).length;
    const totalSteps = handover.transitionSteps.length || 1;
    const readinessScore = Math.min(
      100,
      Math.round(
        ((approvedCount / Math.max(insights.length, 1)) * 55) +
          ((doneSteps / totalSteps) * 35) +
          (handover.status === "PUBLISHED" ? 10 : 0) +
          Math.min(documents.length * 2, 10)
      )
    );

    return NextResponse.json({
      success: true,
      project,
      documents,
      insights,
      timeline,
      meetings,
      notifications,
      handover,
      shareLinks,
      teamMessages,
      handoverQuestions,
      workLogs,
      metrics: {
        documentsCount: documents.length,
        insightsCount: insights.length,
        timelineCount: timeline.length,
        meetingsCount: meetings.length,
        approvedCount,
        highRiskCount,
        needsReviewCount,
        unreadNotificationsCount,
        readinessScore,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
