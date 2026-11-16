import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Use Node 22+ built-in SQLite engine
// eslint-disable-next-line @typescript-eslint/no-require-imports
let DatabaseSync: any = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (err) {
  console.warn('node:sqlite is not natively available in this runtime:', err);
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'PROJECT_LEAD' | 'MEMBER';
  avatar?: string;
  employeeId: string;
  clearanceBadge: string;
  teamId: string;
  subTeamId: string;
  workHoursWeekly: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  createdAt: string;
}

export interface DbTeam {
  id: string;
  name: string;
  description: string;
  leadId: string;
  createdAt: string;
}

export interface DbSubTeam {
  id: string;
  teamId: string;
  name: string;
  description: string;
  leadId: string;
  createdAt: string;
}

export interface DbProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'ACTIVE' | 'HANDOVER_IN_PROGRESS' | 'COMPLETED';
  techStack: string[];
  repoOwner: string;
  repoName: string;
  teamId: string;
  subTeamId: string;
  isExclusive: boolean;
  creatorUserId?: string;
  lastSyncedAt: string;
  departingMember: {
    name: string;
    role: string;
    leavingDate: string;
    avatar?: string;
    criticalOwnership: string;
    successor?: string;
    tenure?: string;
  };
  createdAt: string;
}

export interface DbProjectMember {
  projectId: string;
  userId: string;
  role: 'OWNER' | 'LEAD' | 'CONTRIBUTOR' | 'VIEWER';
  hoursLogged: number;
  joinedAt: string;
}

