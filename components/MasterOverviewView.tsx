import React, { useState, useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { EntityType, Item, InventoryEntity } from '../types';
import { EntityListItem } from './EntityListItem';
import { LaundryTracker } from './LaundryTracker';
import { Modal } from './Modal';
import { EntityForm } from './EntityForm';
import { PlusIcon } from './icons';

const getPath = (entityId: string | null, entities: Record<string, InventoryEntity>): string => {
    if (!entityId || !entities[entityId] || entities[entityId].parentId === null) {
      return '';
    }
    const entity = entities[entityId];
    if(entity.type === EntityType.Property) return entity.name;
    const parent = entities[entity.parentId];
    if (!parent || parent.type === EntityType.Property) return entity.name;
    const parentPath = getPath(entity.parentId, entities);
    return parentPath ? `${parentPath} / ${entity.name}` : entity.name;
};

export const MasterOverviewView: React.FC = () => {
    const { state } = useContext(InventoryContext);
    const [activeTab, setActiveTab] = useState<'all' | 'status' | 'laundry'>('all');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const allItems = useMemo(() => {
        return (Object.values(state.entities) as InventoryEntity[])
            .filter(e => e.type === EntityType.Item)
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [state.entities]);

    const { placedItems, placedLaundryItems } = useMemo(() => {
        const pItems: Item[] = [];
        const pLaundryItems: Item[] = [];

        (Object.values(state.entities) as InventoryEntity[]).forEach(e => {
            if (e.type === EntityType.Item && (e as Item).status === 'Placed') {
                pItems.push(e as Item);
                if ((e as Item).tags.includes('laundry')) {
                    pLaundryItems.push(e as Item);
                }
            }
        });
        
        pItems.sort((a,b) => a.name.localeCompare(b.name));
        pLaundryItems.sort((a,b) => a.name.localeCompare(b.name));

        return { placedItems: pItems, placedLaundryItems: pLaundryItems };
    }, [state.entities]);
    

    const renderContent = () => {
        switch (activeTab) {
            case 'all':
                return (
                    <div className="p-4 space-y-3">
                        {allItems.length > 0 ? allItems.map(item => (
                            <div key={item.id}>
                                <EntityListItem
                                    entity={item}
                                    onSelect={() => {}}
                                    isEditing={false}
                                    isSelected={false}
                                    onToggleSelection={() => {}}
                                    disableDrilldown={true}
                                />
                                <p className="text-xs text-right text-gray-500 dark:text-gray-400 px-2 -mt-2">
                                    Location: {getPath(item.parentId, state.entities) || 'Unplaced'}
                                </p>
                            </div>
                        )) : (
                          <div className="text-center py-10">
                            <p className="text-gray-500 dark:text-gray-400">No items in inventory.</p>
                          </div>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <div className="p-4 space-y-3">
                        <LaundryTracker />
                        <h3 className="text-lg font-semibold pt-4 text-gray-800 dark:text-white">All Placed Items</h3>
                        {placedItems.length > 0 ? placedItems.map(item => (
                            <div key={item.id}>
                                <EntityListItem
                                    entity={item}
                                    onSelect={() => {}}
                                    isEditing={false}
                                    isSelected={false}
                                    onToggleSelection={() => {}}
                                    disableDrilldown={true}
                                />
                                <p className="text-xs text-right text-gray-500 dark:text-gray-400 px-2 -mt-2">
                                    Location: {getPath(item.parentId, state.entities) || 'Unplaced'}
                                </p>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">No items are currently placed.</p>
                            </div>
                        )}
                    </div>
                );
            case 'laundry':
                return (
                    <div className="p-4 space-y-3">
                        {placedLaundryItems.length > 0 ? placedLaundryItems.map(item => (
                            <div key={item.id}>
                                <EntityListItem
                                    entity={item}
                                    onSelect={() => {}}
                                    isEditing={false}
                                    isSelected={false}
                                    onToggleSelection={() => {}}
                                    disableDrilldown={true}
                                />
                                 <p className="text-xs text-right text-gray-500 dark:text-gray-400 px-2 -mt-2">
                                    Location: {getPath(item.parentId, state.entities) || 'Unplaced'}
                                </p>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">No clean laundry items have been put away.</p>
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };
    
    const tabClasses = (tabName: 'all' | 'status' | 'laundry') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
        activeTab === tabName
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
        }`;
    
    return (
        <div className="flex flex-col h-full relative">
            <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Master Overview</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Read-only dashboard of your entire inventory.</p>
            </header>
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <nav className="-mb-px flex space-x-2 px-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('all')} className={tabClasses('all')}>All Items</button>
                    <button onClick={() => setActiveTab('status')} className={tabClasses('status')}>Inventory Status</button>
                    <button onClick={() => setActiveTab('laundry')} className={tabClasses('laundry')}>Detailed Laundry</button>
                </nav>
            </div>
            <main className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {renderContent()}
            </main>
            
            <button
                onClick={() => setIsFormOpen(true)}
                className="absolute bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                aria-label="Add new item"
            >
                <PlusIcon className="w-8 h-8" />
            </button>

            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add New Item to Inventory">
                <EntityForm
                    parentId="misc_root"
                    entityType={EntityType.Item}
                    onSave={() => setIsFormOpen(false)}
                    onClose={() => setIsFormOpen(false)}
                    isMisc={true}
                />
            </Modal>
        </div>
    );
};