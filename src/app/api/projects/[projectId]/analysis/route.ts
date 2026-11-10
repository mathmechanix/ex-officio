import { NextResponse } from 'next/server';
import { runGeminiAnalysis } from '@/lib/gemini';
import { store } from '@/lib/store';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const { projectId } = await params;
    const body = await req.json().catch(() => ({}));

    const project = store.getProjectById(projectId);
    const storedDocs = store.getDocuments(projectId);
    const docInputs = storedDocs.map((d) => ({
      title: d.title,
      contentSnippet: (d.aiSummary || d.content).slice(0, 500),
      category: d.category,
    }));

    const analysisInput = {
      projectName: body.projectName || project?.name || 'Apollo Core Platform',
      description: body.description || project?.description || 'Distributed financial transaction engine',
      commits: [
        {
          sha: 'c8f49b1',
          message: 'fix(auth): direct db fallback on token revoke',
          author: 'Alex Chen',
          date: new Date().toISOString(),
        },
        {
          sha: '9a11ef0',
          message: 'chore(cron): sync webhook secret rotating schedule',
          author: 'Alex Chen',
          date: new Date().toISOString(),
        },
        {
          sha: '4a3e21c',
          message: 'feat(sanitizer): initial GDPR masking pipeline for export requests',
          author: 'Alex Chen',
          date: new Date().toISOString(),
        },
      ],
      pullRequests: [
        {
          number: 42,
          title: 'Webhook pipeline updates with HMAC verification',
          body: 'Configured automated webhook verification headers.',
          author: 'Priya Sharma',
        },
      ],
      issues: [
        {
          number: 104,
          title: 'Kafka consumer group rebalance timeout under sustained traffic',
          body: 'Partition rebalancing fails during sustained 50k req/s traffic spikes.',
          state: 'OPEN',
        },
      ],
      documents: docInputs.length > 0 ? docInputs : [
        {
          title: 'Q4 Architecture Topology & Failover RFC',
          contentSnippet: 'Multi-AZ PostgreSQL read-replicas with direct primary write fallback.',
          category: 'ARCHITECTURE',
        },
      ],
      departingMemberName: body.departingMemberName || project?.departingMember?.name || 'Alex Chen',
    };

    const analysisResult = await runGeminiAnalysis(analysisInput);

    // Persist newly discovered insights alongside existing approvals in store
    const storedWithProject = analysisResult.insights.map((ins) => ({
      ...ins,
      projectId,
    }));
    const merged = store.replaceOrMergeInsights(projectId, storedWithProject);

    store.addNotification({
      projectId,
      title: 'AI Knowledge Reconstruction Completed',
      message: `Analyzed ${docInputs.length} project documents and git commits. ${merged.length} evidence-linked insights ready for review.`,
      type: 'ANALYSIS_ALERT',
      time: 'Just now',
      read: false,
      link: `/dashboard/projects/${projectId}/analysis`,
    });
    await store.flush();

    return NextResponse.json({
      success: true,
      projectId,
      timestamp: new Date().toISOString(),
      summary: analysisResult.summary,
      insights: merged,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
