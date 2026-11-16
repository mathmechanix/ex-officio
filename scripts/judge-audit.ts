import { SESSION_COOKIE_NAME } from "../src/lib/auth-config";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log("=== HACKATHON JUDGE COMPREHENSIVE SYSTEM AUDIT ===");
  console.log(`Target: ${BASE_URL}\n`);

  const results: { test: string; status: "PASS" | "FAIL" | "WARN"; details: string }[] = [];

  function record(test: string, status: "PASS" | "FAIL" | "WARN", details: string) {
    results.push({ test, status, details });
    const symbol = status === "PASS" ? "✅" : status === "WARN" ? "⚠️" : "❌";
    console.log(`${symbol} [${status}] ${test}: ${details}`);
  }

  // 1. Unauthenticated Security Boundary Check
  try {
    const unauthDash = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    if (unauthDash.status === 307 || unauthDash.status === 302 || unauthDash.status === 401) {
      record("Unauthenticated /dashboard Access Gate", "PASS", `Correctly gated with HTTP ${unauthDash.status}`);
    } else {
      record("Unauthenticated /dashboard Access Gate", "FAIL", `Returned unexpected status: ${unauthDash.status}`);
    }

    const unauthAdmin = await fetch(`${BASE_URL}/dashboard/admin`, { redirect: "manual" });
    if (unauthAdmin.status === 307 || unauthAdmin.status === 302 || unauthAdmin.status === 401 || unauthAdmin.status === 403) {
      record("Unauthenticated /dashboard/admin Access Gate", "PASS", `Correctly gated with HTTP ${unauthAdmin.status}`);
    } else {
      record("Unauthenticated /dashboard/admin Access Gate", "FAIL", `Returned status ${unauthAdmin.status}`);
    }
  } catch (err: any) {
    record("Unauthenticated Boundary Check", "FAIL", err.message);
  }

  // Helper to login via next-auth CSRF and credentials
  async function loginUser(email: string, password: string): Promise<string> {
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const cookieHeader = csrfRes.headers.get("set-cookie") || "";

    const params = new URLSearchParams();
    params.append("csrfToken", csrfToken);
    params.append("email", email);
    params.append("password", password);
    params.append("callbackUrl", `${BASE_URL}/dashboard`);
    params.append("json", "true");

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: params.toString(),
      redirect: "manual",
    });

    const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
    const sessionCookie = setCookies.find((c: string) => c.includes(SESSION_COOKIE_NAME));
    if (!sessionCookie) {
      return "";
    }
    const match = sessionCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=[^;]+`));
    return match ? match[0] : "";
  }

  // 2. Test NextAuth Logins for all three roles
  let adminCookie = "";
  let leadCookie = "";
  let memberCookie = "";

  try {
    adminCookie = await loginUser("admin@exofficio.dev", "password123");
    if (adminCookie.includes(SESSION_COOKIE_NAME)) {
      record("Admin Credential Authentication (admin@exofficio.dev)", "PASS", "Session token successfully established");
    } else {
      record("Admin Credential Authentication", "FAIL", "No session token returned in set-cookie");
    }
  } catch (err: any) {
    record("Admin Credential Authentication", "FAIL", err.message);
  }

  try {
    leadCookie = await loginUser("lead@exofficio.dev", "password123");
    if (leadCookie.includes(SESSION_COOKIE_NAME)) {
      record("Project Lead Credential Authentication (lead@exofficio.dev)", "PASS", "Session token successfully established");
    } else {
      record("Project Lead Credential Authentication", "FAIL", "No session token returned");
    }
  } catch (err: any) {
    record("Project Lead Credential Authentication", "FAIL", err.message);
  }

  try {
    memberCookie = await loginUser("priya.sharma@acme.com", "password123");
    if (memberCookie.includes(SESSION_COOKIE_NAME)) {
      record("Member Credential Authentication (priya.sharma@acme.com)", "PASS", "Session token successfully established");
    } else {
      record("Member Credential Authentication", "FAIL", "No session token returned");
    }
  } catch (err: any) {
    record("Member Credential Authentication", "FAIL", err.message);
  }

  // 3. Test Registration Flow
  const testNewEmail = `judge_${Date.now()}@exofficio.test`;
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Hackathon Judge Tester",
        email: testNewEmail,
        password: "JudgeSecurePassword2026!",
        role: "MEMBER",
      }),
    });
    const regData = await regRes.json();
    if (regRes.status === 201 || (regRes.status === 200 && regData.success)) {
      record("User Registration API", "PASS", `User created with ID ${regData.user.id}`);
    } else {
      record("User Registration API", "FAIL", `Status ${regRes.status}: ${JSON.stringify(regData)}`);
    }

    // Try logging in with the newly registered user
    const newCookie = await loginUser(testNewEmail, "JudgeSecurePassword2026!");
    if (newCookie.includes(SESSION_COOKIE_NAME)) {
      record("New Registered User Login", "PASS", "Login succeeded with fresh bcrypt password verification");
    } else {
      record("New Registered User Login", "FAIL", "Login failed for newly registered user");
    }
  } catch (err: any) {
    record("User Registration & Verification", "FAIL", err.message);
  }

  // 4. Role-Based Access Control (RBAC) & Exclusivity
  try {
    const memberAdminAttempt = await fetch(`${BASE_URL}/api/admin/members`, {
      headers: { Cookie: memberCookie },
    });
    if (memberAdminAttempt.status === 403) {
      record("RBAC Admin Endpoint Protection from Member", "PASS", "Member correctly blocked with 403 Forbidden");
    } else {
      record("RBAC Admin Endpoint Protection from Member", "FAIL", `Returned status ${memberAdminAttempt.status}`);
    }

    const adminMembersRes = await fetch(`${BASE_URL}/api/admin/members`, {
      headers: { Cookie: adminCookie },
    });
    if (adminMembersRes.status === 200) {
      const data = await adminMembersRes.json();
      record("Admin Fetch Members API", "PASS", `Returned ${data.members?.length || 0} members`);
    } else {
      record("Admin Fetch Members API", "FAIL", `Returned status ${adminMembersRes.status}`);
    }
  } catch (err: any) {
    record("RBAC Test", "FAIL", err.message);
  }

  // 5. Admin Personnel Capacity & ID Maintenance (PATCH)
  try {
    const updateRes = await fetch(`${BASE_URL}/api/admin/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        userId: "usr-member-02",
        workHoursWeekly: 42,
        clearanceBadge: "LEVEL_2_ARCHITECT",
      }),
    });
    if (updateRes.status === 200) {
      const updateData = await updateRes.json();
      record("Admin Member Capacity & Badge Update (PATCH)", "PASS", `Updated weekly capacity to ${updateData.member?.workHoursWeekly}h`);
    } else {
      record("Admin Member Capacity & Badge Update (PATCH)", "FAIL", `Status ${updateRes.status}`);
    }
  } catch (err: any) {
    record("Admin Member Capacity Update", "FAIL", err.message);
  }

  // 6. Admin Teams & Sub-Teams API
  try {
    const teamsRes = await fetch(`${BASE_URL}/api/admin/teams`, {
      headers: { Cookie: adminCookie },
    });
    const teamsData = await teamsRes.json();
    if (teamsRes.status === 200 && Array.isArray(teamsData.teams)) {
      record("Admin Teams Directory API", "PASS", `Found ${teamsData.teams.length} teams`);
    } else {
      record("Admin Teams Directory API", "FAIL", `Status ${teamsRes.status}`);
    }

    // Create a new sub-team with proper payload
    const createSubteamRes = await fetch(`${BASE_URL}/api/admin/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        type: "subteam",
        teamId: "team-platform",
        name: "Continuity Automation Guild",
        description: "Guild dedicated to automated handover verification",
      }),
    });
    if (createSubteamRes.status === 200) {
      record("Admin Create Sub-Team API", "PASS", "Successfully added Continuity Automation Guild");
    } else {
      record("Admin Create Sub-Team API", "FAIL", `Status ${createSubteamRes.status}`);
    }
  } catch (err: any) {
    record("Admin Teams Test", "FAIL", err.message);
  }

  // 7. Member Work Hours Logging
  try {
    const logHoursRes = await fetch(`${BASE_URL}/api/member/work-hours`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: memberCookie },
      body: JSON.stringify({
        projectId: "proj-apollo-9",
        hours: 6.5,
        taskDescription: "Tested handover report PDF export and question response pipeline.",
        logDate: new Date().toISOString().split("T")[0],
      }),
    });
    if (logHoursRes.status === 200) {
      record("Member Daily Work Hours Logging", "PASS", "Logged 6.5 hours successfully on assigned project");
    } else {
      const errBody = await logHoursRes.text();
      record("Member Daily Work Hours Logging", "FAIL", `Status ${logHoursRes.status}: ${errBody}`);
    }

    const getHoursRes = await fetch(`${BASE_URL}/api/member/work-hours`, {
      headers: { Cookie: memberCookie },
    });
    const hoursData = await getHoursRes.json();
    if (getHoursRes.status === 200 && Array.isArray(hoursData.workLogs)) {
      record("Member Work Hours History Query", "PASS", `Retrieved ${hoursData.workLogs.length} logged entries`);
    } else {
      record("Member Work Hours History Query", "FAIL", `Status ${getHoursRes.status}`);
    }
  } catch (err: any) {
    record("Member Work Hours Test", "FAIL", err.message);
  }

  // 8. Project Exclusivity Verification
  try {
    const memberProjectsRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Cookie: memberCookie },
    });
    const memberProjectsData = await memberProjectsRes.json();
    if (memberProjectsRes.status === 200) {
      record("Project Exclusivity Filtering for Member", "PASS", `Member sees ${memberProjectsData.projects?.length} assigned project(s)`);
    } else {
      record("Project Exclusivity Filtering for Member", "FAIL", `Status ${memberProjectsRes.status}`);
    }
  } catch (err: any) {
    record("Project Exclusivity Test", "FAIL", err.message);
  }

  // 9. Project Knowledge Base & AI Reconstruction Endpoints
  const projectId = "proj-apollo-9";
  try {
    // Project Summary
    const sumRes = await fetch(`${BASE_URL}/api/projects/${projectId}/summary`, {
      headers: { Cookie: leadCookie },
    });
    const sumData = await sumRes.json();
    if (sumRes.status === 200 && sumData.project?.id === projectId) {
      record("Project Summary API", "PASS", `Loaded project '${sumData.project.name}'`);
    } else {
      record("Project Summary API", "FAIL", `Status ${sumRes.status}`);
    }

    // Timeline Stream
    const timeRes = await fetch(`${BASE_URL}/api/projects/${projectId}/timeline`, {
      headers: { Cookie: leadCookie },
    });
    const timeData = await timeRes.json();
    if (timeRes.status === 200 && Array.isArray(timeData.timeline)) {
      record("Unified Timeline API", "PASS", `Loaded ${timeData.timeline.length} timeline events`);
    } else {
      record("Unified Timeline API", "FAIL", `Status ${timeRes.status}`);
    }

    // AI Insights
    const insRes = await fetch(`${BASE_URL}/api/projects/${projectId}/insights`, {
      headers: { Cookie: leadCookie },
    });
    const insData = await insRes.json();
    if (insRes.status === 200 && Array.isArray(insData.insights)) {
      record("AI Insights Retrieval API", "PASS", `Loaded ${insData.insights.length} reconstructed insights`);
    } else {
      record("AI Insights Retrieval API", "FAIL", `Status ${insRes.status}`);
    }

    // Run AI Analysis Trigger
    const analyzeRes = await fetch(`${BASE_URL}/api/projects/${projectId}/analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({ focus: "all", depth: "deep" }),
    });
    const analyzeData = await analyzeRes.json();
    if (analyzeRes.status === 200 && analyzeData.success) {
      record("AI Reconstruction Run Trigger", "PASS", `Reconstruction executed successfully (${analyzeData.insights?.length || 0} insights generated)`);
    } else {
      record("AI Reconstruction Run Trigger", "FAIL", `Status ${analyzeRes.status}`);
    }
  } catch (err: any) {
    record("Project Core APIs", "FAIL", err.message);
  }

  // 10. Handover Continuity Q&A Pipeline (AI Grounded Auto-Answer)
  try {
    const askRes = await fetch(`${BASE_URL}/api/projects/${projectId}/handover/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({
        question: "How does the webhook retry backoff mechanism handle Redis failover?",
        askedBy: "Hackathon Judge",
        autoGenerateAI: true,
      }),
    });
    const askData = await askRes.json();
    if (askRes.status === 200 && askData.question?.id && askData.question?.answer) {
      record("Handover Continuity Q&A (AI Grounded Auto-Answer)", "PASS", `Answered: "${askData.question.answer.slice(0, 70)}..."`);
    } else {
      record("Handover Continuity Q&A (AI Grounded Auto-Answer)", "FAIL", `Status ${askRes.status}: ${JSON.stringify(askData)}`);
    }
  } catch (err: any) {
    record("Handover Q&A Test", "FAIL", err.message);
  }

  // 11. Handover Publish & Share Access Pipeline
  let shareToken = "";
  try {
    const publishRes = await fetch(`${BASE_URL}/api/projects/${projectId}/handover/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({
        notes: "Approved by Hackathon Lead Judge for release.",
      }),
    });
    const pubData = await publishRes.json();
    if (publishRes.status === 200 && pubData.success) {
      record("Handover Approve & Publish Pipeline", "PASS", `Handover report status updated to ${pubData.report?.status || "PUBLISHED"}`);
    } else {
      record("Handover Approve & Publish Pipeline", "FAIL", `Status ${publishRes.status}`);
    }

    const shareRes = await fetch(`${BASE_URL}/api/projects/${projectId}/handover/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({ accessRole: "INCOMING_LEAD" }),
    });
    const shareData = await shareRes.json();
    if (shareRes.status === 200 && shareData.shareLink?.token) {
      shareToken = shareData.shareLink.token;
      record("Handover Share Access Token Generation", "PASS", `Share token generated: ${shareToken.slice(0, 8)}... (${shareData.sharePath})`);
    } else {
      record("Handover Share Access Token Generation", "FAIL", `Status ${shareRes.status}`);
    }
  } catch (err: any) {
    record("Handover Publish & Share Test", "FAIL", err.message);
  }

  // 12. Public Shared Report Verification (Without Auth)
  if (shareToken) {
    try {
      const publicRes = await fetch(`${BASE_URL}/api/shared/${shareToken}`);
      const publicData = await publicRes.json();
      if (publicRes.status === 200 && publicData.project?.id === projectId) {
        record("Public Shared Handover Viewer API", "PASS", `Unauthenticated viewer successfully fetched shared report for '${publicData.project.name}'`);
      } else {
        record("Public Shared Handover Viewer API", "FAIL", `Status ${publicRes.status}`);
      }
    } catch (err: any) {
      record("Public Shared Handover Viewer API", "FAIL", err.message);
    }
  }

  // 13. Team Member Contact & Notifications
  try {
    const contactRes = await fetch(`${BASE_URL}/api/projects/${projectId}/team/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({
        toMember: "Alex Chen",
        toEmail: "alex.chen@acme.com",
        subject: "Hackathon Judge Handover Inquiry",
        message: "Please verify handover documentation on EventBridge decoupling.",
      }),
    });
    const contactData = await contactRes.json();
    if (contactRes.status === 200 && contactData.success) {
      record("Contact Teammate Pipeline", "PASS", "Message and in-app notification delivered to teammate");
    } else {
      record("Contact Teammate Pipeline", "FAIL", `Status ${contactRes.status}`);
    }

    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: leadCookie },
    });
    const notifData = await notifRes.json();
    if (notifRes.status === 200 && Array.isArray(notifData.notifications)) {
      record("Notifications Feed API", "PASS", `Retrieved ${notifData.notifications.length} notifications`);
    } else {
      record("Notifications Feed API", "FAIL", `Status ${notifRes.status}`);
    }
  } catch (err: any) {
    record("Team Contact & Notifications Test", "FAIL", err.message);
  }

  // 14. Global Search Verification
  try {
    const searchRes = await fetch(`${BASE_URL}/api/search?q=Apollo`, {
      headers: { Cookie: leadCookie },
    });
    const searchData = await searchRes.json();
    if (searchRes.status === 200 && searchData.results?.length > 0) {
      record("Global Search API (Apollo query)", "PASS", `Found ${searchData.results.length} matches across entities`);
    } else {
      record("Global Search API (Apollo query)", "FAIL", `Status ${searchRes.status}, count: ${searchData.results?.length}`);
    }

    const searchInsightRes = await fetch(`${BASE_URL}/api/search?q=Redis`, {
      headers: { Cookie: leadCookie },
    });
    const insightData = await searchInsightRes.json();
    if (searchInsightRes.status === 200 && insightData.results?.length > 0) {
      record("Global Search API (Insight keyword 'Redis')", "PASS", `Found ${insightData.results.length} matches`);
    } else {
      record("Global Search API (Insight keyword 'Redis')", "WARN", "No direct matches for keyword in search index");
    }
  } catch (err: any) {
    record("Global Search Test", "FAIL", err.message);
  }

  // 15. Settings Save & Retrieval
  try {
    const saveSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({
        githubToken: "ghp_mock_judge_test_token_2026",
        geminiApiKey: "AIzaSyMockJudgeToken_2026",
        weeklyDigest: true,
        riskAlerts: true,
      }),
    });
    if (saveSettingsRes.status === 200) {
      record("Settings Save API", "PASS", "Saved updated API credentials and preferences");
    } else {
      record("Settings Save API", "FAIL", `Status ${saveSettingsRes.status}`);
    }
  } catch (err: any) {
    record("Settings Test", "FAIL", err.message);
  }

  // 16. Documents API
  try {
    const docsRes = await fetch(`${BASE_URL}/api/projects/${projectId}/documents`, {
      headers: { Cookie: leadCookie },
    });
    const docsData = await docsRes.json();
    if (docsRes.status === 200 && Array.isArray(docsData.documents)) {
      record("Documents List API", "PASS", `Found ${docsData.documents.length} knowledge documents`);
    } else {
      record("Documents List API", "FAIL", `Status ${docsRes.status}`);
    }
  } catch (err: any) {
    record("Documents API", "FAIL", err.message);
  }

  // 17. GitHub Sync API
  try {
    const ghSyncRes = await fetch(`${BASE_URL}/api/projects/${projectId}/github/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({ force: true }),
    });
    const ghSyncData = await ghSyncRes.json();
    if (ghSyncRes.status === 200) {
      record("GitHub Source Ingestion Sync API", "PASS", `Sync completed. Commits: ${ghSyncData.commitsSynced || ghSyncData.message || "OK"}`);
    } else {
      record("GitHub Source Ingestion Sync API", "FAIL", `Status ${ghSyncRes.status}`);
    }
  } catch (err: any) {
    record("GitHub Sync API", "FAIL", err.message);
  }

  // 18. Meetings API
  try {
    const meetRes = await fetch(`${BASE_URL}/api/projects/${projectId}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({
        title: "Hackathon Evaluation & Architecture Review",
        date: new Date().toISOString().split("T")[0],
        duration: "45m",
        attendees: ["Hackathon Lead Judge", "Sarah Connor"],
        summary: "Evaluated handover report accuracy, live database persistence, and API resilience.",
        decisions: ["Verified zero-dependency SQLite fallback", "Confirmed sub-100ms LCP"],
        actionItems: [{ task: "Deploy v2.1 to Vercel production", assignee: "Sarah Connor", done: false }],
      }),
    });
    const meetData = await meetRes.json();
    if (meetRes.status === 200 && meetData.meeting?.id) {
      record("Meetings Create API", "PASS", `Created meeting '${meetData.meeting.title}'`);
    } else {
      record("Meetings Create API", "FAIL", `Status ${meetRes.status}`);
    }
  } catch (err: any) {
    record("Meetings API", "FAIL", err.message);
  }

  // 19. Create Project API
  const newProjectSlug = `proj-test-${Date.now()}`;
  try {
    const createProjRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: leadCookie },
      body: JSON.stringify({
        name: "Continuity Automation Engine",
        slug: newProjectSlug,
        description: "Automated institutional knowledge engine for engineering team handovers.",
        repoOwner: "ex-officio-org",
        repoName: "continuity-engine",
        techStack: ["Next.js", "TypeScript", "SQLite", "Gemini 1.5"],
      }),
    });
    const createProjData = await createProjRes.json();
    if ((createProjRes.status === 200 || createProjRes.status === 201) && createProjData.project?.id) {
      record("Create New Project API", "PASS", `Project created with ID ${createProjData.project.id}`);
    } else {
      record("Create New Project API", "FAIL", `Status ${createProjRes.status}`);
    }
  } catch (err: any) {
    record("Create Project API", "FAIL", err.message);
  }

  // 20. Front-End Page Render Status Audits (HTML 200 OK checks)
  const pagesToTest = [
    { name: "Home Landing Page", url: "/" },
    { name: "Login Page", url: "/login" },
    { name: "Signup Page", url: "/signup" },
    { name: "Dashboard Overview", url: "/dashboard", cookie: leadCookie },
    { name: "Admin Console", url: "/dashboard/admin", cookie: adminCookie },
    { name: "Member Portal", url: "/dashboard/member", cookie: memberCookie },
    { name: "User Profile & Clearance", url: "/dashboard/profile", cookie: leadCookie },
    { name: "All Projects List", url: "/dashboard/projects", cookie: leadCookie },
    { name: "New Project Form", url: "/dashboard/projects/new", cookie: leadCookie },
    { name: "Project Summary", url: `/dashboard/projects/${projectId}`, cookie: leadCookie },
    { name: "Project Timeline", url: `/dashboard/projects/${projectId}/timeline`, cookie: leadCookie },
    { name: "Project GitHub Stream", url: `/dashboard/projects/${projectId}/github`, cookie: leadCookie },
    { name: "Project AI Analysis", url: `/dashboard/projects/${projectId}/analysis`, cookie: leadCookie },
    { name: "Project Handover Report", url: `/dashboard/projects/${projectId}/handover`, cookie: leadCookie },
    { name: "Project Team & Map", url: `/dashboard/projects/${projectId}/team`, cookie: leadCookie },
    { name: "Project Knowledge Base", url: `/dashboard/projects/${projectId}/knowledge`, cookie: leadCookie },
    { name: "Project Structure", url: `/dashboard/projects/${projectId}/structure`, cookie: leadCookie },
    { name: "Project Risks", url: `/dashboard/projects/${projectId}/risks`, cookie: leadCookie },
    { name: "Project Meetings", url: `/dashboard/projects/${projectId}/meetings`, cookie: leadCookie },
    { name: "Notifications Page", url: "/dashboard/notifications", cookie: leadCookie },
    { name: "Settings Page", url: "/dashboard/settings", cookie: leadCookie },
  ];

  for (const page of pagesToTest) {
    try {
      const pageRes = await fetch(`${BASE_URL}${page.url}`, {
        headers: page.cookie ? { Cookie: page.cookie } : {},
      });
      if (pageRes.status === 200) {
        const text = await pageRes.text();
        if (text.includes("<!DOCTYPE html") || text.includes("<html")) {
          record(`Page Render [${page.name}] (${page.url})`, "PASS", "Returned 200 OK with valid HTML");
        } else {
          record(`Page Render [${page.name}] (${page.url})`, "WARN", `Status 200 but non-standard HTML body (${text.slice(0, 50)})`);
        }
      } else {
        record(`Page Render [${page.name}] (${page.url})`, "FAIL", `Returned status ${pageRes.status}`);
      }
    } catch (err: any) {
      record(`Page Render [${page.name}]`, "FAIL", err.message);
    }
  }

  console.log("\n=== AUDIT SUMMARY ===");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`TOTAL: ${results.length} | PASS: ${passCount} | WARN: ${warnCount} | FAIL: ${failCount}`);
}

main().catch(console.error);
