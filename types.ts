export type TaskStatus = 'In Progress' | 'Wait Test' | 'Wait Review' | 'Done' | 'Cancel';

export const TASK_STATUSES: TaskStatus[] = ['In Progress', 'Wait Test', 'Wait Review', 'Done', 'Cancel'];

export type PullRequestStatus = 'Reviewing' | 'Approved' | 'Request Change';

export const PULL_REQUEST_STATUSES: PullRequestStatus[] = ['Reviewing', 'Approved', 'Request Change'];

export interface Blocker {
  id: string;
  description: string;
  resolved: boolean;
}

export interface Task {
  id: string;
  persistentId: string;
  description: string;
  status: TaskStatus;
  blockers: Blocker[];
  timeSpent: number; // in hours
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
}

export interface PullRequest {
  id: string;
  url: string;
  status: PullRequestStatus;
}

export interface NewDailyLog {
  tasks: Task[];
  pullRequests: PullRequest[];
  // FIX: Add optional 'summary' property to support AI-generated summaries and resolve type errors.
  summary?: string;
  date?: string;
}

export interface DailyLog extends NewDailyLog {
  id: string;
  date: string;
}