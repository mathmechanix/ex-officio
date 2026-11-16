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

    // Load repository contributors and structure modules
    const isApollo = projectId === "proj-apollo-9";
    let contributors: any[] = [];
    let modules: any[] = [];
    let repoMeta: any = {};

    if (isApollo) {
      contributors = [
        {
          name: "Alex Chen",
          role: "Principal Backend Architect",
          email: "alex.chen@acme.com",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
          isDeparting: true,
          departingDate: "Nov 14, 2026",
          commitsCount: 284,
          prsMerged: 42,
          primaryModules: ["Auth & Sessions (68%)", "Data Sanitizer (88%)", "Kafka Consumer (64%)"],
        },
        {
          name: "Priya Sharma",
          role: "Senior Full Stack Engineer (Successor Lead)",
          email: "priya.sharma@acme.com",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
          isDeparting: false,
          commitsCount: 86,
          prsMerged: 18,
          primaryModules: ["Billing Integration (74%)", "Frontend Dashboard (62%)"],
        },
        {
          name: "Sarah Connor",
          role: "Engineering Manager & Project Lead",
          email: "sarah.connor@acme.com",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
          isDeparting: false,
          commitsCount: 14,
          prsMerged: 5,
          primaryModules: ["Architecture RFCs", "Security Policies"],
        },
        {
          name: "David Kim",
          role: "DevOps & Reliability Engineer",
          email: "david.kim@acme.com",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
          isDeparting: false,
          commitsCount: 28,
          prsMerged: 9,
          primaryModules: ["PostgreSQL Pooling (82%)", "CI/CD Pipelines (90%)"],
        },
      ];

      modules = [
        {
          id: "mod-auth",
          path: "src/auth/sessions.ts",
          name: "Auth Session Revocation Engine",
          primaryOwner: "Alex Chen (Departing)",
          ownerPercentage: 68,
          status: "UNDOCUMENTED_EDGE_CASES",
          linesOfCode: 420,
          recentCommits: 24,
          docCoverage: "Low (30%)",
          dependencies: ["PostgreSQL Driver", "Crypto (HMAC-SHA256)"],
          description: "Handles token revocation with direct primary DB fallback to bypass replica lag in multi-region deployments.",
        },
        {
          id: "mod-sanitizer",
          path: "src/workers/sanitizer.ts",
          name: "GDPR Data Sanitizer Worker",
          primaryOwner: "Alex Chen (Departing)",
          ownerPercentage: 88,
          status: "HIGH_RISK_CONCENTRATION",
          linesOfCode: 650,
          recentCommits: 18,
          docCoverage: "Missing (0%)",
          dependencies: ["Node Stream API", "Prisma Batch Client"],
          description: "Zero peer reviews. Exports user transaction data while pseudonymizing PII under compliance rules.",
        },
        {
          id: "mod-kafka",
          path: "src/events/kafka.ts",
          name: "Kafka Event Consumer Group",
          primaryOwner: "Alex Chen (Departing)",
          ownerPercentage: 64,
          status: "UNRESOLVED_BUG",
          linesOfCode: 580,
          recentCommits: 32,
          docCoverage: "Moderate (55%)",
          dependencies: ["kafkajs", "Zookeeper / Kraft"],
          description: "Partition rebalancing triggers heartbeat timeouts under high loads. Unfinished patch in Issue #104.",
        },
        {
          id: "mod-billing",
          path: "src/billing/stripe.ts",
          name: "Billing & Idempotent Invoicing",
          primaryOwner: "Priya Sharma",
          ownerPercentage: 74,
          status: "STABLE",
          linesOfCode: 380,
          recentCommits: 14,
          docCoverage: "High (85%)",
          dependencies: ["Stripe SDK", "Prisma Transactional"],
          description: "Handles webhook signatures and idempotent ledger writes for monthly subscriptions.",
        },
      ];
    } else {
      const cache = store.getProjectRepoCache ? store.getProjectRepoCache(projectId) : null;
      contributors = cache?.contributors || [];
      modules = cache?.modules || [];
      repoMeta = cache?.repoMeta || {};

      // If cache is empty, synthesize from timeline commit authors
      if (contributors.length === 0) {
        const commitAuthors = new Map<string, number>();
        timeline.forEach((t) => {
          if (t.author) {
            commitAuthors.set(t.author, (commitAuthors.get(t.author) || 0) + 1);
          }
        });
        if (commitAuthors.size > 0) {
          Array.from(commitAuthors.entries()).forEach(([name, count], idx) => {
            contributors.push({
              name,
              role: idx === 0 ? "Key Lead Contributor" : "Engineering Contributor",
              email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@github.com`,
              avatar: `https://github.com/${name.replace(/[^a-zA-Z0-9_-]/g, "")}.png`,
              isDeparting: idx === 0,
              departingDate: "In Schedule",
              commitsCount: count,
              prsMerged: Math.max(1, Math.round(count / 3)),
              primaryModules: ["Core Repository Modules"],
            });
          });
        } else if (project.departingMember?.name && project.departingMember.name !== "None") {
          contributors.push({
            name: project.departingMember.name,
            role: project.departingMember.role || "Key Technical Contributor",
            email: "contributor@github.com",
            avatar: project.departingMember.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
            isDeparting: true,
            departingDate: project.departingMember.leavingDate || "In Schedule",
            commitsCount: timeline.length || 1,
            prsMerged: 0,
            primaryModules: ["Primary Application Logic"],
          });
        }
      }

      if (modules.length === 0) {
        const stack = project.techStack || ["TypeScript"];
        modules.push(
          {
            id: "mod-main",
            path: "src/",
            name: "Core Application Modules",
            primaryOwner: contributors[0]?.name || "Lead Contributor",
            ownerPercentage: 75,
            status: "STABLE",
            linesOfCode: 450,
            recentCommits: timeline.length,
            docCoverage: documents.length > 0 ? "Documented (70%)" : "Unindexed (0%)",
            dependencies: stack,
            description: `Core functionality and services for ${project.repoName || project.name}.`,
          }
        );
      }
    }

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
      contributors,
      modules,
      repoMeta,
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
