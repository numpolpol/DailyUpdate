
import React, { useMemo } from 'react';
import type { DailyLog, Blocker, Task } from '../types';

interface KeyMetricsProps {
    logs: DailyLog[];
}

interface MetricCardProps {
    label: string;
    value: string | number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center md:text-left">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
);

export const KeyMetrics: React.FC<KeyMetricsProps> = ({ logs }) => {
    const metrics = useMemo(() => {
        const latestTasks = new Map<string, Task>();
        const completedTasksWithDuration: number[] = [];
        const tasksData = new Map<string, { startDate?: Date, endDate?: Date }>();

        // Sort logs to process chronologically
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sortedLogs.forEach(log => {
            log.tasks.forEach(task => {
                const pId = task.persistentId || task.id;
                latestTasks.set(pId, task); // Overwrite to keep the latest task state

                const taskDates = tasksData.get(pId) || {};
                
                if (task.startDate) {
                    const newStartDate = new Date(task.startDate + 'T00:00:00Z');
                    if (!taskDates.startDate || newStartDate < taskDates.startDate) {
                        taskDates.startDate = newStartDate;
                    }
                }

                if ((task.status === 'Done' || task.status === 'Cancel') && task.endDate) {
                    taskDates.endDate = new Date(task.endDate + 'T00:00:00Z');
                }
                tasksData.set(pId, taskDates);
            });
        });

        tasksData.forEach(data => {
            if (data.startDate && data.endDate && data.endDate >= data.startDate) {
                const duration = Math.round((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                completedTasksWithDuration.push(duration);
            }
        });

        const totalTasks = latestTasks.size;
        const completedCount = Array.from(latestTasks.values()).filter(t => t.status === 'Done' || t.status === 'Cancel').length;

        const activeBlockersCount = Array.from(latestTasks.values()).filter(task => 
                (task.status !== 'Done' && task.status !== 'Cancel') &&
                task.blockers &&
                task.blockers.some(b => typeof b === 'string' || !(b as Blocker).resolved)
            ).length;
        
        const avgCompletionTime = completedTasksWithDuration.length > 0
            ? (completedTasksWithDuration.reduce((a, b) => a + b, 0) / completedTasksWithDuration.length).toFixed(1)
            : 'N/A';

        return {
            totalTasks,
            completedCount,
            activeBlockersCount,
            avgCompletionTime,
        };
    }, [logs]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Tasks" value={metrics.totalTasks} />
            <MetricCard label="Completed" value={metrics.completedCount} />
            <MetricCard label="Active Blockers" value={metrics.activeBlockersCount} />
            <MetricCard label="Avg. Completion" value={metrics.avgCompletionTime !== 'N/A' ? `${metrics.avgCompletionTime} days` : 'N/A'} />
        </div>
    );
};