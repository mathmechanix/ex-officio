import { NextResponse } from "next/server";
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
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const projectId = searchParams.get("projectId") || "proj-apollo-9";

    if (!q) {
      return NextResponse.json({ success: true, results: [] });
    }

    const results: SearchHit[] = [];

    // 1. Projects
    for (const p of store.getProjects()) {
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
    for (const d of store.getDocuments()) {
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
          href: `/dashboard/projects/${d.projectId || projectId}/knowledge`,
        });
      }
    }

    // 3. AI Insights
    for (const ins of store.getInsights()) {
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
          href: `/dashboard/projects/${ins.projectId || projectId}/analysis`,
        });
      }
    }

    // 4. Timeline Events (Commits, PRs, Issues)
    for (const evt of store.getTimeline()) {
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
          href: `/dashboard/projects/${evt.projectId || projectId}/timeline`,
        });
      }
    }

    // 5. Meetings
    for (const m of store.getMeetings()) {
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
          href: `/dashboard/projects/${m.projectId || projectId}/meetings`,
        });
      }
    }

    // 6. Team / Contacts
    const teamContacts = [
      { id: "tm-alex", name: "Alex Chen", role: "Principal Backend Architect (Departing)", email: "alex.chen@acme.com" },
      { id: "tm-priya", name: "Priya Sharma", role: "Senior Full Stack Engineer (Successor)", email: "priya.sharma@acme.com" },
      { id: "tm-sarah", name: "Sarah Connor", role: "Engineering Manager & Project Lead", email: "sarah.connor@acme.com" },
      { id: "tm-david", name: "David Kim", role: "DevOps & Reliability Engineer", email: "david.kim@acme.com" },
    ];
    for (const tm of teamContacts) {
      if (
        tm.name.toLowerCase().includes(q) ||
        tm.role.toLowerCase().includes(q) ||
        tm.email.toLowerCase().includes(q)
      ) {
        results.push({
          id: tm.id,
          category: "TEAM",
          title: tm.name,
          subtitle: `${tm.role} • ${tm.email}`,
          href: `/dashboard/projects/${projectId}/team`,
        });
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
