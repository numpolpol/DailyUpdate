import type { DailyLog, NewDailyLog, TaskStatus } from '../types';

// =================================================================
// DEVELOPER NOTE: MOCK GOOGLE SHEET API
// =================================================================
// This file simulates API interaction with a backend that would manage
// Google Sheets data. Direct client-side interaction is not secure.
// This mock now generates 30 days of data for richer analytics.
// =================================================================

const generateMockData = (days: number): DailyLog[] => {
    const data: DailyLog[] = [];
    const today = new Date();
    const taskDescriptions = [
        'Implement user authentication feature',
        'Design new dashboard UI components',
        'Fix critical bug in payment processing',
        'Refactor legacy API endpoints',
        'Write unit tests for the search module',
        'Deploy latest build to staging server',
        'Update documentation for v2.0 release',
        'Investigate performance issues on mobile',
        'Integrate third-party analytics service',
        'Code review for pull request #145',
    ];
    const blockers = [
        'Waiting for API keys from backend team',
        'Design mockups are not finalized',
        'Staging server is down',
        'Unclear requirements for the new feature',
    ];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
        }

        const numTasks = Math.floor(Math.random() * 4) + 2; // 2 to 5 tasks
        const tasks = [];
        for (let j = 0; j < numTasks; j++) {
            const status: TaskStatus = j < numTasks / 2 ? 'Done' : (['In Progress', 'Wait Review', 'Wait Test'] as TaskStatus[])[Math.floor(Math.random() * 3)];
            const hasBlocker = Math.random() > 0.8 && status !== 'Done';
            
            tasks.push({
                id: `t-${i}-${j}`,
                description: taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)],
                status: status,
                blockers: hasBlocker ? [blockers[Math.floor(Math.random() * blockers.length)]] : [],
                timeSpent: Math.round((Math.random() * 4 + 1) * 2) / 2, // 1 to 5 hours, in 0.5 increments
            });
        }

        data.push({
            id: `log-${i + 1}`,
            date: date.toISOString().split('T')[0],
            tasks: tasks,
            pullRequests: [
                { id: `pr-${i}-1`, url: `https://github.com/example/repo/pull/${200 - i}`, status: 'Approved' },
            ],
        });
    }
    return data;
};


let mockDatabase: DailyLog[] = generateMockData(30);

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchLogs = async (): Promise<DailyLog[]> => {
  console.log('Simulating fetching logs from Google Sheet...');
  await delay(1000); // Simulate 1 second delay
  // Sort by date descending to ensure the latest is first
  mockDatabase.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return [...mockDatabase];
};

export const saveLog = async (newLog: NewDailyLog): Promise<DailyLog> => {
  console.log('Simulating saving log to Google Sheet...', newLog);
  await delay(700); // Simulate 0.7 second delay

  const savedLog: DailyLog = {
    ...newLog,
    id: `log-${new Date().getTime()}`,
    date: new Date().toISOString().split('T')[0],
  };

  // Prepend to our mock database
  mockDatabase = [savedLog, ...mockDatabase];
  
  return savedLog;
};

export const updateLog = async (updatedLog: DailyLog): Promise<DailyLog> => {
  console.log('Simulating updating log in Google Sheet...', updatedLog);
  await delay(700);
  
  const logIndex = mockDatabase.findIndex(log => log.id === updatedLog.id);
  if (logIndex === -1) {
    throw new Error("Log not found");
  }

  mockDatabase[logIndex] = updatedLog;

  return updatedLog;
}
