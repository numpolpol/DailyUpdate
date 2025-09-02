import React from 'react';
import type { DailyLog } from '../types';
import { Button } from './Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { ActivityHeatmap } from './ActivityHeatmap';
import { TaskTimeRanking } from './TaskTimeRanking';
import { CommonBlockers } from './CommonBlockers';

interface SummaryViewProps {
  logs: DailyLog[];
}

export const SummaryView: React.FC<SummaryViewProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
       <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Overall Summary
        </h2>
        <p className="text-slate-500 dark:text-slate-400">No data available to generate a summary.</p>
       </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Productivity Heatmap
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Daily completed tasks over the last 5 weeks. Darker shades indicate more completed tasks.
        </p>
        <ActivityHeatmap logs={logs} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Most Time-Consuming Tasks
            </h2>
            <TaskTimeRanking logs={logs} />
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Frequent Blockers
            </h2>
            <CommonBlockers logs={logs} />
          </div>
      </div>
    </div>
  );
};
