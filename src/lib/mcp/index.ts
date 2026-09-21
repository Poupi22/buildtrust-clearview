import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjectsTool from "./tools/list-projects";
import getProjectTool from "./tools/get-project";
import listReportsTool from "./tools/list-reports";
import getReportTool from "./tools/get-report";
import listIssuesTool from "./tools/list-issues";
import listMyTasksTool from "./tools/list-tasks";
import createIssueTool from "./tools/create-issue";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "buildtrust-app",
  title: "BuildTrust App",
  version: "0.1.0",
  instructions:
    "Tools for BuildTrust, a construction transparency platform. Use `list_projects` to find projects, `get_project` for milestones and progress, `list_reports`/`get_report` for daily and weekly site journals, `list_issues` and `create_issue` for site issues, and `list_my_tasks` for the signed-in user's assignments. All data is scoped to the signed-in user's permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listProjectsTool,
    getProjectTool,
    listReportsTool,
    getReportTool,
    listIssuesTool,
    listMyTasksTool,
    createIssueTool,
  ],
});
