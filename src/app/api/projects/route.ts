import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const projects = store.getProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, techStack, repoOwner, repoName } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });
    }

    const newProject = store.createProject({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || 'New continuity handover workspace',
      status: 'HANDOVER_IN_PROGRESS',
      techStack: techStack || ['TypeScript', 'Next.js'],
      repoOwner: repoOwner || 'acme-corp',
      repoName: repoName || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      departingMember: {
        name: 'Alex Chen',
        role: 'Key Technical Contributor',
        leavingDate: 'in 2 weeks',
        criticalOwnership: 'Core Modules',
      },
    });

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
