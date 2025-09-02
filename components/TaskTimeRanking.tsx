import React from 'react';
import type { DailyLog } from '../types';

interface TaskTimeRankingProps {
  logs: DailyLog[];
}

export const TaskTimeRanking: React.FC<TaskTimeRankingProps> = ({ logs }) => {
  const timeByTask: Record<string, number> = {};

  logs.forEach(log => {
    log.tasks.forEach(task => {
      const description = task.description.trim();
      if (task.timeSpent > 0) {
        timeByTask[description] = (timeByTask[description] || 0) + task.timeSpent;
      }
    });
  });

  const sortedTasks = Object.entries(timeByTask)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5

  const maxTime = sortedTasks.length > 0 ? sortedTasks[0][1] : 0;

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No time tracking data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map(([description, time]) => (
        <div key={description} className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <p className="text-slate-700 dark:text-slate-300 truncate pr-4">{description}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{time.toFixed(1)} hrs</p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${maxTime > 0 ? (time / maxTime) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
