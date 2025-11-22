import React, { useState, useMemo, useContext } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { Item, InventoryEntity, Container, EntityType } from '../types';
import { LaundryHubView } from './LaundryHubView';
import { TaggingHubView } from './TaggingHubView';
import { useToasts } from '../contexts/ToastContext';
import { Modal } from './Modal';
import { LightbulbIcon, ItemIcon, CheckSquareIcon, SquareIcon } from './icons';
import { BulkEditView } from './BulkEditView';
import { CustomPropertyManager } from './CustomPropertyManager';

// Component for managing unplaced items
const UnplacedItemsManager: React.FC = () => {
    const { state, dispatch } = useContext(InventoryContext);
    const { addToast } = useToasts();
    const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
    const [isManualPlaceModalOpen, setIsManualPlaceModalOpen] = useState(false);

    const getPath = (entityId: string | null, entities: Record<string, InventoryEntity>): string => {
        if (!entityId || !entities[entityId] || entities[entityId].parentId === null) return '';
        const entity = entities[entityId];
        const parent = entities[entity.parentId];
        if (!parent || parent.type === EntityType.Property) return entity.name;
        const parentPath = getPath(entity.parentId, entities);
        return parentPath ? `${parentPath} / ${entity.name}` : entity.name;
    };

    const { groupedItems, suggestions } = useMemo(() => {
        const allEntities = Object.values(state.entities) as InventoryEntity[];
        const unplacedItems = allEntities.filter((e): e is Item => e.type === EntityType.Item && e.status === 'Clean (Unplaced)');

        const groups = new Map<string, { items: Item[], totalQuantity: number, representative: Item }>();

        unplacedItems.forEach(item => {
            const tagsKey = JSON.stringify(item.tags.sort());
            const groupKey = `${item.name.toLowerCase()}|${tagsKey}`;
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, { items: [], totalQuantity: 0, representative: item });
            }
            const group = groups.get(groupKey)!;
            group.items.push(item);
            group.totalQuantity += item.quantity;
        });

        const newSuggestions = new Map<string, string | null>();
        const allPlacedItems = allEntities.filter((e): e is Item => e.type === EntityType.Item && e.status === 'Placed');
        const tagToContainerMap = new Map<string, string[]>();

        allPlacedItems.forEach(item => {
            if (item.parentId && state.entities[item.parentId]?.parentId !== 'misc_root') {
                item.tags.forEach(tag => {
                    if (!tagToContainerMap.has(tag)) tagToContainerMap.set(tag, []);
                    tagToContainerMap.get(tag)!.push(item.parentId!);
                });
            }
        });

        groups.forEach((group, key) => {
            const containerScores = new Map<string, number>();
            group.representative.tags.forEach(tag => {
                const containerIds = tagToContainerMap.get(tag);
                if (containerIds) {
                    containerIds.forEach(id => {
                        containerScores.set(id, (containerScores.get(id) || 0) + 1);
                    });
                }
            });

            if (containerScores.size > 0) {
                const bestContainer = Array.from(containerScores.entries()).reduce((a, b) => b[1] > a[1] ? b : a);
                newSuggestions.set(key, bestContainer[0]);
            }
        });
        
        return { groupedItems: new Map(Array.from(groups.entries()).sort((a,b) => a[1].representative.name.localeCompare(b[1].representative.name))), suggestions: newSuggestions };

    }, [state.entities]);

    const handleQuickPlace = (groupKey: string, destinationId: string) => {
        const group = groupedItems.get(groupKey);
        if (!group) return;
        const itemIds = group.items.map(i => i.id);
        dispatch({ type: 'PLACE_MISC_ITEMS', payload: { ids: itemIds, destinationId } });
        addToast(`${group.representative.name} (x${group.totalQuantity}) placed successfully!`, 'success');
    };

    const handleManualPlace = (destinationId: string) => {
        const allItemIdsToPlace: string[] = [];
        selectedGroupKeys.forEach(key => {
            const group = groupedItems.get(key);
            if (group) {
                allItemIdsToPlace.push(...group.items.map(i => i.id));
            }
        });

        if (allItemIdsToPlace.length > 0) {
            dispatch({ type: 'PLACE_MISC_ITEMS', payload: { ids: allItemIdsToPlace, destinationId } });
            addToast(`${selectedGroupKeys.length} group(s) placed successfully!`, 'success');
            setSelectedGroupKeys([]);
            setIsManualPlaceModalOpen(false);
        }
    };
    
    const possibleDestinations = useMemo(() => {
        return (Object.values(state.entities) as InventoryEntity[])
            .filter((e): e is Container => e.type === EntityType.Container && e.parentId !== 'misc_root')
            .sort((a, b) => getPath(a.id, state.entities).localeCompare(getPath(b.id, state.entities)));
    }, [state.entities]);

    const toggleGroupSelection = (key: string) => {
        setSelectedGroupKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Unplaced Items</h3>
            <button
                onClick={() => setIsManualPlaceModalOpen(true)}
                disabled={selectedGroupKeys.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
                Place {selectedGroupKeys.length} Group(s)
            </button>
        </div>
        <div className="space-y-3">
            {groupedItems.size > 0 ? Array.from(groupedItems.entries()).map(([key, group]) => {
                const suggestionId = suggestions.get(key);
                const suggestion = suggestionId ? state.entities[suggestionId] : null;
                const isSelected = selectedGroupKeys.includes(key);
                return (
                    <div key={key} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border ${isSelected ? 'border-primary-500 ring-2 ring-primary-500' : 'dark:border-gray-700'}`}>
                        <div className="flex items-start gap-3">
                             <div className="pt-1" onClick={(e) => { e.stopPropagation(); toggleGroupSelection(key); }}>
                                {isSelected ? <CheckSquareIcon className="w-6 h-6 text-primary-600 cursor-pointer" /> : <SquareIcon className="w-6 h-6 text-gray-400 cursor-pointer" />}
                            </div>
                            <ItemIcon className="w-8 h-8 text-teal-500 flex-shrink-0 mt-1"/>
                            <div className="flex-grow">
                                <h4 className="font-semibold text-lg">{group.representative.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {group.totalQuantity}</p>
                                {group.representative.tags.length > 0 && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Tags: {group.representative.tags.join(', ')}</p>
                                )}
                            </div>
                        </div>
                        {suggestion && (
                            <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center justify-between gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 rounded-md">
                                <div className="flex items-center gap-2">
                                    <LightbulbIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Suggestion: <strong>{getPath(suggestion.id, state.entities)}</strong>
                                    </p>
                                </div>
                                <button onClick={() => handleQuickPlace(key, suggestion.id)} className="px-3 py-1 text-sm font-semibold bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                                    Quick Place
                                </button>
                            </div>
                        )}
                    </div>
                );
            }) : (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No unplaced items.</p>
                </div>
            )}
        </div>
        <Modal isOpen={isManualPlaceModalOpen} onClose={() => setIsManualPlaceModalOpen(false)} title="Select a Container">
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {possibleDestinations.map(dest => (
                    <button key={dest.id} onClick={() => handleManualPlace(dest.id)} className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        {getPath(dest.id, state.entities)}
                    </button>
                ))}
            </div>
        </Modal>
      </div>
    );
};

export const ManagementHubView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'bulk' | 'unplaced' | 'laundry' | 'tags' | 'properties'>('bulk');

    const renderContent = () => {
        switch (activeTab) {
            case 'bulk': return <BulkEditView />;
            case 'unplaced': return <UnplacedItemsManager />;
            case 'laundry': return <LaundryHubView />;
            case 'tags': return <TaggingHubView />;
            case 'properties': return <div className="p-4"><CustomPropertyManager /></div>;
            default: return null;
        }
    };

    const tabClasses = (tabName: 'bulk' |'unplaced' | 'laundry' | 'tags' | 'properties') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
        activeTab === tabName
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
        }`;

    return (
        <div className="flex flex-col h-full">
            <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Management Hub</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">The central hub for all item properties and actions.</p>
            </header>
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <nav className="-mb-px flex space-x-2 px-4 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveTab('bulk')} className={tabClasses('bulk')}>Bulk Edit</button>
                    <button onClick={() => setActiveTab('unplaced')} className={tabClasses('unplaced')}>Unplaced Items</button>
                    <button onClick={() => setActiveTab('laundry')} className={tabClasses('laundry')}>Laundry Manager</button>
                    <button onClick={() => setActiveTab('tags')} className={tabClasses('tags')}>Tag Manager</button>
                    <button onClick={() => setActiveTab('properties')} className={tabClasses('properties')}>Properties</button>
                </nav>
            </div>
            <main className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {renderContent()}
            </main>
        </div>
    );
};