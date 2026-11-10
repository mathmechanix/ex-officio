# Ex Officio — AI-Powered Knowledge Handover Platform

> **Preserve project continuity when team members leave.**  
> Evidence-first, human-in-the-loop knowledge reconstruction powered by Gemini AI and GitHub source integration.

---

## 🌟 The Handover Workflow

```
Login → Select Project → View Project Dashboard → Explore Timeline → Connect GitHub → Analyze with Gemini → Generate Evidence-Linked Handover → Review and Approve → Publish Report
```

1. **Authentication & User Management**: Role-based access control (`Admin`, `Project Lead`, `Member`), credentials & GitHub OAuth support.
2. **Project Management & Workspaces**: Multi-project tracking, status management (`Active`, `Handover in Progress`, `Archived`), and technology stack tagging.
3. **Team Members & Knowledge Ownership Map**: Tracks contributions and identifies single points of failure where modules are heavily concentrated in departing personnel.
4. **Unified Project Timeline**: Chronological stream merging git commits, PRs, issues, architecture decisions, and meeting notes with clickable evidence.
5. **GitHub Integration**: Direct repository sync for commits, diffs, pull requests, and unresolved issues with contributor mapping.
6. **Gemini AI Knowledge Reconstruction**: Synthesizes raw repository histories to extract undocumented technical decisions, unfinished responsibilities, hidden operational dependencies, and risks.
7. **Evidence-Based Insights**: Anti-hallucination guarantee linking every insight to commit SHAs and PR diffs, complete with confidence scores and contradiction flags.
8. **Knowledge Base**: Central repository for ADRs, RFCs, runbooks, and meeting notes with drag & drop file uploads (PDF, DOCX, TXT).
9. **Project Structure Explorer**: Interactive folder and module tree highlighting undocumented code and dependency connections.
10. **The 6-Question AI Handover Report**:
    - *What knowledge did the departing member possess?*
    - *Which decisions did they influence?*
    - *What dependencies relied on their expertise?*
    - *What information is missing?*
    - *What risks arise after their departure?*
    - *What steps are required for a smooth transition?*
11. **Human-in-the-Loop Review**: Project leads verify, approve, edit, or reject individual insights before publishing.
12. **Risk & Dependency Matrix**: Severity vs likelihood matrix with active mitigation tracking.
13. **Handover Dashboard**: Real-time continuity readiness percentage and transition milestone checklists.
14. **Permission-Aware Sharing**: Role-based report distribution and exportable PDF dossiers.
15. **Meeting & Discussion Management**: Summarize technical syncs and automatically extract decisions and assigned tasks.
16. **Notifications & Alerts**: Timely alerts for pending approvals, GitHub syncs, and detected architectural conflicts.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ex_officio"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GEMINI_API_KEY=""
```
*(Note: If `GEMINI_API_KEY` is omitted, Ex Officio seamlessly runs in simulated high-fidelity mode with mock data.)*

### 3. Generate Prisma Schema
```bash
npm run db:generate
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Account
- **Email:** `lead@exofficio.dev`
- **Password:** `password123`
- **Role:** `PROJECT_LEAD` (Full access to review & approve handovers)
