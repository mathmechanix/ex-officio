import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolved = await params;
    const projectId = resolved.projectId;
    store.updateProjectSync(projectId);

    const project = store.getProjectById(projectId);
    const repoName = project ? `${project.repoOwner}/${project.repoName}` : "acme-corp/apollo-core";

    store.addNotification({
      projectId,
      title: `GitHub Repository Synced (${repoName})`,
      message: "Synchronized latest commits, pull requests, and issue statuses into the Unified Timeline.",
      type: "GITHUB_SYNC",
      time: "Just now",
      read: false,
      link: `/dashboard/projects/${projectId}/github`,
    });

    return NextResponse.json({
      success: true,
      lastSyncedAt: "Just now",
      message: `Synchronized repository ${repoName} cleanly.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
