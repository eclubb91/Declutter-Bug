
import React, { useState, useContext, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { InventoryContext, initialState } from '../contexts/InventoryContext';
import { useToasts } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';
import { MoonIcon, SunIcon, DownloadIcon, UploadIcon, TrashIcon } from './icons';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "inventory_backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addToast("Backup downloaded successfully.", "success");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.entities || !json.entities.root) {
          throw new Error("Invalid inventory file format");
        }
        dispatch({ type: 'LOAD_STATE', payload: json });
        addToast("Inventory imported successfully.", "success");
      } catch (error) {
        console.error(error);
        addToast("Failed to import file. Please check format.", "error");
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    localStorage.removeItem('inventoryState');
    dispatch({ type: 'LOAD_STATE', payload: initialState });
    addToast("Application data has been reset.", "success");
    setIsConfirmResetOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage preferences and data.</p>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 space-y-6">
        
        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Appearance</h2>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-600'}`}>
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Adjust the appearance of the application.</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Data Management</h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* Export */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <DownloadIcon />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Download a backup of your inventory.</p>
                </div>
              </div>
              <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors">
                Export JSON
              </button>
            </div>

            {/* Import */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <UploadIcon />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restore your inventory from a backup.</p>
                </div>
              </div>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                className="hidden" 
              />
              <button onClick={handleImportClick} className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg border border-green-200 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors">
                Import JSON
              </button>
            </div>

            {/* Reset */}
            <div className="p-4 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <TrashIcon />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reset Application</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clear all data and return to default state.</p>
                </div>
              </div>
              <button onClick={() => setIsConfirmResetOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors">
                Reset Data
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 dark:text-gray-600">Custom Home Inventory Manager v1.0.0</p>
        </div>

      </main>

      <ConfirmationModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        onConfirm={handleReset}
        title="Reset Application Data"
        message="Are you sure you want to delete all inventory data? This action cannot be undone and will return the application to its initial state."
        confirmText="Reset Everything"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};
