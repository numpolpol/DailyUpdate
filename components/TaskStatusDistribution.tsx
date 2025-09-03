
import React, { useMemo } from 'react';
import type { DailyLog, Task, TaskStatus } from '../types';

interface TaskStatusDistributionProps {
  logs: DailyLog[];
}

const statusColors: Record<TaskStatus, string> = {
  'Done': 'bg-green-500',
  'In Progress': 'bg-blue-500',
  'Wait Review': 'bg-purple-500',
  'Wait Test': 'bg-yellow-500',
  'Cancel': 'bg-red-500',
};

export const TaskStatusDistribution: React.FC<TaskStatusDistributionProps> = ({ logs }) => {
  const statusCounts = useMemo(() => {
    const latestTasks = new Map<string, Task>();
    
    // Sort logs by date to ensure we get the latest status
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedLogs.forEach(log => {
      log.tasks.forEach(task => {
        latestTasks.set(task.persistentId || task.id, task);
      });
    });

    const counts: Record<TaskStatus, number> = {
      'In Progress': 0,
      'Wait Test': 0,
      'Wait Review': 0,
      'Done': 0,
      'Cancel': 0,
    };

    let total = 0;
    latestTasks.forEach(task => {
      if (counts[task.status] !== undefined) {
        counts[task.status]++;
        total++;
      }
    });

    if (total === 0) return [];

    return (Object.entries(counts) as [TaskStatus, number][])
        .map(([status, count]) => ({
            status,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0',
        }))
        .filter(item => item.count > 0)
        .sort((a,b) => b.count - a.count);

  }, [logs]);

  if (statusCounts.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No task data to show distribution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {statusCounts.map(({ status, count, percentage }) => (
        <div key={status}>
          <div className="flex justify-between items-center mb-1 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${statusColors[status]}`}></span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{status}</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{count} ({percentage}%)</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${statusColors[status]}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};