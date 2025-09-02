import React from 'react';
import type { DailyLog } from '../types';

interface ActivityHeatmapProps {
  logs: DailyLog[];
}

const getColor = (count: number) => {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-700';
  if (count <= 1) return 'bg-blue-200 dark:bg-blue-800';
  if (count <= 3) return 'bg-blue-400 dark:bg-blue-600';
  if (count <= 5) return 'bg-blue-600 dark:bg-blue-400';
  return 'bg-blue-800 dark:bg-blue-300';
};

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ logs }) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 34); // 35 days for a 5x7 grid

  const dataByDate: Map<string, number> = new Map();
  logs.forEach(log => {
    const completedTasks = log.tasks.filter(task => task.status === 'Done').length;
    dataByDate.set(log.date, completedTasks);
  });

  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split('T')[0];
    days.push({
      date: dateString,
      count: dataByDate.get(dateString) || 0,
    });
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ date, count }) => (
          <div key={date} className="relative group">
            <div
              className={`w-full aspect-square rounded ${getColor(count)}`}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {count} tasks on {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
            </div>
          </div>
        ))}
      </div>
       <div className="flex items-center justify-end gap-x-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700"></div>
          <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-800"></div>
          <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-600"></div>
          <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-400"></div>
          <div className="w-4 h-4 rounded bg-blue-800 dark:bg-blue-300"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
