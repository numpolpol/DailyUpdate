import React, { useState, useEffect } from 'react';
import type { NewDailyLog, Task, TaskStatus } from '../types';
import { TASK_STATUSES } from '../types';
import { Button } from './Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';

interface DailyLogFormProps {
  onSave: (log: NewDailyLog) => Promise<void>;
  onSummarize: (tasks: Task[]) => Promise<string>;
  tasksFromYesterday: Task[];
}

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ onSave, onSummarize, tasksFromYesterday }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [yesterdayTasks, setYesterdayTasks] = useState<Task[]>(tasksFromYesterday);
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unfinishedTasks = yesterdayTasks
      .filter(task => task.status !== 'Done')
      .map(task => ({ ...task, status: 'In Progress' as TaskStatus }));
    setTasks(unfinishedTasks);
  }, [yesterdayTasks]);


  const handleYesterdayStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setYesterdayTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const handleAddTask = () => {
    if (newTaskDesc.trim() === '') return;
    // Fix: Add the missing 'blockers' property to conform to the 'Task' type.
    // FIX: Add the missing 'timeSpent' property to conform to the 'Task' type.
    const newTask: Task = {
      id: `task-${Date.now()}`,
      description: newTaskDesc.trim(),
      status: 'In Progress',
      blockers: [],
      timeSpent: 0,
    };
    setTasks(currentTasks => [...currentTasks, newTask]);
    setNewTaskDesc('');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
  };
  
  const handleSummarizeClick = async () => {
    if (tasks.length === 0) return;
    setIsSummarizing(true);
    setError(null);
    try {
      const result = await onSummarize(tasks);
      setSummary(result);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสรุปด้วย AI');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tasks.length === 0) {
      setError('Please add at least one task for today.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      // Fix: Add the missing 'pullRequests' property to the object to match the 'NewDailyLog' type.
      await onSave({ tasks, summary, pullRequests: [] });
      setTasks([]);
      setNewTaskDesc('');
      setSummary('');
      setYesterdayTasks([]);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl mb-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        {yesterdayTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              อัปเดตงานของเมื่อวาน
            </h2>
            <div className="space-y-3">
              {yesterdayTasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                  <p className="flex-grow text-sm text-slate-800 dark:text-slate-200">{task.description}</p>
                  <select
                    value={task.status}
                    onChange={(e) => handleYesterdayStatusChange(task.id, e.target.value as TaskStatus)}
                    className="w-full sm:w-auto p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm"
                  >
                    {TASK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            แผนงานสำหรับวันนี้
          </h2>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
              placeholder="เพิ่มงานใหม่..."
              className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <Button type="button" onClick={handleAddTask} variant="secondary">
              เพิ่ม
            </Button>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                <p className="flex-grow text-sm text-slate-800 dark:text-slate-200">{task.description}</p>
                <button type="button" onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">ยังไม่มีแผนงานสำหรับวันนี้</p>}
          </div>
        </section>

        {summary && (
           <div className="p-4 border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-r-md">
            <h4 className="flex items-center font-semibold text-blue-800 dark:text-blue-300 mb-2">
              <SparklesIcon className="w-5 h-5 mr-2" />
              สรุปโดย AI (ตัวอย่าง)
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">{summary}</p>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" onClick={handleSummarizeClick} disabled={tasks.length === 0 || isSummarizing} isLoading={isSummarizing} variant="secondary">
            <SparklesIcon className="w-5 h-5 mr-2" />
            สรุปด้วย AI
          </Button>
          <Button type="submit" disabled={isSaving || tasks.length === 0} isLoading={isSaving} variant="primary" className="sm:ml-auto">
            บันทึกความคืบหน้า
          </Button>
        </div>
      </form>
    </div>
  );
};