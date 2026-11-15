import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { store } from "@/lib/store";
import { answerHandoverQuestionAI } from "@/lib/gemini";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId;

    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const userRole = (session.user as any).role || "MEMBER";
      if (!store.userCanAccessProject(userId, userRole, projectId)) {
        return NextResponse.json(
          { success: false, error: "Access Denied to this project." },
          { status: 403 }
        );
      }
    }

    const questions = store.getHandoverQuestions(projectId);
    return NextResponse.json({ success: true, questions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId;

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const questionText = body.question?.trim();
    const category = body.category?.trim() || "GENERAL";
    const askedBy = body.askedBy?.trim() || session?.user?.name || "Incoming Team Member";

    if (!questionText) {
      return NextResponse.json(
        { success: false, error: "Question text is required." },
        { status: 400 }
      );
    }

    const newQuestion = store.addHandoverQuestion(
      projectId,
      questionText,
      askedBy,
      category
    );

    // If autoGenerateAI was requested on ask
    if (body.autoGenerateAI) {
      const project = store.getProjectById(projectId);
      const docs = store.getDocuments(projectId);
      const insights = store.getInsights(projectId);
      const aiAnswer = await answerHandoverQuestionAI(
        questionText,
        project?.name || projectId,
        docs.map((d) => ({ title: d.title, content: d.content, category: d.category })),
        insights
      );
      const answered = store.answerHandoverQuestion(
        newQuestion.id,
        aiAnswer,
        "Ex Officio AI Assistant"
      );
      return NextResponse.json({ success: true, question: answered || newQuestion });
    }

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await store.ready();
    const resolved = await params;
    const projectId = resolved.projectId;

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const questionId = body.questionId;
    let answerText = body.answer?.trim();
    const answeredBy = body.answeredBy?.trim() || session?.user?.name || "Project Lead";

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "questionId is required." },
        { status: 400 }
      );
    }

    // AI answer generation
    if (body.generateAI) {
      const questions = store.getHandoverQuestions(projectId);
      const targetQ = questions.find((q) => q.id === questionId);
      if (!targetQ) {
        return NextResponse.json(
          { success: false, error: "Question not found." },
          { status: 404 }
        );
      }
      const project = store.getProjectById(projectId);
      const docs = store.getDocuments(projectId);
      const insights = store.getInsights(projectId);

      answerText = await answerHandoverQuestionAI(
        targetQ.question,
        project?.name || projectId,
        docs.map((d) => ({ title: d.title, content: d.content, category: d.category })),
        insights
      );
    }

    if (!answerText) {
      return NextResponse.json(
        { success: false, error: "Answer text is required." },
        { status: 400 }
      );
    }

    const updated = store.answerHandoverQuestion(
      questionId,
      answerText,
      answeredBy
    );

    return NextResponse.json({ success: true, question: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
