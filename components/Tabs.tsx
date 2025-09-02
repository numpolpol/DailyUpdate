import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabClick: (tabId: string) => void;
  tabs: { id: string; label: string; hasIndicator?: boolean }[];
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabClick, tabs }) => {
  return (
    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <div className="flex items-center gap-2">
            {tab.label}
            {tab.hasIndicator && (
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </div>
        </button>
      ))}
    </nav>
  );
};
