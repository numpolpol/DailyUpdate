// NOTE: This service saves all data to the browser's Local Storage.
// The filename is a remnant from a previous version and does not connect to Google Sheets.

import type { DailyLog, NewDailyLog } from '../types';

// =================================================================
// DEVELOPER NOTE: LOCAL STORAGE SERVICE
// =================================================================
// This service manages daily logs by storing them in the browser's
// localStorage. It replaces the previous mock Google Sheet API.
// =================================================================

const STORAGE_KEY = 'dailyLogs';

const getLogsFromStorage = (): DailyLog[] => {
  try {
    const logsJson = localStorage.getItem(STORAGE_KEY);
    if (!logsJson) return [];
    
    const logs = JSON.parse(logsJson) as DailyLog[];
    // Ensure logs are sorted by date, descending
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return logs;
  } catch (error) {
    console.error("Error parsing logs from localStorage:", error);
    return [];
  }
};

const saveLogsToStorage = (logs: DailyLog[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving logs to localStorage:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Simulate a short network delay for better UX with loading states
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchLogs = async (): Promise<DailyLog[]> => {
  console.log('Fetching logs from localStorage...');
  await delay(200); // Short delay to allow loading spinner to be visible
  return getLogsFromStorage();
};

export const saveLog = async (newLog: NewDailyLog): Promise<DailyLog> => {
  console.log('Saving log to localStorage...', newLog);
  await delay(200);

  const logs = getLogsFromStorage();
  
  const savedLog: DailyLog = {
    ...newLog,
    id: `log-${new Date().getTime()}`,
    date: newLog.date || new Date().toISOString().split('T')[0],
  };

  const updatedLogs = [savedLog, ...logs];
  updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveLogsToStorage(updatedLogs);
  
  return savedLog;
};

export const updateLog = async (updatedLog: DailyLog): Promise<DailyLog> => {
  console.log('Updating log in localStorage...', updatedLog);
  await delay(200);

  let logs = getLogsFromStorage();
  
  const logIndex = logs.findIndex(log => log.id === updatedLog.id);
  if (logIndex === -1) {
    throw new Error("Log not found");
  }

  logs[logIndex] = updatedLog;
  saveLogsToStorage(logs);

  return updatedLog;
}

export const deleteLog = async (logId: string): Promise<void> => {
  console.log('Deleting log from localStorage...', logId);
  await delay(200);

  const logs = getLogsFromStorage();
  const updatedLogs = logs.filter(log => log.id !== logId);
  saveLogsToStorage(updatedLogs);
};

export const saveAllLogs = async (logs: DailyLog[]): Promise<void> => {
  console.log('Saving all logs to localStorage...');
  await delay(50); // a small delay
  // Ensure logs are sorted before saving
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveLogsToStorage(sortedLogs);
};
