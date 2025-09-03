
import React, { useState, useEffect } from 'react';
import type { NewDailyLog, Task, TaskStatus, DailyLog, PullRequest, PullRequestStatus, Blocker } from '../types';
import { TASK_STATUSES, PULL_REQUEST_STATUSES } from '../types';
import { Button } from './Button';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { BlockerIcon } from './icons/BlockerIcon';


interface DailyLogFormProps {
  onSave: (log: NewDailyLog, logIdToUpdate?: string) => Promise<void>;
  tasksFromYesterday: Task[];
  logToEdit?: DailyLog | null;
  onCancel: () => void;
  isAddingPastLog?: boolean;
  allLogs?: DailyLog[];
  prefilledDate?: string;
}

const statusColors: Record<TaskStatus, string> = {
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Wait Review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Wait Test': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Cancel': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};


export const DailyLogForm: React.FC<DailyLogFormProps> = ({ onSave, tasksFromYesterday, logToEdit, onCancel, isAddingPastLog, allLogs, prefilledDate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [logDate, setLogDate] = useState<string>(logToEdit?.date || prefilledDate || new Date().toISOString().split('T')[0]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newPrUrl, setNewPrUrl] = useState('');
  const [yesterdayTasks, setYesterdayTasks] = useState<Task[]>([]);
  const [yesterdayLogDate, setYesterdayLogDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBlockerInputs, setNewBlockerInputs] = useState<Record<string, string>>({});
  
  const [logIdToUpdate, setLogIdToUpdate] = useState<string | null>(null);


  const isEditing = !!logToEdit;

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const withPersistentId = (task: Task): Task => ({
      ...task,
      persistentId: task.persistentId || task.id,
    });
    
    const mapBlockers = (blockers: (string | Blocker)[] | undefined): Blocker[] => {
      if (!blockers) return [];
      return blockers.map((b, index) => {
        if (typeof b === 'string') {
          return { id: `b-compat-${index}-${Date.now()}`, description: b, resolved: false };
        }
        return b;
      });
    };
    
    const mapTask = (task: Task, date: string): Task => ({
        ...withPersistentId(task),
        blockers: mapBlockers(task.blockers),
        timeSpent: task.timeSpent || 0,
        startDate: task.startDate || date,
        endDate: task.endDate !== undefined ? task.endDate : (task.status === 'Done' ? date : null),
    });

    if (isEditing && logToEdit) {
      setTasks(logToEdit.tasks.map(t => mapTask(t, logToEdit.date)));
      setPullRequests(logToEdit.pullRequests || []);
      setLogIdToUpdate(logToEdit.id);
      setYesterdayTasks([]);
      return;
    }

    if (isAddingPastLog && allLogs) {
      const existingLogForDate = allLogs.find(log => log.date === logDate);
      if (existingLogForDate) {
        setTasks(existingLogForDate.tasks.map(t => mapTask(t, existingLogForDate.date)));
        setPullRequests(existingLogForDate.pullRequests || []);
        setLogIdToUpdate(existingLogForDate.id);
        setYesterdayTasks([]);
        return;
      }
    }

    setLogIdToUpdate(null);
    let sourceOfCarryOverTasks: Task[] = [];
    let mostRecentLogDate = todayStr;
    
    if (allLogs && allLogs.length > 0) {
      const mostRecentLog = allLogs.find(log => log.date < logDate);
      if (mostRecentLog) {
        sourceOfCarryOverTasks = mostRecentLog.tasks;
        mostRecentLogDate = mostRecentLog.date;
        setYesterdayLogDate(mostRecentLog.date);
      } else {
        setYesterdayLogDate(null);
      }
    } else {
      setYesterdayLogDate(null);
    }
    
    setYesterdayTasks(sourceOfCarryOverTasks);
    const unfinishedTasks = sourceOfCarryOverTasks
      .filter(task => task.status !== 'Done' && task.status !== 'Cancel')
      .map(task => ({
        ...task,
        id: `carryover-${task.id}-${logDate}`,
        persistentId: task.persistentId || task.id,
        status: 'In Progress' as TaskStatus,
        blockers: mapBlockers(task.blockers),
        timeSpent: 0,
        startDate: task.startDate || mostRecentLogDate,
        endDate: null,
      }));
    
    setTasks(unfinishedTasks);
    setPullRequests([]);
  }, [isEditing, logToEdit, isAddingPastLog, logDate, allLogs, tasksFromYesterday]);

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(currentTasks =>
      currentTasks.map(task => {
        if (task.id === taskId) {
          const isNowFinished = newStatus === 'Done' || newStatus === 'Cancel';
          const wasFinished = task.status === 'Done' || task.status === 'Cancel';

          let newEndDate = task.endDate;
          if (isNowFinished && !wasFinished) {
            newEndDate = logDate; // Task is completed or cancelled today
          } else if (!isNowFinished && wasFinished) {
            newEndDate = null; // Task is reopened
          }

          return { ...task, status: newStatus, endDate: newEndDate };
        }
        return task;
      })
    );
  };
  
  const handlePRChange = (id: string, field: keyof PullRequest, value: string) => {
    setPullRequests(current => current.map(pr => pr.id === id ? { ...pr, [field]: value } : pr));
  };

  const handleAddTask = () => {
    if (newTaskDesc.trim() === '') return;
    const newId = `task-${Date.now()}`;
    const newTask: Task = { 
      id: newId, 
      persistentId: newId,
      description: newTaskDesc.trim(), 
      status: 'In Progress', 
      blockers: [], 
      timeSpent: 0,
      startDate: logDate,
      endDate: null,
    };
    setTasks(current => [newTask, ...current]);
    setNewTaskDesc('');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(current => current.filter(t => t.id !== id));
  };

  const handleBlockerChange = (taskId: string, blockerId: string, value: string) => {
    setTasks(current => current.map(t => {
      if (t.id === taskId) {
        const updatedBlockers = t.blockers.map(b => 
            b.id === blockerId ? {...b, description: value} : b
        );
        return { ...t, blockers: updatedBlockers };
      }
      return t;
    }));
  };
  
  const handleToggleBlockerResolved = (taskId: string, blockerId: string) => {
    setTasks(current => current.map(t => {
        if (t.id === taskId) {
            return {
                ...t,
                blockers: t.blockers.map(b => b.id === blockerId ? {...b, resolved: !b.resolved} : b)
            }
        }
        return t;
    }))
  };

  const handleRemoveBlocker = (taskId: string, blockerId: string) => {
    setTasks(current => current.map(t => {
      if (t.id === taskId) {
        return { ...t, blockers: t.blockers.filter((b) => b.id !== blockerId) };
      }
      return t;
    }));
  };

  const handleAddBlocker = (taskId: string) => {
    const newBlockerText = newBlockerInputs[taskId]?.trim();
    if (!newBlockerText) return;
    setTasks(current => current.map(t => {
        if (t.id === taskId) {
            const newBlocker: Blocker = {
                id: `blocker-${Date.now()}`,
                description: newBlockerText,
                resolved: false,
            };
            return { ...t, blockers: [...(t.blockers || []), newBlocker] };
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
        tasks: tasks.map(task => ({ ...task, blockers: (task.blockers || []).filter(b => b.description.trim()) })),
        pullRequests,
        date: logDate
      };
      
      const idToUpdate = logToEdit?.id || logIdToUpdate;
      await onSave(logData, idToUpdate);
      
      if (!idToUpdate) {
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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl mb-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {logToEdit?.id || logIdToUpdate ? 'Editing Log' : 'New Log'}
            </h2>
            <input
                type="date"
                id="log-date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                disabled={isEditing}
                max={new Date().toISOString().split('T')[0]}
                className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
            />
        </div>

        {yesterdayTasks.length > 0 && !logToEdit && !logIdToUpdate && (
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Yesterday's Summary
              {logDate !== todayStr && yesterdayLogDate && (
                <span className="text-base font-normal text-slate-500 dark:text-slate-400 ml-2">
                  ({new Date(yesterdayLogDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })})
                </span>
              )}
            </h2>
            <div className="space-y-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
              {yesterdayTasks.map(task => (
                <div key={task.id} className="flex justify-between items-center gap-4">
                  <p className={`flex-grow text-sm text-slate-800 dark:text-slate-200 ${task.status === 'Done' ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                    {task.description}
                  </p>
                  <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Tasks
          </h2>
          <div className="flex gap-3 mb-4">
            <input type="text" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())} placeholder="Add a new task..." className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
            <Button type="button" onClick={handleAddTask} variant="secondary">Add</Button>
          </div>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="p-3 rounded-md bg-slate-50 dark:bg-slate-700/50">
                  <>
                    <div className="flex items-start flex-wrap gap-3">
                      <div className="flex-grow min-w-[200px]">
                        <div className="p-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">#{task.persistentId.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                          <select 
                            value={task.status} 
                            onChange={(e) => handleTaskStatusChange(task.id, e.target.value as TaskStatus)} 
                            className="p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                          >
                            {TASK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                          </select>
                          <button type="button" onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><TrashIcon className="w-4 h-4"/></button>
                      </div>
                    </div>
                    <div className="pl-2 mt-2 space-y-2">
                        {(task.blockers || []).map((blocker) => (
                          <div key={blocker.id} className="flex items-center gap-2 group">
                            <input
                                type="checkbox"
                                id={`blocker-check-${blocker.id}`}
                                checked={blocker.resolved}
                                onChange={() => handleToggleBlockerResolved(task.id, blocker.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                            />
                            <input 
                                type="text"
                                value={blocker.description}
                                onChange={(e) => handleBlockerChange(task.id, blocker.id, e.target.value)}
                                placeholder="Describe blocker..."
                                readOnly={blocker.resolved}
                                className={`flex-grow p-2 text-sm bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors ${blocker.resolved ? 'line-through text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700' : ''}`}
                            />
                            <button type="button" onClick={() => handleRemoveBlocker(task.id, blocker.id)} className="text-slate-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-5 h-5"/></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                            <BlockerIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <input
                                type="text"
                                value={newBlockerInputs[task.id] || ''}
                                onChange={(e) => setNewBlockerInputs(prev => ({...prev, [task.id]: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlocker(task.id))}
                                placeholder="Any blocking point ?"
                                className="flex-grow p-2 text-sm bg-transparent dark:bg-transparent border-0 focus:ring-0 placeholder-red-400 dark:placeholder-red-500 text-red-800 dark:text-red-200"
                            />
                            <Button
                                type="button"
                                onClick={() => handleAddBlocker(task.id)}
                                variant="secondary"
                                className="px-3 py-2 text-sm !bg-red-100 hover:!bg-red-200 dark:!bg-red-800/50 dark:hover:!bg-red-800/80 !text-red-700 dark:!text-red-200"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                  </>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No tasks for this log yet.</p>}
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
                  <a href={pr.url} target="_blank" rel="noopener noreferrer" className="flex-grow text-sm text-blue-600 dark:text-blue-400 truncate hover:underline">{pr.url}</a>
                  <select value={pr.status} onChange={(e) => handlePRChange(pr.id, 'status', e.target.value as PullRequestStatus)} className="p-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm">
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
          {(isEditing || isAddingPastLog) && (<Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>)}
          <Button type="submit" disabled={isSaving || tasks.length === 0} isLoading={isSaving} variant="primary" className="sm:ml-auto">
            {logToEdit?.id || logIdToUpdate ? 'Update Log' : 'Save Progress'}
          </Button>
        </div>
      </form>
    </div>
  );
};