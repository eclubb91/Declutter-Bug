
import React, { useState, useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { EntityType, Item, InventoryEntity } from '../types';
import { PlusIcon, CheckSquareIcon, SquareIcon } from './icons';
import { Modal } from './Modal';
import { EntityForm } from './EntityForm';
import { useToasts } from '../contexts/ToastContext';

const LaundryColumn: React.FC<{
  title: string;
  items: Item[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
}> = ({ title, items, selectedIds, onToggleSelection, onToggleAll, allSelected }) => {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h3>
        <label className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <input 
            type="checkbox" 
            checked={allSelected} 
            onChange={onToggleAll} 
            className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            disabled={items.length === 0}
            />
          <span>All</span>
        </label>
      </div>
      <div className="space-y-2 h-full max-h-[calc(100vh-300px)] overflow-y-auto">
        {items.length > 0 ? items.map(item => (
          <div
            key={item.id}
            onClick={() => onToggleSelection(item.id)}
            className={`flex items-center p-2 rounded-md cursor-pointer ${selectedIds.includes(item.id) ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-white dark:bg-gray-700'}`}
          >
            {selectedIds.includes(item.id) ? <CheckSquareIcon className="w-5 h-5 text-primary-600 mr-3" /> : <SquareIcon className="w-5 h-5 text-gray-400 mr-3" />}
            <span className="flex-grow text-gray-800 dark:text-gray-200">{item.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">x{item.quantity}</span>
          </div>
        )) : (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};


export const LaundryHubView: React.FC = () => {
  const { state, dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { dirtyItems, washingItems, cleanItems } = useMemo(() => {
    const dirty: Item[] = [];
    const washing: Item[] = [];
    const clean: Item[] = [];
    
    for (const entity of (Object.values(state.entities) as InventoryEntity[])) {
      if (entity.type === EntityType.Item) {
        const item = entity as Item;
        if (item.status === 'Dirty') dirty.push(item);
        else if (item.status === 'Washing') washing.push(item);
        else if (item.status === 'Clean (Unplaced)') clean.push(item);
      }
    }
    return { 
        dirtyItems: dirty.sort((a, b) => a.name.localeCompare(b.name)), 
        washingItems: washing.sort((a, b) => a.name.localeCompare(b.name)), 
        cleanItems: clean.sort((a, b) => a.name.localeCompare(b.name)) 
    };
  }, [state.entities]);
  
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const handleToggleAll = (items: Item[]) => {
    const allIds = items.map(i => i.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  };
  
  const handleMove = (newStatus: Item['status'] | 'PutAway') => {
    let itemsToMove: string[] = [];
    let finalStatus: Item['status'] = 'Placed';

    if (newStatus === 'Washing') {
        itemsToMove = selectedIds.filter(id => (state.entities[id] as Item)?.status === 'Dirty');
        finalStatus = 'Washing';
    } else if (newStatus === 'Clean (Unplaced)') {
        itemsToMove = selectedIds.filter(id => (state.entities[id] as Item)?.status === 'Washing');
        finalStatus = 'Clean (Unplaced)';
    } else if (newStatus === 'PutAway') {
        itemsToMove = selectedIds.filter(id => (state.entities[id] as Item)?.status === 'Clean (Unplaced)');
        finalStatus = 'Clean (Unplaced)'; // Items are moved to unplaced hub, not directly placed
    }
    
    if (itemsToMove.length > 0) {
      dispatch({ type: 'SET_ITEM_STATUS', payload: { ids: itemsToMove, status: finalStatus } });
      if (newStatus === 'Washing') addToast('Moved to washing', 'info');
      else if (newStatus === 'Clean (Unplaced)') addToast('Wash finished!', 'success');
      else if (newStatus === 'PutAway') addToast('Items sent to be put away', 'info');
      setSelectedIds(prev => prev.filter(id => !itemsToMove.includes(id)));
    }
  };

  const selectedDirty = selectedIds.filter(id => (state.entities[id] as Item)?.status === 'Dirty');
  const selectedWashing = selectedIds.filter(id => (state.entities[id] as Item)?.status === 'Washing');
  const selectedClean = selectedIds.filter(id => (state.entities[id] as Item)?.status === 'Clean (Unplaced)');

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4">
        <button onClick={() => setIsFormOpen(true)} title="Add Item to Laundry" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700">
          <PlusIcon className="w-6 h-6 text-primary-600" />
        </button>
      </div>
      
      <main className="flex-grow p-4 pt-0 overflow-y-hidden flex flex-col md:flex-row gap-4">
        <LaundryColumn 
          title="Dirty" 
          items={dirtyItems} 
          selectedIds={selectedIds} 
          onToggleSelection={handleToggleSelection}
          allSelected={dirtyItems.length > 0 && dirtyItems.every(i => selectedIds.includes(i.id))}
          onToggleAll={() => handleToggleAll(dirtyItems)}
        />
        <LaundryColumn 
          title="Washing" 
          items={washingItems} 
          selectedIds={selectedIds} 
          onToggleSelection={handleToggleSelection} 
          allSelected={washingItems.length > 0 && washingItems.every(i => selectedIds.includes(i.id))}
          onToggleAll={() => handleToggleAll(washingItems)}
        />
        <LaundryColumn 
          title="Clean" 
          items={cleanItems} 
          selectedIds={selectedIds} 
          onToggleSelection={handleToggleSelection}
          allSelected={cleanItems.length > 0 && cleanItems.every(i => selectedIds.includes(i.id))}
          onToggleAll={() => handleToggleAll(cleanItems)}
        />
      </main>
      
      <footer className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-center items-center gap-4">
        <button 
            onClick={() => handleMove('Washing')}
            disabled={selectedDirty.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
            Start Wash ({selectedDirty.length})
        </button>
         <button 
            onClick={() => handleMove('Clean (Unplaced)')}
            disabled={selectedWashing.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
            Finish Wash ({selectedWashing.length})
        </button>
         <button 
            onClick={() => handleMove('PutAway')}
            disabled={selectedClean.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
            Put Away ({selectedClean.length})
        </button>
      </footer>
      
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add New Item to Laundry">
        <EntityForm
          entity={null}
          parentId="misc_root"
          entityType={EntityType.Item}
          onSave={() => setIsFormOpen(false)}
          isLaundryAddition={true}
        />
      </Modal>
    </div>
  );
};