import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { get as getBlob, put as putBlob } from '@vercel/blob';
import { AUTH_SECRET } from '@/lib/auth-config';
import type { InsightCategory, SeverityLevel, InsightStatus } from '@/types';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'PROJECT_LEAD' | 'MEMBER';
  avatar?: string;
  createdAt: string;
}

export interface StoredDocument {
  id: string;
  projectId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  category: string;
  content: string;
  aiSummary?: string;
  aiGrounding: boolean;
  uploadedBy: string;
  createdAt: string;
}

export interface StoredInsight {
  id: string;
  projectId: string;
  category: InsightCategory;
  title: string;
  content: string;
  severity: SeverityLevel;
  confidenceScore: number;
  isConflicting: boolean;
  conflictDetails?: string;
  status: InsightStatus;
  evidence: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    sourceUrl?: string;
    sourceTitle: string;
    relevanceScore: number;
    excerpt: string;
  }>;
  createdAt: string;
}

export interface StoredMeeting {
  id: string;
  projectId: string;
  title: string;
  date: string;
  duration: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  actionItems: Array<{ task: string; assignee: string; done: boolean }>;
}

export interface StoredProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'ACTIVE' | 'HANDOVER_IN_PROGRESS' | 'COMPLETED';
  techStack: string[];
  repoOwner: string;
  repoName: string;
  lastSyncedAt: string;
  departingMember: {
    name: string;
    role: string;
    leavingDate: string;
    avatar?: string;
    criticalOwnership: string;
  };
}

export interface StoredTimelineEvent {
  id: string;
  projectId: string;
  type: 'COMMIT' | 'PULL_REQUEST' | 'ISSUE' | 'DOCUMENT' | 'MEETING' | 'DECISION';
  title: string;
  desc: string;
  author: string;
  authorRole: string;
  occurredAt: string;
  sourceUrl?: string;
  sourceType: string;
  aiLinked: boolean;
  aiInsightTitle?: string;
}

export interface StoredNotification {
  id: string;
  projectId: string;
  title: string;
  message: string;
  type: 'HANDOVER_STATUS' | 'ANALYSIS_ALERT' | 'GITHUB_SYNC' | 'TASK_ASSIGNED' | 'TEAM_CONTACT' | 'DOCUMENT_UPLOAD';
  time: string;
  createdAt: string;
  read: boolean;
  link: string;
}

export interface StoredTransitionStep {
  id: string;
  task: string;
  owner: string;
  done: boolean;
}

export interface StoredHandoverState {
  projectId: string;
  status: 'IN_REVIEW' | 'PUBLISHED';
  publishedAt?: string;
  publishedBy?: string;
  leadNotes?: string;
  transitionSteps: StoredTransitionStep[];
}

export interface StoredShareLink {
  token: string;
  projectId: string;
  createdBy: string;
  accessRole: 'INCOMING_LEAD' | 'TEAM_MEMBER' | 'EXECUTIVE_AUDITOR';
  redactSecrets: boolean;
  expiresInDays: number;
  createdAt: string;
}

export interface StoredTeamMessage {
  id: string;
  projectId: string;
  toMember: string;
  toEmail: string;
  fromUser: string;
  subject: string;
  message: string;
  channel: 'IN_APP' | 'SYNC_REQUEST' | 'EMAIL';
  createdAt: string;
}

interface DataStore {
  users: StoredUser[];
  projects: StoredProject[];
  documents: StoredDocument[];
  insights: StoredInsight[];
  meetings: StoredMeeting[];
  timeline: StoredTimelineEvent[];
  notifications: StoredNotification[];
  handovers: StoredHandoverState[];
  shareLinks: StoredShareLink[];
  teamMessages: StoredTeamMessage[];
  geminiApiKey?: string;
}

const IS_EPHEMERAL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const USE_BLOB = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN && (IS_EPHEMERAL || process.env.USE_VERCEL_BLOB === 'true')
);
const BLOB_PATH = 'exofficio/store.json';
const DATA_FILE = IS_EPHEMERAL
  ? path.join('/tmp', 'exofficio-store.json')
  : path.join(process.cwd(), 'data', 'store.json');
const globalForStore = globalThis as unknown as {
  __exOfficioStoreCache?: DataStore;
  __exOfficioBlobEtag?: string;
  __exOfficioPendingReady?: Promise<void>;
  __exOfficioPendingFlush?: Promise<void>;
};

