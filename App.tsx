

import React, { useState, useEffect, useCallback } from 'react';
import { fetchLogs, saveLog, updateLog, deleteLog, saveAllLogs } from './services/googleSheetService';
import type { DailyLog, NewDailyLog, Task, PullRequest, Blocker } from './types';
import { Header } from './components/Header';
import { DailyLogCard } from './components/DailyLogCard';
import { DailyLogForm } from './components/DailyLogForm';
import { Spinner } from './components/Spinner';
import { Button } from './components/Button';
import { Tabs } from './components/Tabs';
import { SummaryView } from './components/SummaryView';
import { CalendarView } from './components/CalendarView';
import { PlusIcon } from './components/icons/PlusIcon';
import { MissingLogCard } from './components/MissingLogCard';

const App: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isAddingPastLog, setIsAddingPastLog] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'history' | 'summary' | 'calendar'>('history');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);


  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedLogs = await fetchLogs();
      setLogs(fetchedLogs);
      // FIX: Add curly braces to the catch block to fix syntax error and subsequent scope issues.
    } catch (err) {
      setError('Error loading data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSaveOrUpdateLog = async (logData: NewDailyLog, logIdToUpdate?: string): Promise<void> => {
    try {
      let savedOrUpdatedLog: DailyLog;

      if (logIdToUpdate) {
        const logToUpdate = logs.find(log => log.id === logIdToUpdate);
        if (!logToUpdate) throw new Error("Log to update not found");
        const updatedLogData: DailyLog = { ...logData, id: logIdToUpdate, date: logToUpdate.date };
        savedOrUpdatedLog = await updateLog(updatedLogData);
      } else {
        savedOrUpdatedLog = await saveLog(logData);
      }

      let currentLogs = await fetchLogs();
      const savedLogDate = new Date(savedOrUpdatedLog.date);
      let logsWereReconciled = false;

      const reconciledLogs = currentLogs.map(log => {
        if (new Date(log.date).getTime() > savedLogDate.getTime()) {
          let tasksChangedInThisLog = false;
          let futureTasks = [...log.tasks];

          for (const savedTask of savedOrUpdatedLog.tasks) {
            const isSavedTaskComplete = savedTask.status === 'Done' || savedTask.status === 'Cancel';
            const futureTaskIndex = futureTasks.findIndex(ft => ft.persistentId === savedTask.persistentId);

            if (futureTaskIndex > -1) {
              if (isSavedTaskComplete) {
                futureTasks.splice(futureTaskIndex, 1);
                tasksChangedInThisLog = true;
              } else {
                const futureTask = futureTasks[futureTaskIndex];
                if (futureTask.status === 'Done' || futureTask.status === 'Cancel') {
                  futureTasks[futureTaskIndex] = { ...futureTask, status: 'In Progress', endDate: null };
                  tasksChangedInThisLog = true;
                }
              }
            } else {
              if (!isSavedTaskComplete) {
                futureTasks.push({
                  ...savedTask,
                  id: `carryover-${savedTask.persistentId}-${log.date}`,
                  status: 'In Progress',
                  endDate: null,
                  timeSpent: 0,
                });
                tasksChangedInThisLog = true;
              }
            }
          }
          
          if (tasksChangedInThisLog) {
            logsWereReconciled = true;
            return { ...log, tasks: futureTasks };
          }
        }
        return log;
      });

      if (logsWereReconciled) {
        await saveAllLogs(reconciledLogs);
        currentLogs = reconciledLogs;
      }

      const sortLogs = (logs: DailyLog[]) => {
        return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      };
      setLogs(sortLogs(currentLogs));
      
      setEditingLogId(null);
      setIsAddingPastLog(false);
      setPrefilledDate(null);
      setView('list');
    } catch (err) {
      setError('Error saving data.');
      console.error(err);
      throw err;
    }
  };
  
  const handleStartEdit = (id: string) => {
    setEditingLogId(id);
    setIsAddingPastLog(false);
    setPrefilledDate(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteLog(id);
      setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
      showToast("Log deleted successfully.");
      if (editingLogId === id) {
        setEditingLogId(null);
        setView('list');
      }
    } catch (err) {
      setError('Error deleting log.');
      console.error(err);
    }
  };
  
  const handleStartNewLog = () => {
    setEditingLogId(null);
    setIsAddingPastLog(true);
    setPrefilledDate(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddMissingLog = (date: string) => {
    setEditingLogId(null);
    setIsAddingPastLog(true);
    setPrefilledDate(date);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingLogId(null);
    setIsAddingPastLog(false);
    setPrefilledDate(null);
    setView('list');
  };
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleExportSingleLog = (logId: string) => {
    const logIndex = logs.findIndex(l => l.id === logId);
    if (logIndex === -1) {
        showToast("Log not found.");
        return;
    }

    const logToExport = logs[logIndex];
    // Logs are sorted descending, so the previous log is at the next index
    const previousLog = logs.length > logIndex + 1 ? logs[logIndex + 1] : null;

    const formatTasks = (tasks: Task[]) => tasks.length > 0 ? tasks.map(t => `- ${t.description} (${t.status})`).join('\n') : '-';
    const formatBlockers = (tasks: Task[]) => {
        const blockerLines = tasks.flatMap(t =>
            (t.blockers || []).map(blocker => {
                const isObj = typeof blocker === 'object' && blocker !== null;
                const description = isObj ? (blocker as Blocker).description : String(blocker);
                const resolved = isObj ? (blocker as Blocker).resolved : false;
                return `- ${t.description}: ${description} ${resolved ? '(Resolved)' : ''}`;
            })
        );
        return blockerLines.length > 0 ? blockerLines.join('\n') : '-';
    };
    const formatPRs = (pullRequests: PullRequest[]) => pullRequests.length > 0 ? pullRequests.map(pr => `- ${pr.url} (${pr.status})`).join('\n') : '-';

    const yesterdayText = previousLog ? formatTasks(previousLog.tasks) : '-';
    const todayText = formatTasks(logToExport.tasks);
    const blockerText = formatBlockers(logToExport.tasks);
    const prText = logToExport.pullRequests ? formatPRs(logToExport.pullRequests) : '-';

    const exportString = `Yesterday:
${yesterdayText}

Today:
${todayText}

Blocker
${blockerText}

Pull Request: (require 1 pr / day)
${prText}`;

    navigator.clipboard.writeText(exportString).then(() => {
        showToast("Copied to clipboard!");
    }, (err) => {
        showToast("Failed to copy text.");
        console.error('Could not copy text: ', err);
    });
};

  const handleExportLogByDate = (date: string) => {
    const log = logs.find(l => l.date === date);
    if (log) {
      handleExportSingleLog(log.id);
    } else {
      showToast("No log to export for this date.");
    }
  };

  const handleCalendarDaySelect = (date: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (date > todayStr) {
      showToast("Cannot add or edit logs for future dates.");
      return;
    }

    const existingLog = logs.find(log => log.date === date);
    
    // Switch to the history tab to show the form
    setActiveTab('history');
    
    if (existingLog) {
      handleStartEdit(existingLog.id);
    } else {
      handleAddMissingLog(date);
    }
  };


  const logToEdit = editingLogId ? logs.find(log => log.id === editingLogId) : null;

  // FIX: Corrected typo from 'blockovers' to 'blockers' and improved the logic to check for active (unresolved) blockers.
  const hasActiveBlockers = logs
    .flatMap(log => log.tasks)
    .some(task =>
      task.status !== 'Done' &&
      task.status !== 'Cancel' &&
      task.blockers &&
      task.blockers.some(b => typeof b === 'string' || !(b as Blocker).resolved));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
          <Tabs
            activeTab={activeTab}
            onTabClick={(tabId) => {
              setActiveTab(tabId as 'history' | 'summary' | 'calendar');
              setView('list'); // Reset to list view when changing tabs
            }}
            tabs={[
              { id: 'history', label: 'Log History' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'summary', label: 'Overall Summary', hasIndicator: hasActiveBlockers }
            ]}
          />
        </div>

        {activeTab === 'history' && (
          <>
            {view === 'form' ? (
              <DailyLogForm 
                key={logToEdit?.id || (isAddingPastLog ? `add-${prefilledDate || 'past'}` : 'new-log')}
                onSave={handleSaveOrUpdateLog} 
                tasksFromYesterday={[]} // No longer needed, form handles this internally
                logToEdit={logToEdit}
                onCancel={handleCancel}
                isAddingPastLog={isAddingPastLog}
                allLogs={logs}
                prefilledDate={prefilledDate ?? undefined}
              />
            ) : (
              <>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          Log History
                      </h2>
                      <div className="flex gap-4">
                          <Button onClick={handleStartNewLog} variant="secondary">
                              <PlusIcon className="w-5 h-5 mr-2" />
                              New Log
                          </Button>
                      </div>
                  </div>

                  {isLoading ? (
                      <div className="flex justify-center items-center py-20">
                          <Spinner className="w-10 h-10 text-blue-500" />
                      </div>
                  ) : error ? (
                      <div className="text-center py-10 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">
                          <p>{error}</p>
                      </div>
                  ) : logs.length > 0 ? (
                      <div className="space-y-6">
                          {(() => {
                            const historyElements: React.ReactNode[] = [];
                            const diffInDays = (dateStr1: string, dateStr2: string) => {
                                const date1 = new Date(dateStr1 + 'T00:00:00Z');
                                const date2 = new Date(dateStr2 + 'T00:00:00Z');
                                return Math.round((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
                            };

                            const getPreviousDay = (dateStr: string) => {
                                const date = new Date(dateStr + 'T00:00:00Z');
                                date.setUTCDate(date.getUTCDate() - 1);
                                return date.toISOString().split('T')[0];
                            };

                            logs.forEach((log, index) => {
                                historyElements.push(
                                <DailyLogCard
                                    key={log.id}
                                    log={log}
                                    onEdit={handleStartEdit}
                                    onDelete={handleDeleteLog}
                                    onExport={handleExportSingleLog}
                                    isEditing={log.id === editingLogId}
                                />
                                );

                                const nextLog = logs[index + 1];
                                if (nextLog) {
                                const dayDiff = diffInDays(log.date, nextLog.date);
                                if (dayDiff > 1) {
                                    const missingDate = getPreviousDay(log.date);
                                    historyElements.push(
                                    <MissingLogCard
                                        key={`missing-${missingDate}`}
                                        date={missingDate}
                                        onClick={() => handleAddMissingLog(missingDate)}
                                    />
                                    );
                                }
                                }
                            });
                            return historyElements;
                            })()}
                      </div>
                  ) : (
                      <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                          <p>No logs yet.</p>
                      </div>
                  )}
              </>
            )}
          </>
        )}
        
        {activeTab === 'calendar' && (
            <CalendarView logs={logs} onDayDoubleClick={handleCalendarDaySelect} onDayExport={handleExportLogByDate} />
        )}

        {activeTab === 'summary' && (
            <SummaryView logs={logs} />
        )}

      </main>
      
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;