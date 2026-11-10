export type UserRole = 'ADMIN' | 'PROJECT_LEAD' | 'MEMBER';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'HANDOVER_IN_PROGRESS' | 'COMPLETED';

export type MemberRole = 'OWNER' | 'LEAD' | 'CONTRIBUTOR' | 'VIEWER';

export type ActivityType = 
  | 'COMMIT'
  | 'PULL_REQUEST'
  | 'ISSUE'
  | 'DOCUMENT_UPLOAD'
  | 'MEETING'
  | 'DECISION'
  | 'TASK_COMPLETION'
  | 'MEMBER_ACTIVITY';

export type InsightCategory = 
  | 'TECHNICAL_DECISION'
  | 'UNFINISHED_TASK'
  | 'HIDDEN_DEPENDENCY'
  | 'RISK'
  | 'KNOWLEDGE_GAP'
  | 'MISSING_DOCUMENTATION'
  | 'KEY_CONTRIBUTION'
  | 'ARCHITECTURE_DECISION';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type InsightStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';

export type ReportStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type DocumentCategory = 
  | 'MEETING_MINUTES'
  | 'TECHNICAL_DECISION'
  | 'ARCHITECTURE'
  | 'DISCUSSION'
  | 'BUG_FIX'
  | 'FAQ'
  | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: MemberRole;
  joinedAt: string;
  departingAt?: string | null;
  isActive: boolean;
  user: User;
  modulesOwned?: string[];
  contributionsCount?: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  techStack: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  stats?: {
    commits: number;
    pullRequests: number;
    issues: number;
    documents: number;
    insights: number;
    handoverProgress: number;
  };
}

export interface TimelineEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  occurredAt: string;
  metadata?: Record<string, any>;
  projectId: string;
  authorName?: string;
  authorAvatar?: string;
  sourceUrl?: string;
  sourceType?: string;
}

export interface InsightEvidence {
  id: string;
  sourceType: 'GITHUB_COMMIT' | 'GITHUB_PR' | 'GITHUB_ISSUE' | 'DOCUMENT' | 'KNOWLEDGE_ENTRY' | 'MEETING';
  sourceId: string;
  sourceUrl?: string;
  sourceTitle: string;
  relevanceScore: number;
  excerpt: string;
}

export interface AIInsight {
  id: string;
  category: InsightCategory;
  title: string;
  content: string;
  severity: SeverityLevel;
  confidenceScore: number;
  isConflicting: boolean;
  conflictDetails?: string;
  status: InsightStatus;
  evidence: InsightEvidence[];
  reviewedById?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface HandoverReport {
  id: string;
  projectId: string;
  title: string;
  departingMember: ProjectMember;
  status: ReportStatus;
  generatedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  summary: string;
  sixQuestions: {
    knowledgePossessed: {
      answer: string;
      insights: AIInsight[];
    };
    decisionsInfluenced: {
      answer: string;
      insights: AIInsight[];
    };
    dependenciesRelied: {
      answer: string;
      insights: AIInsight[];
    };
    missingInformation: {
      answer: string;
      insights: AIInsight[];
    };
    postDepartureRisks: {
      answer: string;
      insights: AIInsight[];
    };
    transitionSteps: {
      answer: string;
      actionItems: { id: string; task: string; assignee?: string; status: 'PENDING' | 'DONE'; priority: 'HIGH' | 'MED' | 'LOW' }[];
    };
  };
}

export interface RiskItem {
  id: string;
  category: 'KNOWLEDGE_CONCENTRATION' | 'UNFINISHED_WORK' | 'MISSING_DOCS' | 'UNRESOLVED_BUGS' | 'DEPENDENCY_RISK' | 'TRANSITION_RISK';
  title: string;
  description: string;
  severity: SeverityLevel;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
  status: 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED' | 'ACCEPTED';
  owner?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  uploadedBy: string;
  createdAt: string;
  contentSnippet?: string;
}
