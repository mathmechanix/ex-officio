import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";

export interface SearchHit {
  id: string;
  category: "PROJECT" | "DOCUMENT" | "INSIGHT" | "TIMELINE" | "MEETING" | "TEAM";
  title: string;
  subtitle: string;
  href: string;
}

export async function GET(req: Request) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;
    const userRole = session?.user ? (session.user as any).role : undefined;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (!q) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Get accessible projects for the authenticated user
    const userProjects = store.getProjectsForUser(userId, userRole);
    if (userProjects.length === 0) {
      return NextResponse.json({ success: true, query: q, results: [] });
    }

    const allowedProjectIds = new Set(userProjects.map((p) => p.id));
    const results: SearchHit[] = [];

    // 1. Projects
    for (const p of userProjects) {
      if (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techStack.some((t) => t.toLowerCase().includes(q))
      ) {
        results.push({
          id: p.id,
          category: "PROJECT",
          title: p.name,
          subtitle: `${p.repoOwner}/${p.repoName} • ${p.techStack.slice(0, 3).join(", ")}`,
          href: `/dashboard/projects/${p.id}`,
        });
      }
    }

    // 2. Documents (Knowledge Base)
    for (const p of userProjects) {
      for (const d of store.getDocuments(p.id)) {
        if (
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          (d.aiSummary && d.aiSummary.toLowerCase().includes(q))
        ) {
          results.push({
            id: d.id,
            category: "DOCUMENT",
            title: d.title,
            subtitle: `${d.fileName} • ${d.aiSummary ? d.aiSummary.slice(0, 80) : d.category}`,
            href: `/dashboard/projects/${d.projectId}/knowledge`,
          });
        }
      }
    }

    // 3. AI Insights
    for (const p of userProjects) {
      for (const ins of store.getInsights(p.id)) {
        if (
          ins.title.toLowerCase().includes(q) ||
          ins.content.toLowerCase().includes(q) ||
          ins.category.toLowerCase().includes(q)
        ) {
          results.push({
            id: ins.id,
            category: "INSIGHT",
            title: ins.title,
            subtitle: `${ins.category.replace("_", " ")} • ${Math.round(ins.confidenceScore * 100)}% confidence`,
            href: `/dashboard/projects/${ins.projectId}/analysis`,
          });
        }
      }
    }

    // 4. Timeline Events (Commits, PRs, Issues)
    for (const p of userProjects) {
      for (const evt of store.getTimeline(p.id)) {
        if (
          evt.title.toLowerCase().includes(q) ||
          evt.desc.toLowerCase().includes(q) ||
          evt.author.toLowerCase().includes(q) ||
          evt.sourceType.toLowerCase().includes(q)
        ) {
          results.push({
            id: evt.id,
            category: "TIMELINE",
            title: evt.title,
            subtitle: `${evt.type} by ${evt.author} • ${evt.sourceType}`,
            href: `/dashboard/projects/${evt.projectId}/timeline`,
          });
        }
      }
    }

    // 5. Meetings
    for (const p of userProjects) {
      for (const m of store.getMeetings(p.id)) {
        if (
          m.title.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.decisions.some((dec) => dec.toLowerCase().includes(q))
        ) {
          results.push({
            id: m.id,
            category: "MEETING",
            title: m.title,
            subtitle: `${m.date} • ${m.decisions.length} decisions`,
            href: `/dashboard/projects/${m.projectId}/meetings`,
          });
        }
      }
    }

    // 6. Team / Contacts for accessible projects
    for (const p of userProjects) {
      const members = store.getProjectMembers(p.id);
      for (const m of members) {
        if (m.userName?.toLowerCase().includes(q) || m.userEmail?.toLowerCase().includes(q) || m.projectRole?.toLowerCase().includes(q)) {
          results.push({
            id: `tm-${m.userId}`,
            category: "TEAM",
            title: m.userName,
            subtitle: `${m.projectRole} • ${m.userEmail}`,
            href: `/dashboard/projects/${p.id}/team`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      query: q,
      results: results.slice(0, 20),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
