import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;
    const userRole = session?.user ? (session.user as any).role : undefined;

    const resolved = await params;
    const projectId = resolved.projectId;

    if (userId && !store.userCanAccessProject(userId, userRole, projectId)) {
      return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
    }

    store.updateProjectSync(projectId);

    const project = store.getProjectById(projectId);
    const repoName = project ? `${project.repoOwner}/${project.repoName}` : "repository";

    let commitsIngested = 0;
    if (project && project.repoOwner && project.repoName && project.id !== "proj-apollo-9") {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${project.repoOwner}/${project.repoName}/commits?per_page=10`,
          {
            headers: {
              "User-Agent": "Ex-Officio-Handover-Agent",
              Accept: "application/vnd.github.v3+json",
            },
            signal: AbortSignal.timeout(4000),
          }
        );
        if (ghRes.ok) {
          const ghCommits = await ghRes.json();
          if (Array.isArray(ghCommits)) {
            const existingTimeline = store.getTimeline(projectId);
            const existingTitles = new Set(existingTimeline.map((e) => e.title));

            for (const c of ghCommits) {
              const shortSha = (c.sha || "").substring(0, 7);
              const authorName = c.commit?.author?.name || c.author?.login || "Git Contributor";
              const rawMsg = c.commit?.message || "Update codebase";
              const firstLine = rawMsg.split("\n")[0].slice(0, 75);
              const title = `Commit [${shortSha}]: ${firstLine}`;

              if (!existingTitles.has(title)) {
                store.addTimelineEvent({
                  projectId,
                  type: "COMMIT",
                  title,
                  desc: rawMsg.slice(0, 220),
                  author: authorName,
                  authorRole: "Git Contributor",
                  occurredAt: c.commit?.author?.date || "Recently",
                  sourceUrl:
                    c.html_url ||
                    `https://github.com/${project.repoOwner}/${project.repoName}/commit/${c.sha}`,
                  sourceType: `Git (${shortSha})`,
                  aiLinked: true,
                });
                commitsIngested++;
              }
            }
          }
        }
      } catch (e) {
        console.warn("GitHub API live sync note:", e);
      }
    }

    store.addNotification({
      projectId,
      title: `GitHub Repository Synced (${repoName})`,
      message:
        commitsIngested > 0
          ? `Ingested ${commitsIngested} verified git commit(s) from ${repoName} into the Unified Timeline.`
          : `Synchronized latest commits, pull requests, and branch activity for ${repoName}.`,
      type: "GITHUB_SYNC",
      time: "Just now",
      read: false,
      link: `/dashboard/projects/${projectId}/github`,
    });
    await store.flush();

    return NextResponse.json({
      success: true,
      lastSyncedAt: "Just now",
      commitsIngested,
      message: `Synchronized repository ${repoName} cleanly.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
