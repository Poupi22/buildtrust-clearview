export type ProjectStatus = "active" | "on-hold" | "completed" | "delayed";
export type ReportStatus = "draft" | "submitted" | "under-review" | "approved" | "rejected" | "published";
export type MilestoneStatus = "pending" | "in-progress" | "completed" | "delayed";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type UserRole = "super-admin" | "company-admin" | "engineer" | "client";

export interface Project {
  id: string;
  title: string;
  code: string;
  clientName: string;
  type: string;
  location: string;
  startDate: string;
  plannedEndDate: string;
  status: ProjectStatus;
  completion: number;
  currentPhase: string;
  teamCount: number;
  recentActivity: string;
}

export interface Milestone {
  id: string;
  title: string;
  plannedDate: string;
  actualDate?: string;
  status: MilestoneStatus;
  progress: number;
}

export interface DailyReport {
  id: string;
  date: string;
  author: string;
  weather: string;
  workforceCount: number;
  tasksCompleted: string[];
  issues: string[];
  status: ReportStatus;
  photoCount: number;
}

export interface Issue {
  id: string;
  title: string;
  severity: IssueSeverity;
  status: "open" | "in-progress" | "resolved" | "closed";
  dateIdentified: string;
  description: string;
  impact: string;
}

export const currentUser = {
  name: "Jean-Marc Dupont",
  role: "company-admin" as UserRole,
  company: "Constructions Solidaires S.A.",
  avatar: "JD",
};

export const projects: Project[] = [
  {
    id: "p1",
    title: "Résidence Les Jardins du Lac",
    code: "RJL-2025",
    clientName: "Famille Mbarga",
    type: "Residential Construction",
    location: "Yaoundé, Cameroon",
    startDate: "2025-01-15",
    plannedEndDate: "2025-12-30",
    status: "active",
    completion: 42,
    currentPhase: "Superstructure",
    teamCount: 8,
    recentActivity: "Weekly report submitted 2h ago",
  },
  {
    id: "p2",
    title: "Centre Commercial Akwa Plaza",
    code: "CAP-2024",
    clientName: "Groupe Fotso Investments",
    type: "Commercial Building",
    location: "Douala, Cameroon",
    startDate: "2024-06-01",
    plannedEndDate: "2026-03-31",
    status: "active",
    completion: 67,
    currentPhase: "Finishing Works",
    teamCount: 14,
    recentActivity: "Milestone approved yesterday",
  },
  {
    id: "p3",
    title: "Route Nationale N3 - Tronçon B",
    code: "RN3B-2025",
    clientName: "Ministère des Travaux Publics",
    type: "Road Works",
    location: "Bafoussam - Bamenda",
    startDate: "2025-02-01",
    plannedEndDate: "2026-06-30",
    status: "delayed",
    completion: 18,
    currentPhase: "Excavation",
    teamCount: 22,
    recentActivity: "Delay report filed 5h ago",
  },
  {
    id: "p4",
    title: "Pont sur la Sanaga - Phase 2",
    code: "PSG-2024",
    clientName: "Agence Routière Nationale",
    type: "Bridge Works",
    location: "Edéa, Cameroon",
    startDate: "2024-09-15",
    plannedEndDate: "2025-09-15",
    status: "on-hold",
    completion: 55,
    currentPhase: "Substructure",
    teamCount: 11,
    recentActivity: "On hold - awaiting permits",
  },
];

export const milestones: Milestone[] = [
  { id: "m1", title: "Site Clearing", plannedDate: "2025-01-20", actualDate: "2025-01-22", status: "completed", progress: 100 },
  { id: "m2", title: "Foundation Works", plannedDate: "2025-03-01", actualDate: "2025-03-10", status: "completed", progress: 100 },
  { id: "m3", title: "Substructure", plannedDate: "2025-04-15", actualDate: "2025-04-20", status: "completed", progress: 100 },
  { id: "m4", title: "Superstructure", plannedDate: "2025-06-30", status: undefined, progress: 60 },
  { id: "m5", title: "Roofing", plannedDate: "2025-08-15", status: "pending", progress: 0 },
  { id: "m6", title: "Electrical & Plumbing", plannedDate: "2025-09-30", status: "pending", progress: 0 },
  { id: "m7", title: "Finishing", plannedDate: "2025-11-15", status: "pending", progress: 0 },
  { id: "m8", title: "Handover", plannedDate: "2025-12-30", status: "pending", progress: 0 },
];
// fix m4 status
milestones[3].status = "in-progress";

export const dailyReports: DailyReport[] = [
  {
    id: "dr1",
    date: "2026-03-13",
    author: "Ing. Paul Nkembi",
    weather: "Sunny, 32°C",
    workforceCount: 18,
    tasksCompleted: ["Column casting - Block B Level 2", "Reinforcement tying - Block A Level 3"],
    issues: ["Cement delivery delayed by 4 hours"],
    status: "submitted",
    photoCount: 6,
  },
  {
    id: "dr2",
    date: "2026-03-12",
    author: "Ing. Paul Nkembi",
    weather: "Partly cloudy, 29°C",
    workforceCount: 22,
    tasksCompleted: ["Formwork installation - Block B Level 2", "Concrete curing inspection"],
    issues: [],
    status: "published",
    photoCount: 8,
  },
  {
    id: "dr3",
    date: "2026-03-11",
    author: "Ing. Sarah Etonde",
    weather: "Rainy morning, cleared afternoon",
    workforceCount: 12,
    tasksCompleted: ["Site drainage maintenance"],
    issues: ["Work halted 3 hours due to heavy rain"],
    status: "approved",
    photoCount: 4,
  },
];

export const issues: Issue[] = [
  {
    id: "i1",
    title: "Cement Supply Shortage",
    severity: "high",
    status: "in-progress",
    dateIdentified: "2026-03-10",
    description: "Main supplier unable to deliver for 5 days due to transport strike.",
    impact: "Potential 1-week delay on column casting schedule",
  },
  {
    id: "i2",
    title: "Reinforcement Bar Quality Concern",
    severity: "medium",
    status: "open",
    dateIdentified: "2026-03-08",
    description: "Batch B-2204 rebar showing surface rust beyond acceptable tolerance.",
    impact: "Need lab test results before use in structural elements",
  },
  {
    id: "i3",
    title: "Access Road Erosion",
    severity: "low",
    status: "resolved",
    dateIdentified: "2026-02-28",
    description: "Heavy rains caused erosion on temporary access road to site.",
    impact: "Resolved - gravel refill completed March 2",
  },
];

export const dashboardMetrics = {
  totalProjects: 4,
  activeProjects: 2,
  delayedProjects: 1,
  pendingApprovals: 3,
  reportsThisWeek: 12,
  complianceRate: 87,
  totalMilestones: 32,
  completedMilestones: 14,
};
