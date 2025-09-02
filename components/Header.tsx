import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
          Daily Update
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Track your daily updates.
        </p>
      </div>
    </header>
  );
};