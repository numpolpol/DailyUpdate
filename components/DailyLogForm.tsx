import React, { useState, useEffect } from 'react';
import type { NewDailyLog, Task, TaskStatus, DailyLog, PullRequest, PullRequestStatus } from '../types';
import { TASK_STATUSES, PULL_REQUEST_STATUSES } from '../types';
import { Button } from './Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';

interface DailyLogFormProps {
  onSave: (log: NewDailyLog, logIdToUpdate?: string) => Promise<void>;
  tasksFromYesterday: Task[];
  logToEdit?: DailyLog | null;
  onCancelEdit: () => void;
}

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ onSave, tasksFromYesterday, logToEdit, onCancelEdit }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newPrUrl, setNewPrUrl] = useState('');
  const [yesterdayTasks, setYesterdayTasks] = useState<Task[]>(tasksFromYesterday);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedBlockers, setResolvedBlockers] = useState<Record<string, boolean>>({});
  const [newBlockerInputs, setNewBlockerInputs] = useState<Record<string, string>>({});


  const isEditing = !!logToEdit;

  useEffect(() => {
    if (isEditing) {
      setTasks(logToEdit.tasks.map(t => ({ ...t, blockers: t.blockers || [], timeSpent: t.timeSpent || 0 })));
      setPullRequests(logToEdit.pullRequests || []);
      setYesterdayTasks([]);
    } else {
      const unfinishedTasks = tasksFromYesterday
        .filter(task => task.status !== 'Done')
        .map(task => ({ ...task, status: 'In Progress' as TaskStatus, blockers: task.blockers || [], timeSpent: task.timeSpent || 0 }));
      setTasks(unfinishedTasks);
      setPullRequests([]);
    }
  }, [logToEdit, tasksFromYesterday]);

  const handleTaskChange = (id: string, field: keyof Task, value: string | number) => {
    setTasks(current => current.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  
  const handlePRChange = (id: string, field: keyof PullRequest, value: string) => {
    setPullRequests(current => current.map(pr => pr.id === id ? { ...pr, [field]: value } : pr));
  };

  const handleAddTask = () => {
    if (newTaskDesc.trim() === '') return;
    setTasks(current => [...current, { id: `task-${Date.now()}`, description: newTaskDesc.trim(), status: 'In Progress', blockers: [], timeSpent: 0 }]);
    setNewTaskDesc('');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(current => current.filter(t => t.id !== id));
  };

  const handleBlockerChange = (taskId: string, index: number, value: string) => {
    setTasks(current => current.map(t => {
      if (t.id === taskId) {
        const updatedBlockers = [...t.blockers];
        updatedBlockers[index] = value;
        return { ...t, blockers: updatedBlockers };
      }
      return t;
    }));
  };

  const handleRemoveBlocker = (taskId: string, index: number) => {
    setTasks(current => current.map(t => {
      if (t.id === taskId) {
        return { ...t, blockers: t.blockers.filter((_, i) => i !== index) };
      }
      return t;
    }));
  };

  const handleAddBlocker = (taskId: string) => {
    const newBlockerText = newBlockerInputs[taskId]?.trim();
    if (!newBlockerText) return;
    setTasks(current => current.map(t => {
        if (t.id === taskId) {
            return { ...t, blockers: [...(t.blockers || []), newBlockerText] };
        }
        return t;
    }));
    setNewBlockerInputs(prev => ({...prev, [taskId]: ''}));
  };
  
  const handleAddPR = () => {
    if (newPrUrl.trim() === '' || !newPrUrl.startsWith('http')) {
        setError('Please enter a valid URL for the Pull Request.');
        return;
    };
    setError(null);
    setPullRequests(current => [...current, { id: `pr-${Date.now()}`, url: newPrUrl.trim(), status: 'Reviewing' }]);
    setNewPrUrl('');
  };

  const handleDeletePR = (id: string) => {
    setPullRequests(current => current.filter(pr => pr.id !== id));
  };

  const handleToggleResolvedBlocker = (taskId: string, blockerIndex: number) => {
      const key = `${taskId}_${blockerIndex}`;
      const isNowResolved = !resolvedBlockers[key];
      setResolvedBlockers(prev => ({...prev, [key]: isNowResolved}));
      
      const yesterdayTask = yesterdayTasks.find(t => t.id === taskId);
      if (!yesterdayTask) return;
      
      const blockerText = yesterdayTask.blockers[blockerIndex];
      
      setTasks(currentTasks => currentTasks.map(task => {
          if (task.id === taskId) {
              if (isNowResolved) {
                  return { ...task, blockers: task.blockers.filter(b => b !== blockerText) };
              } else {
                  if (!task.blockers.includes(blockerText)) {
                      return { ...task, blockers: [...task.blockers, blockerText] };
                  }
              }
          }
          return task;
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tasks.length === 0) {
      setError('Please add at least one task.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      const logData: NewDailyLog = {
        tasks: tasks.map(task => ({ ...task, blockers: (task.blockers || []).map(b => b.trim()).filter(Boolean) })),
        pullRequests,
      };
      await onSave(logData, logToEdit?.id);
      if (!isEditing) {
        setTasks([]);
        setPullRequests([]);
        setNewTaskDesc('');
        setNewPrUrl('');
        setYesterdayTasks([]);
      }
    } catch (err) {
      setError('Error saving data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl mb-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        {!isEditing && yesterdayTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Update Yesterday's Tasks</h2>
            <div className="space-y-3">
              {yesterdayTasks.map(task => (
                <div key={task.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <p className="flex-grow text-sm text-slate-800 dark:text-slate-200">{task.description}</p>
                    <select
                      value={task.status}
                      onChange={(e) => {
                        const updatedTasks = yesterdayTasks.map(t => t.id === task.id ? {...t, status: e.target.value as TaskStatus} : t);
                        setYesterdayTasks(updatedTasks);
                      }}
                      className="w-full sm:w-auto p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm"
                    >
                      {TASK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                   {task.blockers && task.blockers.length > 0 && task.status !== 'Done' && (
                    <div className="mt-3 pt-3 pl-2 border-t border-slate-200 dark:border-slate-600">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Blockers:</p>
                      <div className="space-y-2">
                        {task.blockers.map((blocker, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`resolve-${task.id}-${index}`}
                              checked={!!resolvedBlockers[`${task.id}_${index}`]}
                              onChange={() => handleToggleResolvedBlocker(task.id, index)}
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-600"
                            />
                            <label
                              htmlFor={`resolve-${task.id}-${index}`}
                              className={`text-sm text-slate-600 dark:text-slate-300 transition-all ${
                                resolvedBlockers[`${task.id}_${index}`]
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : ''
                              }`}
                            >
                              {blocker}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                   )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{isEditing ? `Editing Log for ${new Date(logToEdit.date).toLocaleDateString('en-US')}` : "Today's Plan"}</h2>
          <div className="flex gap-3 mb-4">
            <input type="text" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())} placeholder="Add a new task..." className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
            <Button type="button" onClick={handleAddTask} variant="secondary">Add</Button>
          </div>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                <div className="flex items-start flex-wrap gap-3">
                  <div className="flex-grow min-w-[200px]">
                    <input type="text" value={task.description} onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)} placeholder="Task description..." className="w-full p-2 text-sm bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none"/>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <input type="number" value={task.timeSpent} onChange={(e) => handleTaskChange(task.id, 'timeSpent', parseFloat(e.target.value) || 0)} min="0" step="0.5" className="w-20 p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm" />
                        <span className="text-sm text-slate-500 dark:text-slate-400">Hours</span>
                    </div>
                    <select value={task.status} onChange={(e) => handleTaskChange(task.id, 'status', e.target.value)} className="p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm">
                      {TASK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button type="button" onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 pt-1"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </div>
                 <div className="pl-2 mt-2 space-y-2">
                    {(task.blockers || []).map((blocker, index) => (
                      <div key={index} className="flex items-center gap-2 group">
                        <input type="text" value={blocker} onChange={(e) => handleBlockerChange(task.id, index, e.target.value)} placeholder="Describe blocker..." className="flex-grow p-2 text-sm bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"/>
                        <button type="button" onClick={() => handleRemoveBlocker(task.id, index)} className="text-slate-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <input type="text" value={newBlockerInputs[task.id] || ''} onChange={(e) => setNewBlockerInputs(prev => ({...prev, [task.id]: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlocker(task.id))} placeholder="Add new blocker..." className="flex-grow p-2 text-sm bg-slate-100 dark:bg-slate-600 border border-dashed border-slate-300 dark:border-slate-500 rounded-md focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"/>
                        <Button type="button" onClick={() => handleAddBlocker(task.id)} variant="secondary" className="px-3 py-2 text-sm"><PlusIcon className="w-5 h-5" /></Button>
                    </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No tasks for today yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Pull Requests</h2>
          <div className="flex gap-3 mb-4">
            <input type="url" value={newPrUrl} onChange={(e) => setNewPrUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPR())} placeholder="Add PR URL..." className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
            <Button type="button" onClick={handleAddPR} variant="secondary">Add</Button>
          </div>
          <div className="space-y-3">
            {pullRequests.map(pr => (
              <div key={pr.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <p className="flex-grow text-sm text-blue-600 dark:text-blue-400 truncate">{pr.url}</p>
                  <select value={pr.status} onChange={(e) => handlePRChange(pr.id, 'status', e.target.value)} className="p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm">
                    {PULL_REQUEST_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <button type="button" onClick={() => handleDeletePR(pr.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"><TrashIcon className="w-5 h-5"/></button>
                </div>
              </div>
            ))}
            {pullRequests.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No pull requests for today yet.</p>}
          </div>
        </section>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          {isEditing && (<Button type="button" onClick={onCancelEdit} variant="secondary">Cancel</Button>)}
          <Button type="submit" disabled={isSaving || tasks.length === 0} isLoading={isSaving} variant="primary" className="sm:ml-auto">
            {isEditing ? 'Update Log' : 'Save Progress'}
          </Button>
        </div>
      </form>
    </div>
  );
};
