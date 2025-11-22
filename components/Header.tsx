import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { ChevronLeftIcon } from './icons';

interface HeaderProps {
  navigationStack: string[];
  setNavigationStack: (stack: string[] | ((prev: string[]) => string[])) => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ navigationStack, setNavigationStack, title }) => {
  const canGoBack = navigationStack.length > 1;

  const handleBack = () => {
    if (canGoBack) {
      setNavigationStack(stack => stack.slice(0, -1));
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        {canGoBack && (
          <button onClick={handleBack} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Go back">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
      <Breadcrumbs navigationStack={navigationStack} setNavigationStack={setNavigationStack} />
    </header>
  );
};