const INITIAL_DATA: DataStore = {
  users: [
    {
      id: 'usr-lead-01',
      name: 'Sarah Connor',
      email: 'lead@exofficio.dev',
      passwordHash: 'password123',
      role: 'PROJECT_LEAD',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-member-02',
      name: 'Alex Chen',
      email: 'alex.chen@acme.com',
      passwordHash: 'password123',
      role: 'MEMBER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-member-03',
      name: 'Priya Sharma',
      email: 'priya.sharma@acme.com',
      passwordHash: 'password123',
      role: 'MEMBER',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: 'proj-apollo-9',
      name: 'Apollo Core Platform',
      slug: 'apollo-core',
      description: 'Distributed event-driven transaction gateway with PostgreSQL, Prisma, Kafka and NextAuth.js.',
      status: 'HANDOVER_IN_PROGRESS',
      techStack: ['TypeScript', 'Next.js', 'PostgreSQL', 'Prisma', 'Kafka'],
      repoOwner: 'acme-corp',
      repoName: 'apollo-core',
      lastSyncedAt: '12 mins ago',
      departingMember: {
        name: 'Alex Chen',
        role: 'Principal Backend Architect',
        leavingDate: 'in 4 days (Nov 14, 2026)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        criticalOwnership: '82% of Auth & Kafka Modules',
      },
    },
    {
      id: 'proj-mercury-2',
      name: 'Mercury Mobile Client',
      slug: 'mercury-mobile',
      description: 'React Native enterprise companion app for cross-platform logistics and inventory tracking.',
      status: 'ACTIVE',
      techStack: ['React Native', 'Expo', 'GraphQL', 'Tailwind'],
      repoOwner: 'acme-corp',
      repoName: 'mercury-mobile',
      lastSyncedAt: '2 days ago',
      departingMember: {
        name: 'None',
        role: 'N/A',
        leavingDate: 'N/A',
        avatar: '',
        criticalOwnership: 'Fully Distributed',
      },
    },
    {
      id: 'proj-nexus-vault',
      name: 'Nexus Identity Vault',
      slug: 'nexus-vault',
      description: 'Zero-trust authorization server and multi-tenant credential manager with mTLS.',
      status: 'ACTIVE',
      techStack: ['Go', 'gRPC', 'PostgreSQL', 'Redis'],
      repoOwner: 'acme-corp',
      repoName: 'nexus-vault',
      lastSyncedAt: '5 days ago',
      departingMember: {
        name: 'None',
        role: 'N/A',
        leavingDate: 'N/A',
        avatar: '',
        criticalOwnership: 'Fully Distributed',
      },
    },
  ],
  documents: [
    {
      id: 'doc-1',
      projectId: 'proj-apollo-9',
      title: 'Q4 Architecture Topology & Failover RFC',
      fileName: 'RFC-402-Topology.pdf',
      fileType: 'application/pdf',
      fileSize: '2.4 MB',
      category: 'ARCHITECTURE',
      content: 'Multi-AZ PostgreSQL read-replica topology with automatic health check fallback to primary node. To mitigate replica lag in eu-central during token revocation events, session revoking bypasses Redis cluster cache and queries the primary database directly.',
      aiSummary: 'Direct DB query pattern adopted for auth revocations to prevent 200ms edge lag during token invalidation.',
      aiGrounding: true,
      uploadedBy: 'Alex Chen',
      createdAt: '2026-11-07T11:45:00Z',
    },
    {
      id: 'doc-2',
      projectId: 'proj-apollo-9',
      title: 'ADR-014: Type-Safe Prisma Migration Rationale',
      fileName: 'ADR-014-Prisma.md',
      fileType: 'text/markdown',
      fileSize: '14 KB',
      category: 'TECHNICAL_DECISION',
      content: 'Evaluated TypeORM vs Prisma 6 benchmarks across multi-tenant database partitions. Prisma was selected for compile-time client safety, automated migration histories, and strongly-typed connection pooling.',
      aiSummary: 'Standardized all database schema definitions on Prisma ORM for compile-time safety and migration tracking.',
      aiGrounding: true,
      uploadedBy: 'Alex Chen',
      createdAt: '2026-11-02T14:30:00Z',
    },
    {
      id: 'doc-3',
      projectId: 'proj-apollo-9',
      title: 'Departing Architect Knowledge Transfer Sync #1',
      fileName: 'handover-sync-audio-transcript.txt',
      fileType: 'text/plain',
      fileSize: '48 KB',
      category: 'MEETING_MINUTES',
      content: 'Alex Chen: We have a legacy staging box where /etc/cron.d/gh-secret-sync rotates the HMAC webhook keys. It is not currently defined in Terraform. Sarah Connor: That is a critical single point of failure. Priya, please codify that in Terraform before Alex leaves.',
      aiSummary: 'Surfaced undocumented staging cron secret rotation script. Assigned codification in Terraform to Priya Sharma.',
      aiGrounding: true,
      uploadedBy: 'Sarah Connor',
      createdAt: '2026-11-08T16:00:00Z',
    },
  ],
  insights: [
    {
      id: 'ins-1',
      projectId: 'proj-apollo-9',
      category: 'TECHNICAL_DECISION',
      title: 'Bypassed Redis Cache for Session Invalidation due to Edge Concurrency',
      content: 'During commit refactoring, Alex Chen opted to query the primary PostgreSQL database directly rather than the distributed Redis cluster during token revocation to prevent stale read race conditions under multi-region replication.',
      severity: 'HIGH',
      confidenceScore: 0.94,
      isConflicting: false,
      status: 'NEEDS_REVIEW',
      evidence: [
        {
          id: 'ev-1',
          sourceType: 'GITHUB_COMMIT',
          sourceId: 'c8f49b1',
          sourceUrl: 'https://github.com/acme-corp/apollo-core/commit/c8f49b1',
          sourceTitle: 'fix(auth): direct db fallback on token revoke',
          relevanceScore: 0.96,
          excerpt: '// Bypassing redis cache cluster lookup due to 200ms replica lag during revocation events in eu-central.',
        },
      ],
      createdAt: '2026-11-09T18:00:00Z',
    },
    {
      id: 'ins-2',
      projectId: 'proj-apollo-9',
      category: 'HIDDEN_DEPENDENCY',
      title: 'Undocumented dependency on external Webhook Secret rotating script',
      content: 'The production webhook dispatcher relies on an external cron job located at /etc/cron.d/gh-secret-sync on a legacy staging box. There is no automated Terraform/Ansible configuration for this in the primary repository.',
      severity: 'CRITICAL',
      confidenceScore: 0.88,
      isConflicting: true,
      conflictDetails: 'PR #42 description claims webhook secrets are managed automatically via HashiCorp Vault, but commit 9a11ef explicitly binds to local cron file.',
      status: 'NEEDS_REVIEW',
      evidence: [
        {
          id: 'ev-2',
          sourceType: 'GITHUB_PR',
          sourceId: 'PR #42',
          sourceUrl: 'https://github.com/acme-corp/apollo-core/pull/42',
          sourceTitle: 'PR #42: Webhook pipeline updates',
          relevanceScore: 0.85,
          excerpt: 'Configured automated webhook verification headers.',
        },
      ],
      createdAt: '2026-11-09T18:00:00Z',
    },
    {
      id: 'ins-3',
      projectId: 'proj-apollo-9',
      category: 'UNFINISHED_TASK',
      title: 'Kafka Consumer Partition Rebalancing Edge Case Unhandled',
      content: 'PR #42 and Issue #104 confirm that heavy consumer partition rebalancing under sustained 50k req/s traffic spikes triggers cascade heartbeat timeouts.',
      severity: 'HIGH',
      confidenceScore: 0.92,
      isConflicting: false,
      status: 'NEEDS_REVIEW',
      evidence: [
        {
          id: 'ev-3',
          sourceType: 'GITHUB_ISSUE',
          sourceId: 'Issue #104',
          sourceUrl: 'https://github.com/acme-corp/apollo-core/issues/104',
          sourceTitle: 'Kafka consumer group rebalance timeout under sustained traffic',
          relevanceScore: 0.93,
          excerpt: 'Assigned to @alex-chen: Need to run 4-hour soak test before merging patch.',
        },
      ],
      createdAt: '2026-11-09T18:00:00Z',
    },
    {
      id: 'ins-4',
      projectId: 'proj-apollo-9',
      category: 'KNOWLEDGE_GAP',
      title: 'Single-source ownership of Data Export Sanitization Pipeline',
      content: 'Over 88% of code lines in /src/workers/sanitizer.ts were authored exclusively by Alex Chen with zero peer reviews from other active team members.',
      severity: 'HIGH',
      confidenceScore: 0.98,
      isConflicting: false,
      status: 'APPROVED',
      evidence: [
        {
          id: 'ev-4',
          sourceType: 'GITHUB_COMMIT',
          sourceId: '4a3e21c',
          sourceUrl: 'https://github.com/acme-corp/apollo-core/commit/4a3e21c',
          sourceTitle: 'feat(sanitizer): initial GDPR masking pipeline for export requests',
          relevanceScore: 0.95,
          excerpt: 'Export data transformer with SHA-256 pseudonymization.',
        },
      ],
      createdAt: '2026-11-09T18:00:00Z',
    },
  ],
  meetings: [
    {
      id: 'meet-1',
      projectId: 'proj-apollo-9',
      title: 'Departing Architect Handover Sync #1: Infrastructure & Auth',
      date: 'Yesterday (Nov 8, 2026)',
      duration: '50 mins',
      attendees: ['Alex Chen (Departing)', 'Priya Sharma (Incoming Lead)', 'Sarah Connor (EM)'],
      summary: 'Walked through direct DB session revocation logic, Postgres failover steps, and revealed undocumented staging cron job for rotating webhook HMAC keys.',
      decisions: [
        'Decided to deprecate legacy staging cron and codify secret rotation directly into Terraform / Vault.',
        'Priya will pair with Alex on Thursday to verify Kafka consumer partition rebalancing patch.',
      ],
      actionItems: [
        { task: 'Export staging cron script /etc/cron.d/gh-secret-sync to GitHub PR', assignee: 'Alex Chen', done: true },
        { task: 'Test synthetic 50k req/s load on Kafka group rebalancing branch', assignee: 'David Kim', done: false },
      ],
    },
    {
      id: 'meet-2',
      projectId: 'proj-apollo-9',
      title: 'Q4 Architecture Review & Prisma Migration ADR Sign-off',
      date: 'Nov 2, 2026',
      duration: '45 mins',
      attendees: ['Alex Chen', 'Sarah Connor', 'David Kim'],
      summary: 'Formal evaluation of TypeORM bottlenecks vs Prisma 6 client benchmarks for multi-tenant database partitioning.',
      decisions: [
        'Approved ADR-014 to standardize all new microservices on Prisma ORM.',
        'Scheduled legacy service schema migration for Q1 2027.',
      ],
      actionItems: [
        { task: 'Merge Prisma schema base models into main branch', assignee: 'Alex Chen', done: true },
      ],
    },
  ],
  timeline: [
    {
      id: 'evt-1',
      projectId: 'proj-apollo-9',
      type: 'COMMIT',
      title: 'refactor(auth): direct db fallback on token revoke',
      desc: 'Bypassing cluster redis key lookup due to replica lag in multi-region deployments.',
      author: 'Alex Chen',
      authorRole: 'Principal Backend Architect',
      occurredAt: 'Today, 6:15 PM (2h ago)',
      sourceUrl: 'https://github.com/acme-corp/apollo-core/commit/c8f49b1',
      sourceType: 'Commit c8f49b1',
      aiLinked: true,
      aiInsightTitle: 'Bypassed Redis Cache for Session Invalidation due to Edge Concurrency',
    },
    {
      id: 'evt-2',
      projectId: 'proj-apollo-9',
      type: 'PULL_REQUEST',
      title: 'PR #42: Webhook pipeline updates merged into main',
      desc: 'Added webhook notification queues with HMAC-SHA256 signature verification and exponential retry backoff.',
      author: 'Priya Sharma',
      authorRole: 'Senior Full Stack Engineer',
      occurredAt: 'Today, 3:30 PM (5h ago)',
      sourceUrl: 'https://github.com/acme-corp/apollo-core/pull/42',
      sourceType: 'PR #42',
      aiLinked: true,
      aiInsightTitle: 'Undocumented dependency on external Webhook Secret rotating script',
    },
    {
      id: 'evt-3',
      projectId: 'proj-apollo-9',
      type: 'MEETING',
      title: 'Departing Architect Handover Sync #1',
      desc: 'Technical walkthrough of Kafka partition balancing, secret rotation, and deployment runbooks with incoming lead.',
      author: 'Sarah Connor',
      authorRole: 'Project Lead',
      occurredAt: 'Yesterday, 2:00 PM',
      sourceUrl: '/dashboard/projects/proj-apollo-9/meetings',
      sourceType: 'Meeting Transcript',
      aiLinked: true,
      aiInsightTitle: 'Assigned successor to Kafka consumer soak testing',
    },
    {
      id: 'evt-4',
      projectId: 'proj-apollo-9',
      type: 'DOCUMENT',
      title: 'Uploaded Q4 Architecture RFC & Topology Spec',
      desc: 'Detailed network diagram showing multi-AZ PostgreSQL read-replicas and Kafka partition strategies.',
      author: 'Alex Chen',
      authorRole: 'Principal Backend Architect',
      occurredAt: 'Nov 7, 2026',
      sourceUrl: '/dashboard/projects/proj-apollo-9/knowledge',
      sourceType: 'RFC-402-Topology.pdf',
      aiLinked: false,
    },
    {
      id: 'evt-5',
      projectId: 'proj-apollo-9',
      type: 'ISSUE',
      title: 'Issue #104: Kafka consumer group rebalance timeout under sustained traffic',
      desc: 'During partition reassignment, consumers fail heartbeat checks causing cascade rebalances.',
      author: 'David Kim',
      authorRole: 'DevOps / SRE Lead',
      occurredAt: 'Nov 6, 2026',
      sourceUrl: 'https://github.com/acme-corp/apollo-core/issues/104',
      sourceType: 'Issue #104',
      aiLinked: true,
      aiInsightTitle: 'Kafka Consumer Partition Rebalancing Edge Case Unhandled',
    },
    {
      id: 'evt-6',
      projectId: 'proj-apollo-9',
      type: 'DECISION',
      title: 'Technical Decision: Adopt Prisma for Type-Safe Multi-Tenant Schemas',
      desc: 'Migrated from TypeORM to Prisma 6 to enforce compile-time client safety across services.',
      author: 'Alex Chen',
      authorRole: 'Principal Backend Architect',
      occurredAt: 'Nov 2, 2026',
      sourceUrl: '/dashboard/projects/proj-apollo-9/knowledge',
      sourceType: 'ADR-014',
      aiLinked: true,
      aiInsightTitle: 'Schema migration dependency on custom Prisma binary extensions',
    },
  ],
  notifications: [
    {
      id: 'n1',
      projectId: 'proj-apollo-9',
      title: 'Handover Report Draft Ready for Lead Review',
      message: 'Gemini AI reconstructed insights for departing member Alex Chen. Approval required before publishing.',
      type: 'HANDOVER_STATUS',
      time: '15 mins ago',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      read: false,
      link: '/dashboard/projects/proj-apollo-9/handover',
    },
    {
      id: 'n2',
      projectId: 'proj-apollo-9',
      title: 'Contradiction Flagged in Webhook Secrets Architecture',
      message: 'Conflict detected between PR #42 (Vault claim) and Commit 9a11ef (local cron reference).',
      type: 'ANALYSIS_ALERT',
      time: '2 hours ago',
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      read: false,
      link: '/dashboard/projects/proj-apollo-9/analysis',
    },
    {
      id: 'n3',
      projectId: 'proj-apollo-9',
      title: 'GitHub Commits Synced from acme-corp/apollo-core',
      message: '25 new commits and 2 pull requests ingested into the Unified Project Timeline.',
      type: 'GITHUB_SYNC',
      time: '5 hours ago',
      createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
      read: true,
      link: '/dashboard/projects/proj-apollo-9/timeline',
    },
    {
      id: 'n4',
      projectId: 'proj-apollo-9',
      title: 'Successor Transition Task Assigned',
      message: 'David Kim was assigned to soak-test the Kafka consumer partition rebalancing patch (Issue #104).',
      type: 'TASK_ASSIGNED',
      time: '1 day ago',
      createdAt: new Date(Date.now() - 1440 * 60000).toISOString(),
      read: true,
      link: '/dashboard/projects/proj-apollo-9/risks',
    },
  ],
  handovers: [
    {
      projectId: 'proj-apollo-9',
      status: 'IN_REVIEW',
      leadNotes: 'Ensure Terraform codification for staging secret rotation cron is verified before Nov 14.',
      transitionSteps: [
        {
          id: 'step-1',
          task: 'Record 45-min deep dive on Webhook key rotation and codify in Terraform',
          owner: 'Priya Sharma',
          done: true,
        },
        {
          id: 'step-2',
          task: 'Pair-program on Kafka consumer soak test patch (Issue #104)',
          owner: 'David Kim',
          done: false,
        },
        {
          id: 'step-3',
          task: 'Transfer repository Owner permissions on GitHub & npm organization',
          owner: 'Sarah Connor',
          done: true,
        },
        {
          id: 'step-4',
          task: 'Complete permission-aware handover report publication for executive signoff',
          owner: 'Sarah Connor',
          done: false,
        },
      ],
    },
  ],
  shareLinks: [],
  teamMessages: [],
  geminiApiKey: '',
};

