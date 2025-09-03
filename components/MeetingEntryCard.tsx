
import React from 'react';
import type { DailyLog, TaskStatus } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface MeetingEntryCardProps {
  log: DailyLog;
}

const statusColors: Record<TaskStatus, string> = {
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Wait Review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Wait Test': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Cancel': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
    {status}
  </span>
);

export const MeetingEntryCard: React.FC<MeetingEntryCardProps> = ({ log }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-[1.01]">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </h3>
        </div>
        
        {log.summary && (
          <div className="mb-6 p-4 border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-r-md">
            <h4 className="flex items-center font-semibold text-blue-800 dark:text-blue-300 mb-2">
              <SparklesIcon className="w-5 h-5 mr-2" />
              AI Summary
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">{log.summary}</p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-600 dark:text-slate-300">Tasks</h4>
          <ul className="space-y-2">
            {log.tasks.length > 0 ? log.tasks.map(task => (
              <li key={task.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                <p className="text-sm text-slate-800 dark:text-slate-200">{task.description}</p>
                <StatusBadge status={task.status} />
              </li>
            )) : (
              <li className="text-sm text-slate-500 dark:text-slate-400">No tasks recorded for this day.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
