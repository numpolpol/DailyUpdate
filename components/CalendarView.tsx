
import React, { useState, useMemo } from 'react';
import type { DailyLog, Task, TaskStatus } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface CalendarViewProps {
  logs: DailyLog[];
  onDayDoubleClick: (date: string) => void;
  onDayExport: (date: string) => void;
}

const statusClasses: Record<TaskStatus, { bg: string; text: string }> = {
  'Done': { bg: 'bg-green-500 dark:bg-green-600', text: 'text-white' },
  'In Progress': { bg: 'bg-blue-500 dark:bg-blue-600', text: 'text-white' },
  'Wait Review': { bg: 'bg-purple-500 dark:bg-purple-600', text: 'text-white' },
  'Wait Test': { bg: 'bg-yellow-500 dark:bg-yellow-600', text: 'text-black' },
  'Cancel': { bg: 'bg-red-500 dark:bg-red-600', text: 'text-white' },
};

const ChevronLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" /></svg>
);

const ChevronRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" /></svg>
);


interface ConsolidatedTask {
  persistentId: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  color: { bg: string; text: string };
  durationInDays: number;
}

const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, onDayDoubleClick, onDayExport }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const logsByDate = useMemo(() => {
    return new Map(logs.map(log => [log.date, log]));
  }, [logs]);

  const consolidatedTasks = useMemo(() => {
    const tasksByPersistentId = new Map<string, (Task & { date?: string })[]>();

    logs.forEach(log => {
      log.tasks.forEach(task => {
        const pId = task.persistentId || task.id;
        if (!tasksByPersistentId.has(pId)) {
          tasksByPersistentId.set(pId, []);
        }
        tasksByPersistentId.get(pId)!.push({ ...task, date: log.date });
      });
    });

    const result: ConsolidatedTask[] = [];
    const todayStr = toLocalDateString(new Date());

    tasksByPersistentId.forEach((taskInstances) => {
      taskInstances.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

      const firstInstance = taskInstances[0];
      const lastInstance = taskInstances[taskInstances.length - 1];

      const startDate = firstInstance.startDate || firstInstance.date!;
      let endDate = lastInstance.endDate;

      if (lastInstance.status !== 'Done' && lastInstance.status !== 'Cancel') {
        endDate = lastInstance.date!;
        if (new Date(endDate) < new Date(todayStr)) {
            endDate = todayStr;
        }
      }
      
      if (!endDate) {
        endDate = lastInstance.date!;
      }

      const startDateObj = new Date(`${startDate}T00:00:00`);
      const endDateObj = new Date(`${endDate}T00:00:00`);
      const durationInDays = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      result.push({
        persistentId: lastInstance.persistentId,
        description: lastInstance.description,
        status: lastInstance.status,
        startDate: startDate,
        endDate: endDate,
        color: statusClasses[lastInstance.status],
        durationInDays,
      });
    });

    return result;
  }, [logs]);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const weeks: { weekNumber: number, days: Date[], tasks: any[] }[] = [];
  let currentWeek: Date[] = [];
  for (let d = new Date(calendarStart); d <= calendarEnd; d.setDate(d.getDate() + 1)) {
    currentWeek.push(new Date(d));
    if (currentWeek.length === 7) {
      weeks.push({ weekNumber: weeks.length, days: currentWeek, tasks: [] });
      currentWeek = [];
    }
  }

  consolidatedTasks.forEach(task => {
    // Parse dates as local time to match calendar grid logic
    const taskStart = new Date(`${task.startDate}T00:00:00`);
    const taskEnd = new Date(`${task.endDate}T00:00:00`);
  
    weeks.forEach((week) => {
      const weekStart = new Date(week.days[0]);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(week.days[6]);
      weekEnd.setHours(0, 0, 0, 0);

      if (taskStart <= weekEnd && taskEnd >= weekStart) {
        // Use local getDay() for correct day-of-week index
        const startDay = taskStart < weekStart ? 0 : taskStart.getDay();
        const endDay = taskEnd > weekEnd ? 6 : taskEnd.getDay();
        const duration = endDay - startDay + 1;
        
        let slot = 0;
        while (week.tasks.some(t => t.slot === slot && t.startDay <= endDay && t.endDay >= startDay)) {
          slot++;
        }

        week.tasks.push({ ...task, startDay, duration, endDay, slot });
      }
    });
  });

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Previous month"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={handleNextMonth} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Next month"><ChevronRight className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border-l border-t border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">{day}</div>
        ))}

        {weeks.flatMap(week => week.days).map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.getTime() === today.getTime();
          const weekIndex = Math.floor(index / 7);
          
          const dateString = toLocalDateString(day);
          const logForDay = logsByDate.get(dateString);

          const tasksStartingToday = weeks[weekIndex].tasks.filter(t => t.startDay === (index % 7));
          const maxSlots = weeks[weekIndex].tasks.reduce((max, t) => Math.max(max, t.slot), -1) + 1;

          return (
            <div 
              key={day.toISOString()}
              onDoubleClick={() => onDayDoubleClick(dateString)}
              className={`relative group min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 cursor-pointer ${isCurrentMonth ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
              {logForDay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDayExport(dateString);
                  }}
                  className="absolute top-1.5 left-1.5 z-20 p-1.5 text-slate-400 dark:text-slate-500 rounded-full bg-transparent opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={`Export log for ${dateString}`}
                >
                  <ClipboardIcon className="w-4 h-4" />
                </button>
              )}
              <span className={`absolute top-2 right-2 text-sm font-semibold transition-colors ${isToday ? 'bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{day.getDate()}</span>
              <div className="relative mt-8" style={{ minHeight: `${maxSlots * 24}px` }}>
                {tasksStartingToday.map(task => (
                  <div key={task.persistentId} className="relative group/task" style={{ position: 'absolute', top: `${task.slot * 24}px`, left: '0%', width: `calc(${task.duration * 100}% + ${task.duration - 1}px)`, zIndex: 10 }}>
                    <div className={`h-5 ${task.color.bg} ${task.color.text} rounded px-2 text-xs font-semibold truncate flex items-center cursor-pointer`}>
                      {task.description} ({task.durationInDays} {task.durationInDays > 1 ? 'days' : 'day'})
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover/task:opacity-100 transition-opacity pointer-events-none z-20">
                      <p className="font-bold">{task.description}</p>
                      <p>Status: {task.status}</p>
                      <p>Duration: {task.durationInDays} {task.durationInDays > 1 ? 'days' : 'day'}</p>
                      <p className="font-mono">ID: #{task.persistentId.slice(-6)}</p>
                      <p className="text-slate-300 text-xs mt-1">{task.startDate} to {task.endDate}</p>
                      <div className="absolute left-4 -bottom-1 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
