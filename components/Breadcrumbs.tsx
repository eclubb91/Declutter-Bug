
import React, { useContext } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { ChevronRightIcon } from './icons';

interface BreadcrumbsProps {
  navigationStack: string[];
  setNavigationStack: (stack: string[] | ((prev: string[]) => string[])) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ navigationStack, setNavigationStack }) => {
  const { state } = useContext(InventoryContext);

  const handleCrumbClick = (index: number) => {
    setNavigationStack(stack => stack.slice(0, index + 1));
  };
  
  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap py-1">
      {navigationStack.map((id, index) => {
        const entity = state.entities[id];
        if (!entity) return null;
        
        const isLast = index === navigationStack.length - 1;

        return (
          <React.Fragment key={id}>
            <button
              onClick={() => handleCrumbClick(index)}
              className={`hover:underline ${isLast ? 'font-semibold text-gray-800 dark:text-white' : ''}`}
              disabled={isLast}
            >
              {entity.name}
            </button>
            {!isLast && <ChevronRightIcon className="w-4 h-4 mx-1 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
