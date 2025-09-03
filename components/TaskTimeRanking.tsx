import React, { useMemo } from 'react';
import type { DailyLog, Task } from '../types';

interface TaskTimeRankingProps {
  logs: DailyLog[];
}

interface CompletedTask {
  description: string;
  durationInDays: number;
}

export const TaskTimeRanking: React.FC<TaskTimeRankingProps> = ({ logs }) => {
  const sortedTasks = useMemo(() => {
    const tasksData = new Map<string, { description: string; startDate: Date; endDate?: Date }>();

    // Sort logs by date ascending to process tasks chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedLogs.forEach(log => {
      log.tasks.forEach(task => {
        if (!task.startDate) return; // Skip tasks without a start date
        
        const pId = task.persistentId || task.id;
        const currentData = tasksData.get(pId);
        const taskStartDate = new Date(task.startDate + 'T00:00:00Z');

        if (!currentData) {
          tasksData.set(pId, {
            description: task.description,
            startDate: taskStartDate,
            endDate: task.status === 'Done' && task.endDate ? new Date(task.endDate + 'T00:00:00Z') : undefined,
          });
        } else {
          // Update description to the latest one
          currentData.description = task.description;
          
          // Ensure we have the earliest start date
          if (taskStartDate < currentData.startDate) {
            currentData.startDate = taskStartDate;
          }

          // If the task is marked as Done, set its end date.
          // This will overwrite previous end dates, capturing the final completion date.
          if (task.status === 'Done' && task.endDate) {
            currentData.endDate = new Date(task.endDate + 'T00:00:00Z');
          }
        }
      });
    });

    const completedTasks: CompletedTask[] = [];
    tasksData.forEach((data) => {
      if (data.startDate && data.endDate) {
        // Ensure endDate is not before startDate
        if (data.endDate < data.startDate) return;

        const duration = Math.round((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        completedTasks.push({
          description: data.description,
          durationInDays: duration,
        });
      }
    });

    return completedTasks
      .sort((a, b) => b.durationInDays - a.durationInDays)
      .slice(0, 5); // Top 5
  }, [logs]);

  const maxDuration = sortedTasks.length > 0 ? sortedTasks[0].durationInDays : 0;

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No completed tasks with duration data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map(({ description, durationInDays }) => (
        <div key={description} className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <p className="text-slate-700 dark:text-slate-300 truncate pr-4">{description}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{durationInDays} {durationInDays > 1 ? 'days' : 'day'}</p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${maxDuration > 0 ? (durationInDays / maxDuration) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
