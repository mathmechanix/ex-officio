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
    const { name, description, techStack, repoOwner, repoName, teamId, subTeamId, isExclusive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });
    }

    const newProject = store.createProject({
      name: name.trim().slice(0, 80),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description ? description.slice(0, 300) : 'New continuity handover workspace',
      status: 'HANDOVER_IN_PROGRESS',
      techStack: techStack || ['TypeScript', 'Next.js'],
      repoOwner: repoOwner ? repoOwner.slice(0, 50) : 'acme-corp',
      repoName: repoName ? repoName.slice(0, 50) : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      teamId: teamId || 'team-platform',
      subTeamId: subTeamId || 'sub-auth',
      isExclusive: isExclusive !== undefined ? Boolean(isExclusive) : true,
      creatorUserId,
      departingMember: {
        name: session?.user?.name || 'Alex Chen',
        role: 'Key Technical Contributor',
        leavingDate: 'in 2 weeks',
        criticalOwnership: 'Core Modules',
      },
    });
    await store.flush();

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
