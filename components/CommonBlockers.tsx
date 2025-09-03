import React from 'react';
import type { DailyLog, Blocker } from '../types';

interface CommonBlockersProps {
  logs: DailyLog[];
}

export const CommonBlockers: React.FC<CommonBlockersProps> = ({ logs }) => {
  const blockerCounts: Record<string, number> = {};

  logs.forEach(log => {
    log.tasks.forEach(task => {
      (task.blockers || []).forEach(blocker => {
        const description = typeof blocker === 'string' ? blocker : (blocker as Blocker).description;
        const cleanBlocker = description.trim();
        if (cleanBlocker) {
          blockerCounts[cleanBlocker] = (blockerCounts[cleanBlocker] || 0) + 1;
        }
      });
    });
  });

  const sortedBlockers = Object.entries(blockerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5

  if (sortedBlockers.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No recurring blockers found. Great job staying on track!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sortedBlockers.map(([blocker, count]) => (
        <li key={blocker} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-800 dark:text-slate-200 pr-4">{blocker}</p>
            <span className="flex-shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-1 rounded-full">
              {count} {count > 1 ? 'times' : 'time'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};