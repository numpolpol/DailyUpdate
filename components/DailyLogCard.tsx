
import React from 'react';
import type { DailyLog, TaskStatus, PullRequestStatus, Blocker } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { BlockerIcon } from './icons/BlockerIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface DailyLogCardProps {
  log: DailyLog;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  isEditing?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Wait Review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Wait Test': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Cancel': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const prStatusColors: Record<PullRequestStatus, string> = {
  'Approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Reviewing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Request Change': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};


const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
    {status}
  </span>
);

const PRStatusBadge: React.FC<{ status: PullRequestStatus }> = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${prStatusColors[status]}`}>
    {status}
  </span>
);

export const DailyLogCard: React.FC<DailyLogCardProps> = ({ log, onEdit, onDelete, onExport, isEditing = false }) => {
  const cardClasses = `bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
    isEditing ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900' : 'hover:scale-[1.01]'
  }`;

  return (
    <div className={cardClasses}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </h3>
          <div className="flex items-center gap-1">
             <button
              onClick={() => onExport(log.id)}
              className="p-2 text-slate-500 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={`Export log for ${log.date}`}
            >
              <ClipboardIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(log.id)}
              className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={`Edit log for ${log.date}`}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(log.id)}
              className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              aria-label={`Delete log for ${log.date}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-600 dark:text-slate-300">Tasks</h4>
          <ul className="space-y-2">
            {log.tasks.length > 0 ? log.tasks.map(task => (
              <li key={task.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                            <p className="text-sm text-slate-800 dark:text-slate-200">{task.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">#{task.persistentId.slice(-6)}</p>
                        </div>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.blockers && task.blockers.length > 0 && (
                       <div className="mt-2 text-red-700 dark:text-red-300 p-2 rounded-md bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500">
                        <div className="flex items-start gap-2">
                          <BlockerIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">Blocker(s)</p>
                            <ul className="list-disc list-inside pl-1 mt-1 space-y-1">
                              {(task.blockers as Array<Blocker | string>).map((blocker, index) => {
                                const isObj = typeof blocker === 'object' && blocker !== null;
                                const description = isObj ? (blocker as Blocker).description : blocker as string;
                                const resolved = isObj ? (blocker as Blocker).resolved : false;
                                const id = isObj ? (blocker as Blocker).id : `${index}`;

                                return (
                                  <li key={id} className={`text-sm ${resolved ? 'line-through text-slate-500 dark:text-slate-400 opacity-70' : ''}`}>
                                    {description}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )) : (
              <li className="text-sm text-slate-500 dark:text-slate-400">No tasks recorded for this day.</li>
            )}
          </ul>
        </div>

        {log.pullRequests && log.pullRequests.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-slate-600 dark:text-slate-300">Pull Requests</h4>
            <ul className="space-y-2">
              {log.pullRequests.map(pr => (
                <li key={pr.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md gap-2">
                  <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
                    {pr.url}
                  </a>
                  <PRStatusBadge status={pr.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};