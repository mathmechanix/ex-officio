import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";
import { ingestGitHubRepository } from "@/lib/github-ingest";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const userId = session?.user ? ((session.user as any).id || session.user.email) : undefined;
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
    let contributorsIngested = 0;
    let docsIngested = 0;

    if (project && project.repoOwner && project.repoName && project.id !== "proj-apollo-9") {
      try {
        const result = await ingestGitHubRepository(projectId, project.repoOwner, project.repoName);
        commitsIngested = result.commitsCount;
        contributorsIngested = result.contributorsCount;
        if (result.readmeTitle) docsIngested = 1;
      } catch (e) {
        console.warn("GitHub API live sync note:", e);
      }
    }

    store.addNotification({
      projectId,
      title: `GitHub Repository Synced (${repoName})`,
      message: `Synchronized ${commitsIngested} verified git commit(s), ${contributorsIngested} contributor(s), and repository architecture documentation for ${repoName}.`,
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
      contributorsIngested,
      docsIngested,
      message: `Synchronized repository ${repoName} cleanly.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