function mergeWithInitialData(parsed: Partial<DataStore>): DataStore {
  return {
    ...INITIAL_DATA,
    ...parsed,
    notifications: parsed.notifications ?? INITIAL_DATA.notifications,
    handovers: parsed.handovers ?? INITIAL_DATA.handovers,
    shareLinks: parsed.shareLinks ?? INITIAL_DATA.shareLinks,
    teamMessages: parsed.teamMessages ?? INITIAL_DATA.teamMessages,
  };
}

function writeLocalFallback(data: DataStore): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Write to store path skipped/failed cleanly:', err);
  }
}

function readStore(): DataStore {
  if ((IS_EPHEMERAL || USE_BLOB) && globalForStore.__exOfficioStoreCache) {
    return globalForStore.__exOfficioStoreCache;
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      const cloned: DataStore = JSON.parse(JSON.stringify(INITIAL_DATA));
      globalForStore.__exOfficioStoreCache = cloned;
      writeLocalFallback(cloned);
      return cloned;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const merged = mergeWithInitialData(parsed);
    globalForStore.__exOfficioStoreCache = merged;
    return merged;
  } catch (err) {
    console.warn('Store file unavailable, using in-memory store:', err);
    if (!globalForStore.__exOfficioStoreCache) {
      globalForStore.__exOfficioStoreCache = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return globalForStore.__exOfficioStoreCache!;
  }
}

function writeStore(data: DataStore): void {
  globalForStore.__exOfficioStoreCache = data;
  writeLocalFallback(data);
}

async function flushToBlob(data: DataStore): Promise<void> {
  const res = await putBlob(BLOB_PATH, JSON.stringify(data), {
    access: 'private',
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  const maybeEtag = (res as { etag?: string }).etag;
  globalForStore.__exOfficioBlobEtag = typeof maybeEtag === 'string' ? maybeEtag : undefined;
}

export const store = {
  ready: async (): Promise<void> => {
    if (!USE_BLOB) return;
    if (globalForStore.__exOfficioPendingReady) {
      await globalForStore.__exOfficioPendingReady;
      return;
    }
    const pending = (async () => {
      try {
        const res = await getBlob(BLOB_PATH, {
          access: 'private',
          useCache: false,
          ...(globalForStore.__exOfficioBlobEtag && globalForStore.__exOfficioStoreCache
            ? { ifNoneMatch: globalForStore.__exOfficioBlobEtag }
            : {}),
        });
        if (res === null) {
          const initial = readStore();
          await flushToBlob(initial);
          return;
        }
        if (res.statusCode === 200 && res.stream) {
          const text = await new Response(res.stream).text();
          const parsed = JSON.parse(text);
          const merged = mergeWithInitialData(parsed);
          globalForStore.__exOfficioStoreCache = merged;
          globalForStore.__exOfficioBlobEtag = res.blob.etag;
          writeLocalFallback(merged);
        }
      } catch (err) {
        console.warn('Blob store ready fallback used:', err);
        readStore();
      } finally {
        globalForStore.__exOfficioPendingReady = undefined;
      }
    })();
    globalForStore.__exOfficioPendingReady = pending;
    await pending;
  },
  flush: async (): Promise<void> => {
    if (!USE_BLOB) return;
    const snapshot = readStore();
    const task = (globalForStore.__exOfficioPendingFlush ?? Promise.resolve()).then(async () => {
      try {
        await flushToBlob(snapshot);
      } catch (err) {
        console.warn('Blob store flush failed cleanly:', err);
      }
    });
    globalForStore.__exOfficioPendingFlush = task;
    await task;
  },
  // Users
  getUsers: (): StoredUser[] => readStore().users,
  findUserByEmail: (email: string): StoredUser | undefined => {
    return readStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  updateUserName: (email: string, name: string): void => {
    const data = readStore();
    const u = data.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (u) {
      u.name = name;
      writeStore(data);
    }
  },
  createUser: (user: Omit<StoredUser, 'id' | 'createdAt'>): StoredUser => {
    const data = readStore();
    const newUser: StoredUser = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    writeStore(data);
    return newUser;
  },

  // Projects
  getProjects: (): StoredProject[] => readStore().projects,
  getProjectById: (id: string): StoredProject | undefined => {
    return readStore().projects.find((p) => p.id === id || p.slug === id) || readStore().projects[0];
  },
  createProject: (proj: Omit<StoredProject, 'id' | 'lastSyncedAt'>): StoredProject => {
    const data = readStore();
    const id = `proj-${Date.now()}`;
    const newProject: StoredProject = {
      ...proj,
      id,
      lastSyncedAt: 'Just now',
      departingMember: {
        ...proj.departingMember,
        avatar:
          proj.departingMember.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      },
    };
    data.projects.unshift(newProject);
    data.handovers.push({
      projectId: id,
      status: 'IN_REVIEW',
      transitionSteps: [
        { id: `step-${Date.now()}-1`, task: 'Complete knowledge base documentation upload', owner: 'Team Lead', done: false },
        { id: `step-${Date.now()}-2`, task: 'Approve AI insights and publish report', owner: 'Project Lead', done: false },
      ],
    });
    writeStore(data);
    return newProject;
  },
  updateProjectSync: (projectId: string): void => {
    const data = readStore();
    const p = data.projects.find((proj) => proj.id === projectId);
    if (p) {
      p.lastSyncedAt = 'Just now';
      writeStore(data);
    }
  },

  // Documents - cascades to Timeline, AI Insights, and Notifications!
  getDocuments: (projectId?: string): StoredDocument[] => {
    const docs = readStore().documents;
    return projectId ? docs.filter((d) => d.projectId === projectId) : docs;
  },
  getDocumentById: (id: string): StoredDocument | undefined => {
    return readStore().documents.find((d) => d.id === id);
  },
  addDocument: (doc: Omit<StoredDocument, 'id' | 'createdAt'>): StoredDocument => {
    const data = readStore();
    const now = Date.now();
    const newDoc: StoredDocument = {
      ...doc,
      id: `doc-${now}`,
      createdAt: new Date().toISOString(),
    };
    data.documents.unshift(newDoc);

    // 1. Push TimelineEvent so Unified Timeline updates automatically
    const timelineEvt: StoredTimelineEvent = {
      id: `evt-${now}`,
      projectId: doc.projectId,
      type: 'DOCUMENT',
      title: `Uploaded: ${doc.title}`,
      desc: (doc.aiSummary || doc.content).slice(0, 180),
      author: doc.uploadedBy,
      authorRole: 'Contributor',
      occurredAt: 'Just now',
      sourceType: doc.fileName,
      sourceUrl: `/dashboard/projects/${doc.projectId}/knowledge`,
      aiLinked: true,
      aiInsightTitle: doc.title,
    };
    data.timeline.unshift(timelineEvt);

    // 2. Push grounded AIInsight so Dashboard Overview, AI Reconstruction, Risks & Handover update automatically!
    const insightCategory: StoredInsight['category'] =
      doc.category === 'BUG_FIX'
        ? 'UNFINISHED_TASK'
        : doc.category === 'ARCHITECTURE'
        ? 'HIDDEN_DEPENDENCY'
        : 'TECHNICAL_DECISION';

    const newInsight: StoredInsight = {
      id: `ins-doc-${now}`,
      projectId: doc.projectId,
      category: insightCategory,
      title: `Ingested Knowledge: ${doc.title}`,
      content: doc.aiSummary || doc.content.slice(0, 220),
      severity: doc.category === 'BUG_FIX' || doc.category === 'ARCHITECTURE' ? 'HIGH' : 'MEDIUM',
      confidenceScore: 0.93,
      isConflicting: false,
      status: 'NEEDS_REVIEW',
      createdAt: new Date().toISOString(),
      evidence: [
        {
          id: `ev-${now}`,
          sourceType: 'DOCUMENT',
          sourceId: doc.fileName,
          sourceUrl: `/dashboard/projects/${doc.projectId}/knowledge`,
          sourceTitle: doc.title,
          relevanceScore: 0.96,
          excerpt: doc.content.slice(0, 180),
        },
      ],
    };
    data.insights.unshift(newInsight);

    // 3. Push Notification so Notification Center & Header badge update automatically
    data.notifications.unshift({
      id: `notif-${now}`,
      projectId: doc.projectId,
      title: `Document Ingested & Summarized: ${doc.title}`,
      message: `${doc.uploadedBy} uploaded ${doc.fileName} (${doc.fileSize}). Gemini AI generated a new ${insightCategory.replace('_', ' ').toLowerCase()} insight linked to this artifact.`,
      type: 'DOCUMENT_UPLOAD',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      link: `/dashboard/projects/${doc.projectId}/knowledge`,
    });

    // 4. Touch project sync time
    const proj = data.projects.find((p) => p.id === doc.projectId);
    if (proj) proj.lastSyncedAt = 'Just now';

    writeStore(data);
    return newDoc;
  },
  updateDocumentSummary: (id: string, aiSummary: string): StoredDocument | null => {
    const data = readStore();
    const doc = data.documents.find((d) => d.id === id);
    if (!doc) return null;
    doc.aiSummary = aiSummary;
    doc.aiGrounding = true;

    // Also keep any matching insight updated
    const matchingInsight = data.insights.find((ins) =>
      ins.evidence.some((e) => e.sourceId === doc.fileName || e.sourceTitle === doc.title)
    );
    if (matchingInsight) {
      matchingInsight.content = aiSummary;
    }

    writeStore(data);
    return doc;
  },

  // Insights
  getInsights: (projectId?: string): StoredInsight[] => {
    const list = readStore().insights;
    return projectId ? list.filter((i) => i.projectId === projectId) : list;
  },
  updateInsightStatus: (id: string, status: 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED'): StoredInsight | null => {
    const data = readStore();
    const ins = data.insights.find((i) => i.id === id);
    if (!ins) return null;
    ins.status = status;
    writeStore(data);
    return ins;
  },
  replaceOrMergeInsights: (projectId: string, newInsights: StoredInsight[]): StoredInsight[] => {
    const data = readStore();
    const existingIds = new Set(data.insights.map((i) => i.id));
    const additions = newInsights.filter((ni) => !existingIds.has(ni.id));
    data.insights = [...additions, ...data.insights];
    writeStore(data);
    return data.insights.filter((i) => i.projectId === projectId);
  },
  addInsight: (ins: Omit<StoredInsight, 'id' | 'createdAt'>): StoredInsight => {
    const data = readStore();
    const newIns: StoredInsight = {
      ...ins,
      id: `ins-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.insights.unshift(newIns);
    writeStore(data);
    return newIns;
  },

  // Meetings
  getMeetings: (projectId?: string): StoredMeeting[] => {
    const list = readStore().meetings;
    return projectId ? list.filter((m) => m.projectId === projectId) : list;
  },
  addMeeting: (meeting: Omit<StoredMeeting, 'id'>): StoredMeeting => {
    const data = readStore();
    const now = Date.now();
    const newMeeting: StoredMeeting = {
      ...meeting,
      id: `meet-${now}`,
    };
    data.meetings.unshift(newMeeting);

    data.timeline.unshift({
      id: `evt-${now}`,
      projectId: meeting.projectId,
      type: 'MEETING',
      title: meeting.title,
      desc: meeting.summary,
      author: meeting.attendees[0] || 'Team',
      authorRole: 'Meeting Sync',
      occurredAt: 'Just now',
      sourceType: 'Meeting Minutes',
      sourceUrl: `/dashboard/projects/${meeting.projectId}/meetings`,
      aiLinked: true,
      aiInsightTitle: meeting.decisions[0] || meeting.title,
    });

    data.notifications.unshift({
      id: `notif-${now}`,
      projectId: meeting.projectId,
      title: `Meeting Notes Logged: ${meeting.title}`,
      message: `${meeting.decisions.length} decisions and ${meeting.actionItems.length} action items extracted.`,
      type: 'HANDOVER_STATUS',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      link: `/dashboard/projects/${meeting.projectId}/meetings`,
    });

    writeStore(data);
    return newMeeting;
  },
  toggleMeetingActionItem: (meetingId: string, itemIndex: number): StoredMeeting | null => {
    const data = readStore();
    const m = data.meetings.find((mt) => mt.id === meetingId);
    if (!m || !m.actionItems[itemIndex]) return null;
    m.actionItems[itemIndex].done = !m.actionItems[itemIndex].done;
    writeStore(data);
    return m;
  },

  // Timeline
  getTimeline: (projectId?: string): StoredTimelineEvent[] => {
    const list = readStore().timeline;
    return projectId ? list.filter((t) => t.projectId === projectId) : list;
  },
  addTimelineEvent: (evt: Omit<StoredTimelineEvent, 'id'>): StoredTimelineEvent => {
    const data = readStore();
    const newEvt: StoredTimelineEvent = {
      ...evt,
      id: `evt-${Date.now()}`,
    };
    data.timeline.unshift(newEvt);
    writeStore(data);
    return newEvt;
  },

  // Notifications
  getNotifications: (projectId?: string): StoredNotification[] => {
    const list = readStore().notifications;
    return projectId ? list.filter((n) => n.projectId === projectId) : list;
  },
  addNotification: (n: Omit<StoredNotification, 'id' | 'createdAt'>): StoredNotification => {
    const data = readStore();
    const notif: StoredNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notif);
    writeStore(data);
    return notif;
  },
  markNotificationRead: (id?: string): StoredNotification[] => {
    const data = readStore();
    data.notifications = data.notifications.map((n) =>
      !id || n.id === id ? { ...n, read: true } : n
    );
    writeStore(data);
    return data.notifications;
  },

  // Handover State & Publishing
  getHandoverState: (projectId: string): StoredHandoverState => {
    const data = readStore();
    const found = data.handovers.find((h) => h.projectId === projectId);
    if (found) return found;
    return {
      projectId,
      status: 'IN_REVIEW',
      transitionSteps: INITIAL_DATA.handovers[0].transitionSteps,
    };
  },
  publishHandover: (
    projectId: string,
    publishedBy: string,
    status: 'PUBLISHED' | 'IN_REVIEW' = 'PUBLISHED',
    leadNotes?: string
  ): StoredHandoverState => {
    const data = readStore();
    let handover = data.handovers.find((h) => h.projectId === projectId);
    if (!handover) {
      handover = {
        projectId,
        status,
        transitionSteps: INITIAL_DATA.handovers[0].transitionSteps,
      };
      data.handovers.push(handover);
    }
    handover.status = status;
    handover.publishedAt = status === 'PUBLISHED' ? new Date().toISOString() : undefined;
    handover.publishedBy = publishedBy;
    if (leadNotes !== undefined) handover.leadNotes = leadNotes;

    const now = Date.now();
    if (status === 'PUBLISHED') {
      // Auto-approve all pending insights or mark project handover progress
      data.timeline.unshift({
        id: `evt-${now}`,
        projectId,
        type: 'DECISION',
        title: `Approved & Published Official Handover Dossier`,
        desc: `Project Lead ${publishedBy} approved insights and published the permission-aware handover dossier for incoming engineers.`,
        author: publishedBy,
        authorRole: 'Project Lead',
        occurredAt: 'Just now',
        sourceType: 'Handover Report',
        sourceUrl: `/dashboard/projects/${projectId}/handover`,
        aiLinked: true,
      });

      data.notifications.unshift({
        id: `notif-${now}`,
        projectId,
        title: 'Official Handover Report Published',
        message: `${publishedBy} has finalized and published the continuity dossier. Incoming team members can now access the report.`,
        type: 'HANDOVER_STATUS',
        time: 'Just now',
        createdAt: new Date().toISOString(),
        read: false,
        link: `/dashboard/projects/${projectId}/handover`,
      });
    }

    writeStore(data);
    return handover;
  },
  toggleTransitionStep: (projectId: string, stepId: string): StoredHandoverState => {
    const data = readStore();
    let handover = data.handovers.find((h) => h.projectId === projectId);
    if (!handover) {
      handover = {
        projectId,
        status: 'IN_REVIEW',
        transitionSteps: JSON.parse(JSON.stringify(INITIAL_DATA.handovers[0].transitionSteps)),
      };
      data.handovers.push(handover);
    }
    const step = handover.transitionSteps.find((s) => s.id === stepId);
    if (step) {
      step.done = !step.done;
    }
    writeStore(data);
    return handover;
  },

  // Share Access Links
  createShareLink: (input: Omit<StoredShareLink, 'token' | 'createdAt'>): StoredShareLink => {
    const data = readStore();
    const createdAt = new Date().toISOString();
    const payload = {
      p: input.projectId,
      r: input.accessRole,
      s: input.redactSecrets ? 1 : 0,
      e: input.expiresInDays,
      c: input.createdBy,
      t: createdAt,
      n: Math.random().toString(36).slice(2, 8),
    };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(encoded)
      .digest('base64url')
      .slice(0, 24);
    const link: StoredShareLink = {
      ...input,
      token: `exs-${encoded}.${sig}`,
      createdAt,
    };
    data.shareLinks.unshift(link);
    data.notifications.unshift({
      id: `notif-${Date.now()}`,
      projectId: input.projectId,
      title: `Permission-Aware Report Access Shared (${input.accessRole})`,
      message: `${input.createdBy} generated a ${input.redactSecrets ? 'secret-redacted ' : ''}handover link valid for ${input.expiresInDays} days.`,
      type: 'HANDOVER_STATUS',
      time: 'Just now',
      createdAt,
      read: false,
      link: `/dashboard/projects/${input.projectId}/handover`,
    });
    writeStore(data);
    return link;
  },
  getShareLinks: (projectId: string): StoredShareLink[] => {
    return readStore().shareLinks.filter((s) => s.projectId === projectId);
  },
  getShareLinkByToken: (token: string): StoredShareLink | undefined => {
    if (token.startsWith('exs-')) {
      const raw = token.slice(4);
      const dotIdx = raw.lastIndexOf('.');
      if (dotIdx > 0) {
        const encoded = raw.slice(0, dotIdx);
        const sig = raw.slice(dotIdx + 1);
        const expectedSig = crypto
          .createHmac('sha256', AUTH_SECRET)
          .update(encoded)
          .digest('base64url')
          .slice(0, 24);
        const sigBuf = Buffer.from(sig);
        const expectedBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          try {
            const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
            const createdMs = Date.parse(parsed.t);
            const expiresMs = createdMs + (Number(parsed.e) || 14) * 24 * 60 * 60 * 1000;
            if (!Number.isNaN(createdMs) && Date.now() <= expiresMs) {
              return {
                token,
                projectId: String(parsed.p),
                accessRole: parsed.r,
                redactSecrets: Boolean(parsed.s),
                expiresInDays: Number(parsed.e) || 14,
                createdBy: String(parsed.c || 'Sarah Connor'),
                createdAt: String(parsed.t),
              };
            }
            return undefined;
          } catch {
            // Fall through to array lookup if malformed
          }
        }
      }
    }
    return readStore().shareLinks.find((s) => s.token === token);
  },

  // Team Contact Messages
  getTeamMessages: (projectId: string): StoredTeamMessage[] => {
    return readStore().teamMessages.filter((m) => m.projectId === projectId);
  },
  addTeamMessage: (msg: Omit<StoredTeamMessage, 'id' | 'createdAt'>): StoredTeamMessage => {
    const data = readStore();
    const now = Date.now();
    const created: StoredTeamMessage = {
      ...msg,
      id: `msg-${now}`,
      createdAt: new Date().toISOString(),
    };
    data.teamMessages.unshift(created);

    data.notifications.unshift({
      id: `notif-${now}`,
      projectId: msg.projectId,
      title: `Handover Outreach Sent to ${msg.toMember}`,
      message: `${msg.fromUser} (${msg.channel}): "${msg.subject}" — ${msg.message.slice(0, 120)}`,
      type: 'TEAM_CONTACT',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      link: `/dashboard/projects/${msg.projectId}/team`,
    });

    data.timeline.unshift({
      id: `evt-${now}`,
      projectId: msg.projectId,
      type: 'MEETING',
      title: `Contacted ${msg.toMember}: ${msg.subject}`,
      desc: msg.message,
      author: msg.fromUser,
      authorRole: 'Team Coordination',
      occurredAt: 'Just now',
      sourceType: msg.toEmail,
      sourceUrl: `/dashboard/projects/${msg.projectId}/team`,
      aiLinked: false,
    });

    writeStore(data);
    return created;
  },

  // Runtime Settings / Gemini Key
  getGeminiKey: (): string => {
    return readStore().geminiApiKey || process.env.GEMINI_API_KEY || '';
  },
  setGeminiKey: (key: string): void => {
    const data = readStore();
    data.geminiApiKey = key.trim();
    writeStore(data);
  },
};
