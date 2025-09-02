import React from 'react';
import type { DailyLog } from '../types';
import { BlockerIcon } from './icons/BlockerIcon';

interface BlockedTask {
  logDate: string;
  taskDescription: string;
  blockers: string[];
}

interface BlockerListProps {
  logs: DailyLog[];
}

export const BlockerList: React.FC<BlockerListProps> = ({ logs }) => {
  const activeBlockers: BlockedTask[] = logs
    .flatMap(log => 
      log.tasks.map(task => ({ ...task, logDate: log.date }))
    )
    .filter(task => task.blockers && task.blockers.length > 0 && task.status !== 'Done')
    .map(task => ({
      logDate: task.logDate,
      taskDescription: task.description,
      blockers: task.blockers,
    }))
    .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

  if (activeBlockers.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No active blockers. Keep up the great work!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeBlockers.map((item, index) => (
        <div key={index} className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.taskDescription}</p>
          <div className="mt-2 flex items-start gap-2 text-red-700 dark:text-red-300">
            <BlockerIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <ul className="list-disc list-inside space-y-1">
              {item.blockers.map((blocker, idx) => (
                <li key={idx} className="text-sm">{blocker}</li>
              ))}
            </ul>
          </div>
          <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-2">
            Logged on: {new Date(item.logDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  );
};