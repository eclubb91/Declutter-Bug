import React, { useState, useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { InventoryEntity } from '../types';
import { TrashIcon } from './icons';
import { useToasts } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

export const CustomPropertyManager: React.FC = () => {
    const { state, dispatch } = useContext(InventoryContext);
    const { addToast } = useToasts();
    const [renamingKey, setRenamingKey] = useState<string | null>(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

    const allPropertyKeys = useMemo(() => {
        const keys = new Set<string>();
        (Object.values(state.entities) as InventoryEntity[]).forEach(entity => {
            entity.customProps?.forEach(prop => {
                if (prop.key) keys.add(prop.key);
            });
        });
        return Array.from(keys).sort();
    }, [state.entities]);

    const handleRename = () => {
        if (renamingKey && newKeyName && newKeyName.trim() !== renamingKey) {
            dispatch({ type: 'RENAME_PROPERTY_KEY', payload: { oldKey: renamingKey, newKey: newKeyName.trim() } });
            addToast(`Property key renamed to "${newKeyName.trim()}"`, 'success');
        }
        setRenamingKey(null);
        setNewKeyName('');
    };

    const confirmDelete = () => {
        if (keyToDelete) {
            dispatch({ type: 'DELETE_PROPERTY_KEY', payload: { key: keyToDelete } });
            addToast(`Property key "${keyToDelete}" deleted`, 'success');
            setKeyToDelete(null);
            setIsConfirmDeleteOpen(false);
        }
    };

    return (
        <>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Custom Property Editor</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage the keys used for custom properties across your entire inventory.</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allPropertyKeys.length > 0 ? allPropertyKeys.map(key => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            {renamingKey === key ? (
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                                    autoFocus
                                    className="flex-grow bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-2 py-1 text-sm"
                                />
                            ) : (
                                <span
                                    className="flex-grow cursor-pointer font-medium"
                                    onClick={() => { setRenamingKey(key); setNewKeyName(key); }}
                                >
                                    {key}
                                </span>
                            )}
                            <div className="flex items-center">
                                <button onClick={() => { setRenamingKey(key); setNewKeyName(key); }} className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 ml-4">
                                    Rename
                                </button>
                                <button onClick={() => { setKeyToDelete(key); setIsConfirmDeleteOpen(true); }} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full ml-2">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-6">
                            <p className="text-gray-500 dark:text-gray-400">No custom properties found.</p>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Property Key"
                message={`Are you sure you want to delete the property key "${keyToDelete}" from all entities? This action cannot be undone.`}
                confirmText="Delete"
            />
        </>
    );
};