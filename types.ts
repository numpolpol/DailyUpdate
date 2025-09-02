export type TaskStatus = 'In Progress' | 'Pending' | 'Wait Test' | 'Wait Review' | 'Done';

export const TASK_STATUSES: TaskStatus[] = ['In Progress', 'Pending', 'Wait Test', 'Wait Review', 'Done'];

export type PullRequestStatus = 'Reviewing' | 'Approved' | 'Request Change';

export const PULL_REQUEST_STATUSES: PullRequestStatus[] = ['Reviewing', 'Approved', 'Request Change'];

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  blockers: string[];
  timeSpent: number; // in hours
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
}

export interface DailyLog extends NewDailyLog {
  id: string;
  date: string;
}
