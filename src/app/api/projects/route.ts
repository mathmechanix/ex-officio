import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;
    const userRole = session?.user ? (session.user as any).role : undefined;

    const projects = store.getProjectsForUser(userId, userRole);
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await store.ready();
    const session = await getServerSession(authOptions);
    const creatorUserId = session?.user ? (session.user as any).id : undefined;

    const body = await req.json();
    const { name, description, techStack, repoOwner, repoName, repoUrl, teamId, subTeamId, isExclusive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });
    }

    let finalRepoOwner = repoOwner;
    let finalRepoName = repoName;

    if (repoUrl && (!finalRepoOwner || !finalRepoName)) {
      const cleaned = String(repoUrl)
        .trim()
        .replace(/\.git$/, '')
        .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//, '')
        .replace(/^git@github\.com:/, '');
      const parts = cleaned.split('/').filter(Boolean);
      if (parts.length >= 2) {
        finalRepoOwner = parts[0];
        finalRepoName = parts[1];
      } else if (parts.length === 1) {
        finalRepoName = parts[0];
      }
    }

    if (!finalRepoOwner) {
      finalRepoOwner = (session?.user?.name || 'repository').toLowerCase().replace(/[^a-z0-9_-]+/g, '');
    }
    if (!finalRepoName) {
      finalRepoName = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    }

    const newProject = store.createProject({
      name: name.trim().slice(0, 80),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description ? description.slice(0, 300) : 'New continuity handover workspace',
      status: 'HANDOVER_IN_PROGRESS',
      techStack: techStack || ['TypeScript', 'Next.js'],
      repoOwner: finalRepoOwner.slice(0, 50),
      repoName: finalRepoName.slice(0, 50),
      teamId: teamId || 'team-platform',
      subTeamId: subTeamId || 'sub-auth',
      isExclusive: isExclusive !== undefined ? Boolean(isExclusive) : true,
      creatorUserId,
      departingMember: {
        name: session?.user?.name || 'Unassigned',
        role: 'Key Technical Contributor',
        leavingDate: 'In Schedule',
        criticalOwnership: 'Core Modules',
      },
    });
    await store.flush();

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