export interface DbDocument {
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

export interface DbInsight {
  id: string;
  projectId: string;
  category: string;
  title: string;
  content: string;
  severity: string;
  confidenceScore: number;
  isConflicting: boolean;
  conflictDetails?: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
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

export interface DbHandoverQuestion {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: 'ANSWERED' | 'PENDING';
  createdAt: string;
}

export interface DbWorkLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  projectId: string;
  projectName: string;
  hours: number;
  taskDescription: string;
  logDate: string;
  createdAt: string;
}

export interface DbMeeting {
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

export interface DbTimelineEvent {
  id: string;
  projectId: string;
  type: string;
  title: string;
  desc: string;
  author: string;
  authorRole: string;
  occurredAt: string;
  sourceUrl?: string;
  sourceType: string;
  aiLinked: boolean;
}

export interface DbNotification {
  id: string;
  projectId: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  time: string;
  createdAt: string;
  read: boolean;
  link: string;
}

export interface DbHandoverState {
  projectId: string;
  status: 'IN_REVIEW' | 'PUBLISHED';
  publishedAt?: string;
  publishedBy?: string;
  leadNotes?: string;
  transitionSteps: Array<{
    id: string;
    task: string;
    owner: string;
    done: boolean;
  }>;
}

export interface DbShareLink {
  token: string;
  projectId: string;
  createdBy: string;
  accessRole: 'INCOMING_LEAD' | 'TEAM_MEMBER' | 'EXECUTIVE_AUDITOR';
  redactSecrets: boolean;
  expiresInDays: number;
  createdAt: string;
}

export interface DbTeamMessage {
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

export const DEMO_EMAILS = new Set([
  'admin@exofficio.dev',
  'lead@exofficio.dev',
  'priya.sharma@acme.com',
  'alex.chen@acme.com',
  'demo@exofficio.dev',
]);

export const DEMO_USER_IDS = new Set([
  'usr-admin-01',
  'usr-lead-01',
  'usr-member-02',
  'usr-member-03',
  'usr-demo-01',
]);

export const DEMO_PROJECT_IDS = new Set([
  'proj-apollo-9',
  'proj-mercury-2',
  'proj-nexus-vault',
]);

export function isDemoAccount(userId?: string, email?: string): boolean {
  if (email && DEMO_EMAILS.has(email.toLowerCase().trim())) return true;
  if (userId && (DEMO_USER_IDS.has(userId) || userId.startsWith('usr-demo-') || userId.startsWith('demo-'))) return true;
  return false;
}

export function isDemoProject(projectId?: string): boolean {
  if (!projectId) return false;
  return DEMO_PROJECT_IDS.has(projectId);
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_DIR = isServerless ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'exofficio.db');

// Singleton SQLite connection
const globalForDb = globalThis as unknown as { __exOfficioSqliteDb?: any };

function getDbInstance() {
  if (globalForDb.__exOfficioSqliteDb) {
    return globalForDb.__exOfficioSqliteDb;
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data dir, using fallback:', err);
  }

  if (!DatabaseSync) {
    throw new Error('DatabaseSync from node:sqlite is required. Please ensure Node.js 22+ is used.');
  }

  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {
    console.warn('PRAGMA setup note:', e);
  }

  initSchema(db);
  seedInitialData(db);

  globalForDb.__exOfficioSqliteDb = db;
  return db;
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      avatar TEXT,
      employee_id TEXT NOT NULL DEFAULT 'EMP-1000',
      clearance_badge TEXT NOT NULL DEFAULT 'LEVEL_1_CONTRIBUTOR',
      team_id TEXT NOT NULL DEFAULT 'team-platform',
      sub_team_id TEXT NOT NULL DEFAULT 'sub-auth',
      work_hours_weekly INTEGER NOT NULL DEFAULT 40,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      lead_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sub_teams (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      lead_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'HANDOVER_IN_PROGRESS',
      tech_stack TEXT NOT NULL,
      repo_owner TEXT NOT NULL,
      repo_name TEXT NOT NULL,
      team_id TEXT NOT NULL DEFAULT 'team-platform',
      sub_team_id TEXT NOT NULL DEFAULT 'sub-auth',
      is_exclusive INTEGER NOT NULL DEFAULT 1,
      creator_user_id TEXT,
      last_synced_at TEXT,
      departing_member_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
      hours_logged REAL NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      ai_summary TEXT,
      ai_grounding INTEGER NOT NULL DEFAULT 1,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      severity TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      is_conflicting INTEGER NOT NULL DEFAULT 0,
      conflict_details TEXT,
      status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
      evidence_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS handover_states (
      project_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'IN_REVIEW',
      published_at TEXT,
      published_by TEXT,
      lead_notes TEXT,
      transition_steps_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS handover_questions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      answered_by TEXT,
      answered_at TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      project_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      hours REAL NOT NULL,
      task_description TEXT NOT NULL,
      log_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      duration TEXT NOT NULL,
      attendees_json TEXT NOT NULL,
      summary TEXT NOT NULL,
      decisions_json TEXT NOT NULL,
      action_items_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT NOT NULL,
      author TEXT NOT NULL,
      author_role TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      source_url TEXT,
      source_type TEXT NOT NULL,
      ai_linked INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      link TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS share_links (
      token TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      access_role TEXT NOT NULL,
      redact_secrets INTEGER NOT NULL DEFAULT 1,
      expires_in_days INTEGER NOT NULL DEFAULT 14,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      to_member TEXT NOT NULL,
      to_email TEXT NOT NULL,
      from_user TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL,
      first_attempt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
    CREATE INDEX IF NOT EXISTS idx_project_members ON project_members(project_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_docs_project ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_insights_project ON insights(project_id);
    CREATE INDEX IF NOT EXISTS idx_questions_project ON handover_questions(project_id);
    CREATE INDEX IF NOT EXISTS idx_work_logs_user ON work_logs(user_id);
  `);

  try {
    db.exec('ALTER TABLE projects ADD COLUMN creator_user_id TEXT;');
  } catch {}
}

function seedInitialData(db: any) {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users;').get();
  if (countRow && countRow.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // 1. Teams
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, description, lead_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertTeam.run('team-platform', 'Platform Engineering', 'Core cloud platform, security infrastructure, distributed caching and microservices.', 'usr-admin-01', now);
  insertTeam.run('team-banking', 'Core Banking & Transactions', 'High-throughput transactional ledger, payment gateways, and real-time reconciliation.', 'usr-lead-01', now);
  insertTeam.run('team-data', 'Data & Analytics Engine', 'Streaming pipelines, ML knowledge graph, and regulatory data warehousing.', 'usr-lead-01', now);

  // 2. Sub-teams
  const insertSubTeam = db.prepare(`
    INSERT INTO sub_teams (id, team_id, name, description, lead_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSubTeam.run('sub-auth', 'team-platform', 'Auth & Identity Systems', 'Zero-trust authentication, NextAuth integration, session revocation.', 'usr-admin-01', now);
  insertSubTeam.run('sub-kafka', 'team-platform', 'Kafka & Streaming Bus', 'Event messaging clusters, dead letter queues, and consumer groups.', 'usr-member-02', now);
  insertSubTeam.run('sub-infra', 'team-platform', 'Cloud Infrastructure & SRE', 'Multi-region AWS ECS clusters, PostgreSQL replicas, failover runbooks.', 'usr-lead-01', now);
  insertSubTeam.run('sub-ledger', 'team-banking', 'Distributed Transaction Ledger', 'Double-entry bookkeeping engine, ACID settlement, audit trails.', 'usr-lead-01', now);
  insertSubTeam.run('sub-recon', 'team-banking', 'Audit & Compliance Engine', 'Automated balance reconciliation and GDPR pseudonymization.', 'usr-member-02', now);
  insertSubTeam.run('sub-ml', 'team-data', 'Knowledge Reconstruction AI', 'Gemini AI integration, document parsers, and institutional grounding.', 'usr-admin-01', now);

  // 3. Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, employee_id, clearance_badge, team_id, sub_team_id, work_hours_weekly, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    'usr-admin-01',
    'Sarah Connor',
    'admin@exofficio.dev',
    defaultPasswordHash,
    'ADMIN',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    'EMP-1001',
    'LEVEL_3_ADMIN',
    'team-platform',
    'sub-auth',
    40,
    'ACTIVE',
    now
  );
  insertUser.run(
    'usr-lead-01',
    'Sarah Connor',
    'lead@exofficio.dev',
    defaultPasswordHash,
    'PROJECT_LEAD',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    'EMP-1002',
    'LEVEL_2_LEAD',
    'team-banking',
    'sub-ledger',
    40,
    'ACTIVE',
    now
  );
  insertUser.run(
    'usr-member-02',
    'Alex Chen',
    'alex.chen@acme.com',
    defaultPasswordHash,
    'MEMBER',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    'EMP-1042',
    'LEVEL_2_ARCHITECT',
    'team-platform',
    'sub-kafka',
    40,
    'ACTIVE',
    now
  );
  insertUser.run(
    'usr-member-03',
    'Priya Sharma',
    'priya.sharma@acme.com',
    defaultPasswordHash,
    'MEMBER',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    'EMP-1088',
    'LEVEL_1_ENGINEER',
    'team-platform',
    'sub-kafka',
    40,
    'ACTIVE',
    now
  );
  insertUser.run(
    'usr-demo-01',
    'Demo Workspace User',
    'demo@exofficio.dev',
    defaultPasswordHash,
    'PROJECT_LEAD',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    'EMP-DEMO',
    'LEVEL_2_LEAD',
    'team-platform',
    'sub-auth',
    40,
    'ACTIVE',
    now
  );

  // 4. Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, slug, description, status, tech_stack, repo_owner, repo_name, team_id, sub_team_id, is_exclusive, last_synced_at, departing_member_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const apolloDeparting = JSON.stringify({
    name: 'Alex Chen',
    role: 'Principal Backend Architect',
    leavingDate: 'in 4 days (Nov 20, 2026)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    criticalOwnership: '82% of Auth & Kafka Modules',
    successor: 'Priya Sharma (Staff Eng)',
    tenure: '3 years 8 months',
  });

  const mercuryDeparting = JSON.stringify({
    name: 'None',
    role: 'N/A',
    leavingDate: 'N/A',
    avatar: '',
    criticalOwnership: 'Fully Distributed',
    successor: 'Team',
    tenure: '2 years',
  });

  const nexusDeparting = JSON.stringify({
    name: 'None',
    role: 'N/A',
    leavingDate: 'N/A',
    avatar: '',
    criticalOwnership: 'Fully Distributed',
    successor: 'Team',
    tenure: '1 year',
  });

  insertProject.run(
    'proj-apollo-9',
    'Apollo Core Platform',
    'apollo-core',
    'Distributed event-driven transaction gateway with PostgreSQL, Prisma, Kafka and NextAuth.js.',
    'HANDOVER_IN_PROGRESS',
    JSON.stringify(['TypeScript', 'Next.js', 'PostgreSQL', 'Prisma', 'Kafka']),
    'acme-corp',
    'apollo-core',
    'team-platform',
    'sub-auth',
    1,
    '12 mins ago',
    apolloDeparting,
    now
  );

  insertProject.run(
    'proj-mercury-2',
    'Mercury Mobile Client',
    'mercury-mobile',
    'React Native enterprise companion app for cross-platform logistics and inventory tracking.',
    'ACTIVE',
    JSON.stringify(['React Native', 'Expo', 'GraphQL', 'Tailwind']),
    'acme-corp',
    'mercury-mobile',
    'team-banking',
    'sub-ledger',
    1,
    '2 days ago',
    mercuryDeparting,
    now
  );

  insertProject.run(
    'proj-nexus-vault',
    'Nexus Identity Vault',
    'nexus-vault',
    'Zero-trust authorization server and multi-tenant credential manager with mTLS.',
    'ACTIVE',
    JSON.stringify(['Go', 'gRPC', 'PostgreSQL', 'Redis']),
    'acme-corp',
    'nexus-vault',
    'team-platform',
    'sub-infra',
    1,
    '5 days ago',
    nexusDeparting,
    now
  );

  // 5. Project Memberships
  const insertMember = db.prepare(`
    INSERT INTO project_members (project_id, user_id, role, hours_logged, joined_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  // Apollo members: Sarah Connor (Lead), Alex Chen (Departing), Priya Sharma (Successor), Demo user
  insertMember.run('proj-apollo-9', 'usr-admin-01', 'OWNER', 38, now);
  insertMember.run('proj-apollo-9', 'usr-lead-01', 'LEAD', 42, now);
  insertMember.run('proj-apollo-9', 'usr-member-02', 'CONTRIBUTOR', 128, now);
  insertMember.run('proj-apollo-9', 'usr-member-03', 'CONTRIBUTOR', 64, now);
  insertMember.run('proj-apollo-9', 'usr-demo-01', 'LEAD', 20, now);

  // Mercury members: Sarah Connor, Priya Sharma
  insertMember.run('proj-mercury-2', 'usr-admin-01', 'OWNER', 12, now);
  insertMember.run('proj-mercury-2', 'usr-lead-01', 'LEAD', 28, now);
  insertMember.run('proj-mercury-2', 'usr-member-03', 'CONTRIBUTOR', 34, now);

  // Nexus members: Sarah Connor, Alex Chen
  insertMember.run('proj-nexus-vault', 'usr-admin-01', 'OWNER', 16, now);
  insertMember.run('proj-nexus-vault', 'usr-member-02', 'CONTRIBUTOR', 52, now);

  // 6. Documents
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, project_id, title, file_name, file_type, file_size, category, content, ai_summary, ai_grounding, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDoc.run(
    'doc-arch-01',
    'proj-apollo-9',
    'Q4 Architecture Topology & Failover RFC',
    'apollo-topology-rfc.md',
    'text/markdown',
    '18.4 KB',
    'ARCHITECTURE',
    'Apollo Core uses multi-AZ PostgreSQL with read-replicas. Authentication session revokes write directly to the primary to circumvent replica lag.',
    'Detailed technical decision to route token revocations directly to the primary database to circumvent replica lag.',
    1,
    'Sarah Connor',
    now
  );
  insertDoc.run(
    'doc-runbook-02',
    'proj-apollo-9',
    'Kafka Consumer Rebalance Incident Playbook',
    'kafka-incident-runbook.md',
    'text/markdown',
    '12.1 KB',
    'BUG_FIX',
    'During sustained traffic spikes over 50,000 req/s, partition rebalancing triggers heartbeat timeouts. Increase session.timeout.ms to 30000.',
    'Provides manual steps for unsticking Kafka consumer groups under extreme load.',
    1,
    'Alex Chen',
    now
  );
  insertDoc.run(
    'doc-gdpr-03',
    'proj-apollo-9',
    'Data Retention & GDPR Sanitizer Specs',
    'gdpr-sanitizer-specs.pdf',
    'application/pdf',
    '44.2 KB',
    'TECHNICAL_DECISION',
    'GDPR sanitization runs nightly via /etc/cron.d/gdpr-sanitize. Processes transaction dumps using node stream transformers.',
    'Outlines the automated cron and Node.js stream pipeline that sanitizes transaction data for compliance.',
    1,
    'Alex Chen',
    now
  );

  // 7. Insights
  const insertInsight = db.prepare(`
    INSERT INTO insights (id, project_id, category, title, content, severity, confidence_score, is_conflicting, conflict_details, status, evidence_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInsight.run(
    'ins-auth-bypass',
    'proj-apollo-9',
    'TECHNICAL_DECISION',
    'Auth token revocation writes directly to primary DB',
    'Alex Chen configured a direct database connection pool that bypasses read replicas specifically during session revocation to prevent race conditions during password resets.',
    'HIGH',
    0.96,
    0,
    null,
    'APPROVED',
    JSON.stringify([
      {
        id: 'ev-1',
        sourceType: 'COMMIT',
        sourceId: 'c8f49b1',
        sourceTitle: 'fix(auth): direct db fallback on token revoke',
        relevanceScore: 0.98,
        excerpt: 'const pool = getPrimaryDbPool(); await pool.query("UPDATE sessions SET revoked = true");',
      },
    ]),
    now
  );
  insertInsight.run(
    'ins-cron-dep',
    'proj-apollo-9',
    'HIDDEN_DEPENDENCY',
    'Uncommitted root cron job for webhook secret rotation',
    'Staging VM 3 hosts an undocumented cron job running as root at midnight to sync third-party webhook signing secrets. If this VM restarts, automated payout callbacks will fail.',
    'CRITICAL',
    0.92,
    1,
    'Git repository shows automated rotation RFC in PR #42, but cron job was deployed manually by Alex Chen.',
    'NEEDS_REVIEW',
    JSON.stringify([
      {
        id: 'ev-2',
        sourceType: 'MEETING',
        sourceId: 'meet-sync-44',
        sourceTitle: 'Handover Sync #1 Transcript',
        relevanceScore: 0.94,
        excerpt: 'Alex: By the way, the webhook secrets sync on VM 3 via crontab -e root. We should migrate that to AWS Secrets Manager.',
      },
    ]),
    now
  );
  insertInsight.run(
    'ins-kafka-spike',
    'proj-apollo-9',
    'UNFINISHED_TASK',
    'Unresolved Kafka consumer group partition rebalancing',
    'Under sustained traffic spikes, consumers exceed the max heartbeat timeout, forcing group rebalances and dropping message throughput by 65%. Issue #104 has open unmerged branches.',
    'HIGH',
    0.88,
    0,
    null,
    'NEEDS_REVIEW',
    JSON.stringify([
      {
        id: 'ev-3',
        sourceType: 'ISSUE',
        sourceId: 'issue-104',
        sourceTitle: 'Issue #104: Kafka consumer group rebalance timeout',
        relevanceScore: 0.91,
        excerpt: 'Workaround applied locally, but patch branch feature/kafka-heartbeat-opt is not merged.',
      },
    ]),
    now
  );
  insertInsight.run(
    'ins-gdpr-gap',
    'proj-apollo-9',
    'KNOWLEDGE_GAP',
    'Single point of failure on GDPR sanitizer data pipeline',
    'Alex Chen is the sole contributor (88% of blame) for the GDPR sanitizer worker. No other team member has executed the compliance export runbook or tested seed recovery.',
    'HIGH',
    0.95,
    0,
    null,
    'NEEDS_REVIEW',
    JSON.stringify([
      {
        id: 'ev-4',
        sourceType: 'COMMIT',
        sourceId: '4a3e21c',
        sourceTitle: 'feat(sanitizer): initial GDPR masking pipeline for export requests',
        relevanceScore: 0.95,
        excerpt: 'Single author across 650 lines in src/workers/sanitizer.ts',
      },
    ]),
    now
  );

  // 8. Handover State
  const insertHandover = db.prepare(`
    INSERT INTO handover_states (project_id, status, published_at, published_by, lead_notes, transition_steps_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertHandover.run(
    'proj-apollo-9',
    'IN_REVIEW',
    null,
    'Sarah Connor',
    'Transition is tracking on schedule for Nov 20, 2026. Priya Sharma is stepping in as primary module owner for Auth and Kafka pipelines.',
    JSON.stringify([
      { id: 'step-1', task: 'Migrate staging VM 3 root cron to AWS Scheduled EventBridge', owner: 'Priya Sharma', done: false },
      { id: 'step-2', task: 'Walkthrough token revocation direct DB primary fallback with incoming lead', owner: 'Alex Chen', done: true },
      { id: 'step-3', task: 'Merge Kafka heartbeat timeout patch from branch feature/kafka-heartbeat-opt', owner: 'Alex Chen', done: false },
      { id: 'step-4', task: 'Execute dry-run of GDPR transaction export sanitizer runbook', owner: 'Priya Sharma', done: false },
      { id: 'step-5', task: 'Revoke and rotate Alex Chens AWS IAM personal access keys', owner: 'Sarah Connor', done: false },
    ])
  );

  // 9. Initial Handover Questions (Continuity Q&A)
  const insertQuestion = db.prepare(`
    INSERT INTO handover_questions (id, project_id, user_id, user_name, user_role, question, answer, answered_by, answered_at, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertQuestion.run(
    'q-101',
    'proj-apollo-9',
    'usr-member-03',
    'Priya Sharma',
    'MEMBER',
    'What happens if a Kafka consumer group rebalances during peak 50k req/s traffic spikes?',
    'The consumer group timeout is set to 30000ms in kafkajs config. If a rebalance exceeds this, the direct DB fallback in src/auth/sessions.ts triggers to ensure token revocations are never dropped.',
    'Alex Chen (Principal Architect)',
    now,
    'ANSWERED',
    now
  );
  insertQuestion.run(
    'q-102',
    'proj-apollo-9',
    'usr-lead-01',
    'Sarah Connor',
    'PROJECT_LEAD',
    'Where is the root cron job secret rotation script hosted and how is it monitored?',
    'Currently on staging VM 3 (/etc/cron.d/sync-secrets). Action item #1 is actively moving this to an AWS EventBridge scheduled lambda before Friday.',
    'Alex Chen',
    now,
    'ANSWERED',
    now
  );
  insertQuestion.run(
    'q-103',
    'proj-apollo-9',
    'usr-member-03',
    'Priya Sharma',
    'MEMBER',
    'How do we regenerate the HMAC verification keys for the third-party webhook pipeline?',
    'Keys are retrieved through Nexus Identity Vault with mTLS certificate authentication. Run `pnpm run vault:rotate-keys` with Project Lead approval.',
    'Sarah Connor (Lead)',
    now,
    'ANSWERED',
    now
  );

  // 10. Initial Work Hours Logs
  const insertWorkLog = db.prepare(`
    INSERT INTO work_logs (id, user_id, user_name, user_role, project_id, project_name, hours, task_description, log_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertWorkLog.run('wl-01', 'usr-lead-01', 'Sarah Connor', 'PROJECT_LEAD', 'proj-apollo-9', 'Apollo Core Platform', 38.5, 'Handover report review, continuity scoring, and secret rotation verification.', '2026-11-15', now);
  insertWorkLog.run('wl-02', 'usr-member-02', 'Alex Chen', 'MEMBER', 'proj-apollo-9', 'Apollo Core Platform', 44.0, 'Documenting direct DB primary fallback, Kafka incident playbook, and code walkthroughs.', '2026-11-15', now);
  insertWorkLog.run('wl-03', 'usr-member-03', 'Priya Sharma', 'MEMBER', 'proj-apollo-9', 'Apollo Core Platform', 36.0, 'Reviewing webhook HMAC pipeline and shadow testing Kafka partition rebalances.', '2026-11-15', now);
  insertWorkLog.run('wl-04', 'usr-admin-01', 'Sarah Connor', 'ADMIN', 'proj-mercury-2', 'Mercury Mobile Client', 12.0, 'Quarterly architecture and credential review.', '2026-11-14', now);

  // 11. Meetings
  const insertMeeting = db.prepare(`
    INSERT INTO meetings (id, project_id, title, date, duration, attendees_json, summary, decisions_json, action_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMeeting.run(
    'meet-sync-44',
    'proj-apollo-9',
    'Handover Sync #1: Auth & Kafka Architecture',
    'Nov 10, 2026',
    '45 mins',
    JSON.stringify(['Alex Chen', 'Priya Sharma', 'Sarah Connor']),
    'Reviewed session revocation path and identified uncommitted cron on Staging VM 3. Decided to migrate rotation script to AWS EventBridge.',
    JSON.stringify([
      'Approved: Direct DB fallback remains primary path for session revokes.',
      'Decided: Priya Sharma will shadow Kafka consumer group tuning before Nov 18.',
    ]),
    JSON.stringify([
      { task: 'Draft PR migrating VM 3 cron job to EventBridge', assignee: 'Priya Sharma', done: false },
      { task: 'Export GDPR sanitizer test vectors', assignee: 'Alex Chen', done: true },
    ])
  );

  // 12. Timeline
  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (id, project_id, type, title, desc, author, author_role, occurred_at, source_url, source_type, ai_linked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTimeline.run('evt-1', 'proj-apollo-9', 'COMMIT', 'fix(auth): direct db fallback on token revoke', 'Bypasses replica lag in multi-region deployments.', 'Alex Chen', 'Departing Contributor', '2 hours ago', 'https://github.com/acme-corp/apollo-core/commit/c8f49b1', 'GitHub Commit (c8f49b1)', 1);
  insertTimeline.run('evt-2', 'proj-apollo-9', 'DOCUMENT', 'Kafka Consumer Rebalance Incident Playbook', 'Uploaded incident runbook for Kafka consumer groups.', 'Alex Chen', 'Departing Contributor', 'Yesterday', '/dashboard/projects/proj-apollo-9/knowledge', 'Runbook Doc', 1);
  insertTimeline.run('evt-3', 'proj-apollo-9', 'MEETING', 'Handover Sync #1: Auth & Kafka Architecture', 'Initial deep-dive into single point of failure modules.', 'Sarah Connor', 'Project Lead', 'Nov 10, 2026', '/dashboard/projects/proj-apollo-9/meetings', 'Transcript', 1);

  // 13. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, project_id, user_id, title, message, type, time, created_at, read, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run('notif-1', 'proj-apollo-9', null, 'Handover Dossier Updated', 'AI Knowledge Reconstruction engine analyzed latest git commits.', 'ANALYSIS_ALERT', 'Just now', now, 0, '/dashboard/projects/proj-apollo-9/handover');
  insertNotif.run('notif-2', 'proj-apollo-9', null, 'Single Point of Failure Flagged', 'Alex Chen holds 82% of Auth and Kafka code blame.', 'HANDOVER_STATUS', '10 mins ago', now, 0, '/dashboard/projects/proj-apollo-9/risks');
}

// ---------------------------------------------------------------------------
// DB Public Accessor Methods
// ---------------------------------------------------------------------------

export const db = {
  // Users
  getUsers: (): DbUser[] => {
    const inst = getDbInstance();
    const rows = inst.prepare(`
      SELECT 
        id, name, email, password_hash as passwordHash, role, avatar, 
        employee_id as employeeId, clearance_badge as clearanceBadge, 
        team_id as teamId, sub_team_id as subTeamId, 
        work_hours_weekly as workHoursWeekly, status, created_at as createdAt
      FROM users
      ORDER BY created_at ASC;
    `).all();
    return rows as DbUser[];
  },

  findUserByEmail: (email: string): DbUser | undefined => {
    const inst = getDbInstance();
    const row = inst.prepare(`
      SELECT 
        id, name, email, password_hash as passwordHash, role, avatar, 
        employee_id as employeeId, clearance_badge as clearanceBadge, 
        team_id as teamId, sub_team_id as subTeamId, 
        work_hours_weekly as workHoursWeekly, status, created_at as createdAt
      FROM users 
      WHERE LOWER(email) = LOWER(?);
    `).get(email.trim());
    return row as DbUser | undefined;
  },

  findUserById: (id: string): DbUser | undefined => {
    const inst = getDbInstance();
    const row = inst.prepare(`
      SELECT 
        id, name, email, password_hash as passwordHash, role, avatar, 
        employee_id as employeeId, clearance_badge as clearanceBadge, 
        team_id as teamId, sub_team_id as subTeamId, 
        work_hours_weekly as workHoursWeekly, status, created_at as createdAt
      FROM users 
      WHERE id = ?;
    `).get(id);
    return row as DbUser | undefined;
  },

  createUser: (data: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'PROJECT_LEAD' | 'MEMBER';
    avatar?: string;
    teamId?: string;
    subTeamId?: string;
    employeeId?: string;
  }): DbUser => {
    const inst = getDbInstance();
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(data.password, 10);
    const role = data.role || 'MEMBER';
    const employeeId = data.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const clearanceBadge = role === 'ADMIN' ? 'LEVEL_3_ADMIN' : role === 'PROJECT_LEAD' ? 'LEVEL_2_LEAD' : 'LEVEL_1_MEMBER';
    const teamId = data.teamId || 'team-platform';
    const subTeamId = data.subTeamId || 'sub-auth';
    const avatar = data.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`;

    inst.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, avatar, employee_id, clearance_badge, team_id, sub_team_id, work_hours_weekly, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(id, data.name.trim(), data.email.trim().toLowerCase(), passwordHash, role, avatar, employeeId, clearanceBadge, teamId, subTeamId, 40, 'ACTIVE', now);

    return db.findUserById(id)!;
  },

  updateUser: (id: string, updates: Partial<{
    name: string;
    role: 'ADMIN' | 'PROJECT_LEAD' | 'MEMBER';
    teamId: string;
    subTeamId: string;
    employeeId: string;
    clearanceBadge: string;
    workHoursWeekly: number;
    status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
    password?: string;
  }>): DbUser | undefined => {
    const inst = getDbInstance();
    const existing = db.findUserById(id);
    if (!existing) return undefined;

    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const role = updates.role !== undefined ? updates.role : existing.role;
    const teamId = updates.teamId !== undefined ? updates.teamId : existing.teamId;
    const subTeamId = updates.subTeamId !== undefined ? updates.subTeamId : existing.subTeamId;
    const employeeId = updates.employeeId !== undefined ? updates.employeeId : existing.employeeId;
    const clearanceBadge = updates.clearanceBadge !== undefined ? updates.clearanceBadge : existing.clearanceBadge;
    const workHoursWeekly = updates.workHoursWeekly !== undefined ? updates.workHoursWeekly : existing.workHoursWeekly;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const passwordHash = updates.password ? bcrypt.hashSync(updates.password, 10) : existing.passwordHash;

    inst.prepare(`
      UPDATE users SET 
        name = ?, role = ?, team_id = ?, sub_team_id = ?, employee_id = ?, 
        clearance_badge = ?, work_hours_weekly = ?, status = ?, password_hash = ?
      WHERE id = ?;
    `).run(name, role, teamId, subTeamId, employeeId, clearanceBadge, workHoursWeekly, status, passwordHash, id);

    return db.findUserById(id);
  },

  // Teams & Sub-teams
  getTeams: (): DbTeam[] => {
    const inst = getDbInstance();
    return inst.prepare(`SELECT * FROM teams ORDER BY name ASC;`).all() as DbTeam[];
  },

  getSubTeams: (teamId?: string): DbSubTeam[] => {
    const inst = getDbInstance();
    if (teamId) {
      return inst.prepare(`SELECT id, team_id as teamId, name, description, lead_id as leadId, created_at as createdAt FROM sub_teams WHERE team_id = ?;`).all(teamId) as DbSubTeam[];
    }
    return inst.prepare(`SELECT id, team_id as teamId, name, description, lead_id as leadId, created_at as createdAt FROM sub_teams;`).all() as DbSubTeam[];
  },

  createTeam: (name: string, description: string, leadId?: string): DbTeam => {
    const inst = getDbInstance();
    const id = `team-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    inst.prepare(`INSERT INTO teams (id, name, description, lead_id, created_at) VALUES (?, ?, ?, ?, ?);`).run(id, name, description, leadId || '', now);
    return { id, name, description, leadId: leadId || '', createdAt: now };
  },

  createSubTeam: (teamId: string, name: string, description: string, leadId?: string): DbSubTeam => {
    const inst = getDbInstance();
    const id = `sub-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    inst.prepare(`INSERT INTO sub_teams (id, team_id, name, description, lead_id, created_at) VALUES (?, ?, ?, ?, ?, ?);`).run(id, teamId, name, description, leadId || '', now);
    return { id, teamId, name, description, leadId: leadId || '', createdAt: now };
  },

  // Projects & Project Exclusivity
  getProjects: (userId?: string, userRole?: string): DbProject[] => {
    const inst = getDbInstance();
    const allRows = inst.prepare(`
      SELECT 
        id, name, slug, description, status, tech_stack as techStack, 
        repo_owner as repoOwner, repo_name as repoName, 
        team_id as teamId, sub_team_id as subTeamId, 
        is_exclusive as isExclusive, creator_user_id as creatorUserId, last_synced_at as lastSyncedAt, 
        departing_member_json as departingMemberJson, created_at as createdAt
      FROM projects;
    `).all();

    const parsed: DbProject[] = allRows.map((r: any) => ({
      ...r,
      techStack: JSON.parse(r.techStack || '[]'),
      isExclusive: Boolean(r.isExclusive),
      departingMember: JSON.parse(r.departingMemberJson || '{}'),
    }));

    const user = userId ? db.findUserById(userId) : undefined;
    const isDemo = userId ? isDemoAccount(userId, user?.email) : true;

    // NON-DEMO / NEWLY CREATED ACCOUNTS: STRICT DATA ISOLATION
    // Must NEVER see demo projects (Apollo 9, Mercury 2, Nexus Vault).
    // Dashboard is blank (0 projects) until they connect or are added to a project.
    if (!isDemo) {
      if (!userId) return [];
      const nonDemoProjects = parsed.filter((p) => !DEMO_PROJECT_IDS.has(p.id));
      const memberRows = inst.prepare(`SELECT project_id FROM project_members WHERE user_id = ?;`).all(userId) as any[];
      const allowedIds = new Set(memberRows.map((m) => m.project_id));

      if (userRole === 'ADMIN') {
        return nonDemoProjects;
      }

      return nonDemoProjects.filter((p) => {
        if (allowedIds.has(p.id)) return true;
        if (p.creatorUserId === userId) return true;
        if (user && (p.creatorUserId === user.email || p.creatorUserId === user.id || p.creatorUserId === user.name)) return true;
        return false;
      });
    }

    // DEMO ACCOUNTS:
    // If Admin demo account, see all demo projects
    if (userRole === 'ADMIN') {
      return parsed.filter((p) => DEMO_PROJECT_IDS.has(p.id));
    }

    if (userId) {
      const memberRows = inst.prepare(`SELECT project_id FROM project_members WHERE user_id = ?;`).all(userId) as any[];
      const allowedIds = new Set(memberRows.map((m) => m.project_id));

      return parsed.filter((p) => {
        if (!DEMO_PROJECT_IDS.has(p.id)) return false;
        if (allowedIds.has(p.id)) return true;
        if (user && p.departingMember?.name === user.name) return true;
        if (!p.isExclusive) return true;
        return false;
      });
    }

    // Public explore demo: return demo projects
    return parsed.filter((p) => DEMO_PROJECT_IDS.has(p.id));
  },

  getProjectById: (projectId: string): DbProject | undefined => {
    const inst = getDbInstance();
    const r = inst.prepare(`
      SELECT 
        id, name, slug, description, status, tech_stack as techStack, 
        repo_owner as repoOwner, repo_name as repoName, 
        team_id as teamId, sub_team_id as subTeamId, 
        is_exclusive as isExclusive, creator_user_id as creatorUserId, last_synced_at as lastSyncedAt, 
        departing_member_json as departingMemberJson, created_at as createdAt
      FROM projects WHERE id = ?;
    `).get(projectId) as any;

    if (!r) return undefined;
    return {
      ...r,
      techStack: JSON.parse(r.techStack || '[]'),
      isExclusive: Boolean(r.isExclusive),
      departingMember: JSON.parse(r.departingMemberJson || '{}'),
    };
  },

  userCanAccessProject: (userId?: string, userRole?: string, projectId?: string): boolean => {
    if (!projectId) return false;

    // 1. If accessing a DEMO project (Apollo, Mercury, Nexus)
    if (isDemoProject(projectId)) {
      if (!userId) {
        // Public explore is allowed for demo projects
        return true;
      }
      const user = db.findUserById(userId);
      const isDemo = isDemoAccount(userId, user?.email);
      // NON-DEMO ACCOUNTS CAN NEVER ACCESS DEMO DATA!
      if (!isDemo) {
        return false;
      }
      if (userRole === 'ADMIN') return true;

      const inst = getDbInstance();
      const member = inst.prepare(`SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?;`).get(projectId, userId);
      if (member) return true;
      const proj = db.getProjectById(projectId);
      if (user && proj?.departingMember?.name === user.name) return true;
      if (proj && !proj.isExclusive) return true;
      return false;
    }

    // 2. If accessing a USER-CREATED / NON-DEMO project
    if (!userId) return false;
    if (userRole === 'ADMIN') return true;

    const user = db.findUserById(userId);
    const userEmail = user?.email || userId;
    const inst = getDbInstance();
    const member = inst.prepare(`SELECT 1 FROM project_members WHERE project_id = ? AND (user_id = ? OR user_id = ?);`).get(projectId, userId, userEmail);
    if (member) return true;

    const proj = db.getProjectById(projectId);
    if (!proj) return false;
    if (proj.creatorUserId === userId) return true;
    if (user && (proj.creatorUserId === user.email || proj.creatorUserId === user.id || proj.creatorUserId === user.name)) return true;
    if (!proj.isExclusive) return true;

    return false;
  },

  createProject: (data: {
    name: string;
    slug?: string;
    description: string;
    status?: 'ACTIVE' | 'HANDOVER_IN_PROGRESS' | 'COMPLETED';
    techStack?: string[];
    repoOwner?: string;
    repoName?: string;
    teamId?: string;
    subTeamId?: string;
    isExclusive?: boolean;
    departingMember?: any;
    creatorUserId?: string;
  }): DbProject => {
    const inst = getDbInstance();
    const id = `proj-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const departingMember = data.departingMember || {
      name: 'Unassigned',
      role: 'Staff Engineer',
      leavingDate: 'in 2 weeks',
      criticalOwnership: 'Core Modules',
    };

    inst.prepare(`
      INSERT INTO projects (id, name, slug, description, status, tech_stack, repo_owner, repo_name, team_id, sub_team_id, is_exclusive, creator_user_id, last_synced_at, departing_member_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      id,
      data.name.trim(),
      slug,
      data.description || 'Continuous knowledge handover workspace',
      data.status || 'HANDOVER_IN_PROGRESS',
      JSON.stringify(data.techStack || ['TypeScript', 'Next.js']),
      data.repoOwner || 'repository',
      data.repoName || slug,
      data.teamId || 'team-platform',
      data.subTeamId || 'sub-auth',
      data.isExclusive !== undefined ? (data.isExclusive ? 1 : 0) : 1,
      data.creatorUserId || null,
      'Just now',
      JSON.stringify(departingMember),
      now
    );

    // Auto-create initial Handover State for the project
    inst.prepare(`
      INSERT OR IGNORE INTO handover_states (project_id, status, transition_steps_json)
      VALUES (?, 'IN_REVIEW', ?);
    `).run(
      id,
      JSON.stringify([
        { id: `step-${Date.now()}-1`, task: 'Review architecture RFCs and technical decisions', owner: departingMember.name, done: false },
        { id: `step-${Date.now()}-2`, task: 'Conduct live code walkthrough for key modules', owner: departingMember.name, done: false },
        { id: `step-${Date.now()}-3`, task: 'Audit and rotate secrets, API keys, and cron configurations', owner: 'Project Lead', done: false },
      ])
    );

    // Assign creator as OWNER
    if (data.creatorUserId) {
      inst.prepare(`
        INSERT OR IGNORE INTO project_members (project_id, user_id, role, hours_logged, joined_at)
        VALUES (?, ?, 'OWNER', 0, ?);
      `).run(id, data.creatorUserId, now);
    }

    return db.getProjectById(id)!;
  },

  getProjectMembers: (projectId: string) => {
    const inst = getDbInstance();
    const rows = inst.prepare(`
      SELECT 
        pm.project_id as projectId, pm.user_id as userId, pm.role as projectRole, 
        pm.hours_logged as hoursLogged, pm.joined_at as joinedAt,
        u.name, u.email, u.role as systemRole, u.avatar, u.employee_id as employeeId,
        u.clearance_badge as clearanceBadge, u.status as memberStatus
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?;
    `).all(projectId);
    return rows;
  },

  assignMemberToProject: (projectId: string, userId: string, role: string = 'CONTRIBUTOR') => {
    const inst = getDbInstance();
    const now = new Date().toISOString();
    inst.prepare(`
      INSERT INTO project_members (project_id, user_id, role, hours_logged, joined_at)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(project_id, user_id) DO UPDATE SET role = excluded.role;
    `).run(projectId, userId, role, now);
  },

  removeMemberFromProject: (projectId: string, userId: string) => {
    const inst = getDbInstance();
    inst.prepare(`DELETE FROM project_members WHERE project_id = ? AND user_id = ?;`).run(projectId, userId);
  },

  // Repository Contributors & File Tree Cache
  getProjectRepoCache: (projectId: string) => {
    const inst = getDbInstance();
    try {
      inst.prepare(`
        CREATE TABLE IF NOT EXISTS project_repo_cache (
          project_id TEXT PRIMARY KEY,
          contributors_json TEXT,
          modules_json TEXT,
          repo_meta_json TEXT,
          updated_at TEXT
        );
      `).run();
      const row = inst.prepare(`SELECT contributors_json, modules_json, repo_meta_json FROM project_repo_cache WHERE project_id = ?;`).get(projectId) as any;
      if (!row) return null;
      return {
        contributors: JSON.parse(row.contributors_json || '[]'),
        modules: JSON.parse(row.modules_json || '[]'),
        repoMeta: JSON.parse(row.repo_meta_json || '{}'),
      };
    } catch {
      return null;
    }
  },

  // Handover Q&A
  getHandoverQuestions: (projectId: string): DbHandoverQuestion[] => {
    const inst = getDbInstance();
    return inst.prepare(`
      SELECT 
        id, project_id as projectId, user_id as userId, user_name as userName, 
        user_role as userRole, question, answer, answered_by as answeredBy, 
        answered_at as answeredAt, status, created_at as createdAt
      FROM handover_questions
      WHERE project_id = ?
      ORDER BY created_at DESC;
    `).all(projectId) as DbHandoverQuestion[];
  },

  addHandoverQuestion: (data: {
    projectId: string;
    userId: string;
    userName: string;
    userRole: string;
    question: string;
  }): DbHandoverQuestion => {
    const inst = getDbInstance();
    const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    inst.prepare(`
      INSERT INTO handover_questions (id, project_id, user_id, user_name, user_role, question, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?);
    `).run(id, data.projectId, data.userId, data.userName, data.userRole, data.question.trim(), now);

    return inst.prepare(`
      SELECT 
        id, project_id as projectId, user_id as userId, user_name as userName, 
        user_role as userRole, question, answer, answered_by as answeredBy, 
        answered_at as answeredAt, status, created_at as createdAt
      FROM handover_questions WHERE id = ?;
    `).get(id) as DbHandoverQuestion;
  },

  answerHandoverQuestion: (questionId: string, answer: string, answeredBy: string): DbHandoverQuestion | undefined => {
    const inst = getDbInstance();
    const now = new Date().toISOString();

    inst.prepare(`
      UPDATE handover_questions SET 
        answer = ?, answered_by = ?, answered_at = ?, status = 'ANSWERED'
      WHERE id = ?;
    `).run(answer.trim(), answeredBy, now, questionId);

    return inst.prepare(`
      SELECT 
        id, project_id as projectId, user_id as userId, user_name as userName, 
        user_role as userRole, question, answer, answered_by as answeredBy, 
        answered_at as answeredAt, status, created_at as createdAt
      FROM handover_questions WHERE id = ?;
    `).get(questionId) as DbHandoverQuestion | undefined;
  },

  // Work Logs
  getWorkLogs: (userId?: string, projectId?: string): DbWorkLog[] => {
    const inst = getDbInstance();
    let query = `
      SELECT 
        id, user_id as userId, user_name as userName, user_role as userRole, 
        project_id as projectId, project_name as projectName, hours, 
        task_description as taskDescription, log_date as logDate, created_at as createdAt
      FROM work_logs
    `;
    const params: any[] = [];
    if (userId && projectId) {
      query += ` WHERE user_id = ? AND project_id = ?`;
      params.push(userId, projectId);
    } else if (userId) {
      query += ` WHERE user_id = ?`;
      params.push(userId);
    } else if (projectId) {
      query += ` WHERE project_id = ?`;
      params.push(projectId);
    }
    query += ` ORDER BY log_date DESC, created_at DESC;`;

    return inst.prepare(query).all(...params) as DbWorkLog[];
  },

  addWorkLog: (data: {
    userId: string;
    userName: string;
    userRole: string;
    projectId: string;
    projectName: string;
    hours: number;
    taskDescription: string;
    logDate?: string;
  }): DbWorkLog => {
    const inst = getDbInstance();
    const id = `wl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const logDate = data.logDate || now.split('T')[0];

    inst.prepare(`
      INSERT INTO work_logs (id, user_id, user_name, user_role, project_id, project_name, hours, task_description, log_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(id, data.userId, data.userName, data.userRole, data.projectId, data.projectName, data.hours, data.taskDescription.trim(), logDate, now);

    // Also update project_members hours_logged
    inst.prepare(`
      UPDATE project_members SET hours_logged = hours_logged + ?
      WHERE project_id = ? AND user_id = ?;
    `).run(data.hours, data.projectId, data.userId);

    return inst.prepare(`
      SELECT 
        id, user_id as userId, user_name as userName, user_role as userRole, 
        project_id as projectId, project_name as projectName, hours, 
        task_description as taskDescription, log_date as logDate, created_at as createdAt
      FROM work_logs WHERE id = ?;
    `).get(id) as DbWorkLog;
  },

  // Documents
  getDocuments: (projectId?: string): DbDocument[] => {
    const inst = getDbInstance();
    const query = projectId
      ? `SELECT id, project_id as projectId, title, file_name as fileName, file_type as fileType, file_size as fileSize, category, content, ai_summary as aiSummary, ai_grounding as aiGrounding, uploaded_by as uploadedBy, created_at as createdAt FROM documents WHERE project_id = ? ORDER BY created_at DESC;`
      : `SELECT id, project_id as projectId, title, file_name as fileName, file_type as fileType, file_size as fileSize, category, content, ai_summary as aiSummary, ai_grounding as aiGrounding, uploaded_by as uploadedBy, created_at as createdAt FROM documents ORDER BY created_at DESC;`;
    const rows = projectId ? inst.prepare(query).all(projectId) : inst.prepare(query).all();
    return rows.map((r: any) => ({ ...r, aiGrounding: Boolean(r.aiGrounding) })) as DbDocument[];
  },

  addDocument: (doc: Omit<DbDocument, 'id' | 'createdAt'>): DbDocument => {
    const inst = getDbInstance();
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    inst.prepare(`
      INSERT INTO documents (id, project_id, title, file_name, file_type, file_size, category, content, ai_summary, ai_grounding, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      id, doc.projectId, doc.title, doc.fileName, doc.fileType, doc.fileSize, doc.category,
      doc.content, doc.aiSummary || null, doc.aiGrounding ? 1 : 0, doc.uploadedBy, now
    );

    return { ...doc, id, createdAt: now };
  },

  updateDocumentSummary: (id: string, aiSummary: string) => {
    const inst = getDbInstance();
    inst.prepare(`UPDATE documents SET ai_summary = ? WHERE id = ?;`).run(aiSummary, id);
  },

  // Insights
  getInsights: (projectId?: string): DbInsight[] => {
    const inst = getDbInstance();
    const query = projectId
      ? `SELECT id, project_id as projectId, category, title, content, severity, confidence_score as confidenceScore, is_conflicting as isConflicting, conflict_details as conflictDetails, status, evidence_json as evidenceJson, created_at as createdAt FROM insights WHERE project_id = ? ORDER BY created_at DESC;`
      : `SELECT id, project_id as projectId, category, title, content, severity, confidence_score as confidenceScore, is_conflicting as isConflicting, conflict_details as conflictDetails, status, evidence_json as evidenceJson, created_at as createdAt FROM insights ORDER BY created_at DESC;`;
    const rows = projectId ? inst.prepare(query).all(projectId) : inst.prepare(query).all();

    return rows.map((r: any) => ({
      ...r,
      isConflicting: Boolean(r.isConflicting),
      evidence: JSON.parse(r.evidenceJson || '[]'),
    })) as DbInsight[];
  },

  addInsight: (ins: Omit<DbInsight, 'id' | 'createdAt'>): DbInsight => {
    const inst = getDbInstance();
    const id = `ins-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    inst.prepare(`
      INSERT INTO insights (id, project_id, category, title, content, severity, confidence_score, is_conflicting, conflict_details, status, evidence_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      id, ins.projectId, ins.category, ins.title, ins.content, ins.severity,
      ins.confidenceScore, ins.isConflicting ? 1 : 0, ins.conflictDetails || null,
      ins.status, JSON.stringify(ins.evidence || []), now
    );

    return { ...ins, id, createdAt: now };
  },

  updateInsightStatus: (id: string, status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW') => {
    const inst = getDbInstance();
    inst.prepare(`UPDATE insights SET status = ? WHERE id = ?;`).run(status, id);
    const row = inst.prepare(`SELECT id, project_id as projectId, category, title, content, severity, confidence_score as confidenceScore, is_conflicting as isConflicting, conflict_details as conflictDetails, status, evidence_json as evidenceJson, created_at as createdAt FROM insights WHERE id = ?;`).get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      isConflicting: Boolean(row.isConflicting),
      evidence: JSON.parse(row.evidenceJson || '[]'),
    };
  },

  // Handover State
  getHandoverState: (projectId: string): DbHandoverState => {
    const inst = getDbInstance();
    const row = inst.prepare(`SELECT project_id as projectId, status, published_at as publishedAt, published_by as publishedBy, lead_notes as leadNotes, transition_steps_json as transitionStepsJson FROM handover_states WHERE project_id = ?;`).get(projectId) as any;
    if (!row) {
      return {
        projectId,
        status: 'IN_REVIEW',
        transitionSteps: [
          { id: 'step-1', task: 'Review architecture RFCs and technical decisions', owner: 'Team', done: false },
        ],
      };
    }
    return {
      projectId: row.projectId,
      status: row.status,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy,
      leadNotes: row.leadNotes,
      transitionSteps: JSON.parse(row.transitionStepsJson || '[]'),
    };
  },

  publishHandover: (projectId: string, publishedBy: string, status: 'IN_REVIEW' | 'PUBLISHED' = 'PUBLISHED', leadNotes?: string): DbHandoverState => {
    const inst = getDbInstance();
    const existing = db.getHandoverState(projectId);
    const now = new Date().toISOString();
    const publishedAt = status === 'PUBLISHED' ? now : null;

    inst.prepare(`
      INSERT INTO handover_states (project_id, status, published_at, published_by, lead_notes, transition_steps_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET 
        status = excluded.status, 
        published_at = excluded.published_at, 
        published_by = excluded.published_by, 
        lead_notes = COALESCE(excluded.lead_notes, handover_states.lead_notes);
    `).run(projectId, status, publishedAt, publishedBy, leadNotes !== undefined ? leadNotes : existing.leadNotes || null, JSON.stringify(existing.transitionSteps));

    return db.getHandoverState(projectId);
  },

  toggleTransitionStep: (projectId: string, stepId: string): DbHandoverState => {
    const inst = getDbInstance();
    const existing = db.getHandoverState(projectId);
    const updatedSteps = existing.transitionSteps.map((s) => s.id === stepId ? { ...s, done: !s.done } : s);

    inst.prepare(`
      UPDATE handover_states SET transition_steps_json = ? WHERE project_id = ?;
    `).run(JSON.stringify(updatedSteps), projectId);

    return { ...existing, transitionSteps: updatedSteps };
  },

  // Rate Limiting (Attack Prevention)
  checkRateLimit: (key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } => {
    const inst = getDbInstance();
    const now = Date.now();
    const row = inst.prepare(`SELECT attempts, first_attempt FROM rate_limits WHERE key = ?;`).get(key) as any;

    if (!row) {
      inst.prepare(`INSERT OR REPLACE INTO rate_limits (key, attempts, first_attempt) VALUES (?, 1, ?);`).run(key, now);
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (now - row.first_attempt > windowMs) {
      inst.prepare(`UPDATE rate_limits SET attempts = 1, first_attempt = ? WHERE key = ?;`).run(now, key);
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (row.attempts >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    inst.prepare(`UPDATE rate_limits SET attempts = attempts + 1 WHERE key = ?;`).run(key);
    return { allowed: true, remaining: maxAttempts - row.attempts - 1 };
  },

  // Settings
  getSetting: (key: string): string | null => {
    const inst = getDbInstance();
    const row = inst.prepare(`SELECT value FROM system_settings WHERE key = ?;`).get(key) as any;
    return row ? row.value : null;
  },

  setSetting: (key: string, value: string) => {
    const inst = getDbInstance();
    const now = new Date().toISOString();
    inst.prepare(`
      INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
    `).run(key, value, now);
  },
};
