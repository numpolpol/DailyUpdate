
import React from 'react';
import { PlusIcon } from './icons/PlusIcon';

interface MissingLogCardProps {
  date: string;
  onClick: () => void;
}

export const MissingLogCard: React.FC<MissingLogCardProps> = ({ date, onClick }) => {
  return (
    <div className="relative flex justify-center items-center h-12" aria-label={`Add log for ${date}`}>
      {/* Dashed line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-transparent"
           style={{
             backgroundImage: 'linear-gradient(to bottom, #cbd5e1 50%, transparent 50%)',
             backgroundSize: '1px 8px',
             backgroundRepeat: 'repeat-y',
             transform: 'translateX(-0.5px)'
           }}>
      </div>
      
      {/* Button */}
      <button
        onClick={onClick}
        className="relative z-10 flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-500 transition-all duration-200 shadow"
        aria-label={`Add log for ${new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`}
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
};
