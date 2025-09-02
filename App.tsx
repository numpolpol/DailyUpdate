import React, { useState, useEffect, useCallback } from 'react';
import { fetchLogs, saveLog, updateLog } from './services/googleSheetService';
import type { DailyLog, NewDailyLog, Task, PullRequest } from './types';
import { Header } from './components/Header';
import { DailyLogCard } from './components/DailyLogCard';
import { DailyLogForm } from './components/DailyLogForm';
import { Spinner } from './components/Spinner';
import { Button } from './components/Button';
import { Tabs } from './components/Tabs';
import { SummaryView } from './components/SummaryView';
import { ClipboardIcon } from './components/icons/ClipboardIcon';

const App: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tasksFromYesterday, setTasksFromYesterday] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'summary'>('log');
  const [toastMessage, setToastMessage] = useState<string>('');


  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedLogs = await fetchLogs();
      setLogs(fetchedLogs);

      if (fetchedLogs.length > 0) {
        const mostRecentLog = fetchedLogs[0];
        const logDate = new Date(mostRecentLog.date);
        const today = new Date();
        
        logDate.setUTCHours(0, 0, 0, 0);
        today.setUTCHours(0, 0, 0, 0);
        
        const isToday = logDate.getTime() === today.getTime();

        if (!isToday) {
           setTasksFromYesterday(mostRecentLog.tasks);
        } else {
           setTasksFromYesterday([]);
        }
      }

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
      if (logIdToUpdate) {
        const logToUpdate = logs.find(log => log.id === logIdToUpdate);
        if (!logToUpdate) throw new Error("Log to update not found");

        const updatedLogData: DailyLog = { ...logData, id: logIdToUpdate, date: logToUpdate.date };
        const updatedLog = await updateLog(updatedLogData);
        setLogs(prevLogs => prevLogs.map(log => (log.id === updatedLog.id ? updatedLog : log)));
        setEditingLogId(null);
      } else {
        const savedLog = await saveLog(logData);
        setLogs(prevLogs => [savedLog, ...prevLogs]);
        setTasksFromYesterday([]);
      }
    } catch (err) {
      setError('Error saving data.');
      console.error(err);
      throw err;
    }
  };
  
  const handleStartEdit = (id: string) => {
    setActiveTab('log');
    setEditingLogId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingLogId(null);
  };
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleExport = () => {
    if (logs.length === 0) {
      showToast("No logs to export.");
      return;
    }
  
    const latestLog = logs[0];
    const previousLog = logs.length > 1 ? logs[1] : null;
  
    const formatTasks = (tasks: Task[]) => tasks.length > 0 ? tasks.map(t => `- ${t.description} (${t.status})`).join('\n') : '-';
    const formatBlockers = (tasks: Task[]) => {
        const blockers = tasks.filter(t => t.blockers && t.blockers.length > 0).map(t => `- ${t.description}: ${t.blockers.join(', ')}`);
        return blockers.length > 0 ? blockers.join('\n') : '-';
    };
    const formatPRs = (pullRequests: PullRequest[]) => pullRequests.length > 0 ? pullRequests.map(pr => `- ${pr.url} (${pr.status})`).join('\n') : '-';
  
    const yesterdayText = previousLog ? formatTasks(previousLog.tasks) : '-';
    const todayText = formatTasks(latestLog.tasks);
    const blockerText = formatBlockers(latestLog.tasks);
    const prText = latestLog.pullRequests ? formatPRs(latestLog.pullRequests) : '-';
  
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

  const hasLogForToday = logs.length > 0 && new Date(logs[0].date).toDateString() === new Date().toDateString();
  const logToEdit = editingLogId ? logs.find(log => log.id === editingLogId) : null;
  const showForm = !hasLogForToday || !!logToEdit;

  const hasActiveBlockers = logs
    .flatMap(log => log.tasks)
    .some(task => task.blockers && task.blockers.length > 0 && task.status !== 'Done');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
          <Tabs
            activeTab={activeTab}
            onTabClick={(tabId) => setActiveTab(tabId as 'log' | 'history' | 'summary')}
            tabs={[
              { id: 'log', label: 'Daily Log' },
              { id: 'history', label: 'Log History' },
              { id: 'summary', label: 'Overall Summary', hasIndicator: hasActiveBlockers }
            ]}
          />
        </div>

        {activeTab === 'log' && (
          <>
            {isLoading && !logToEdit ? (
              <div className="flex justify-center items-center py-20">
                <Spinner className="w-10 h-10 text-blue-500" />
              </div>
            ) : showForm ? (
              <DailyLogForm 
                  key={logToEdit?.id || 'new-log'}
                  onSave={handleSaveOrUpdateLog} 
                  tasksFromYesterday={tasksFromYesterday}
                  logToEdit={logToEdit}
                  onCancelEdit={handleCancelEdit}
                />
            ) : (
              <div className="bg-white dark:bg-slate-800 p-6 text-center rounded-lg shadow-xl mb-12">
                <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
                  Log for today is complete!
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  See you tomorrow.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Log History
                    </h2>
                    <Button onClick={handleExport} variant="secondary" disabled={logs.length === 0}>
                        <ClipboardIcon className="w-5 h-5 mr-2" />
                        Export Latest
                    </Button>
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
                        {logs.map(log => (
                        <DailyLogCard 
                            key={log.id} 
                            log={log} 
                            onEdit={handleStartEdit}
                            isEditing={log.id === editingLogId}
                        />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                        <p>No logs yet.</p>
                    </div>
                )}
            </>
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
