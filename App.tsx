
import React from 'react';
import { InventoryProvider } from './contexts/InventoryContext';
import { AppView } from './types';
import { InventoryView } from './components/InventoryView';
import { ManagementHubView } from './components/ManagementHubView';
import { MasterOverviewView } from './components/MasterOverviewView';
import { SettingsView } from './components/SettingsView';
import { HomeIcon, OverviewIcon, EditIcon, SettingsIcon } from './components/icons';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { ThemeProvider } from './contexts/ThemeContext';

const AppContent: React.FC = () => {
  const { navigation, navigateTo } = useNavigation();

  const renderView = () => {
    switch(navigation.view) {
      case 'hierarchy':
        return <InventoryView />;
      case 'overview':
        return <MasterOverviewView />;
      case 'management':
        return <ManagementHubView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <InventoryView />;
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <ToastContainer />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
      <nav className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-around">
        <button
          onClick={() => navigateTo({ view: 'hierarchy' })}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs ${navigation.view === 'hierarchy' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <HomeIcon className="w-6 h-6 mb-1" />
          Hierarchy
        </button>
        <button
          onClick={() => navigateTo({ view: 'overview' })}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs ${navigation.view === 'overview' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <OverviewIcon className="w-6 h-6 mb-1" />
          Overview
        </button>
        <button
          onClick={() => navigateTo({ view: 'management' })}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs ${navigation.view === 'management' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <EditIcon className="w-6 h-6 mb-1" />
          Management
        </button>
        <button
          onClick={() => navigateTo({ view: 'settings' })}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs ${navigation.view === 'settings' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <SettingsIcon className="w-6 h-6 mb-1" />
          Settings
        </button>
      </nav>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <InventoryProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </InventoryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
