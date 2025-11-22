import React, { useState, useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { EntityType, InventoryEntity, Item } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { EntityListItem } from './EntityListItem';
import { Modal } from './Modal';
import { EntityForm } from './EntityForm';
import { BulkEditTagsModal } from './BulkEditTagsModal';
import { SetStatusModal } from './SetStatusModal';
import { CopyIcon, MoveIcon, TrashIcon, TagsIcon, LaundryIcon, PasteIcon, ChevronLeftIcon } from './icons';
import { useToasts } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

export const BulkEditView: React.FC = () => {
  const { state, dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [navigationStack, setNavigationStack] = useState<string[]>(['root']);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<InventoryEntity | null>(null);
  const [newEntityType, setNewEntityType] = useState<EntityType>(EntityType.Room);
  const [isBulkTagsModalOpen, setIsBulkTagsModalOpen] = useState(false);
  const [isSetStatusModalOpen, setIsSetStatusModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const currentParentId = navigationStack[navigationStack.length - 1];

  const childEntities = useMemo(() => {
    return (Object.values(state.entities) as InventoryEntity[])
      .filter((e: InventoryEntity) => e.parentId === currentParentId)
      .sort((a: InventoryEntity, b: InventoryEntity) => a.name.localeCompare(b.name));
  }, [state.entities, currentParentId]);
  
  const allPropertyKeys = useMemo(() => {
    const keys = new Set<string>();
    (Object.values(state.entities) as InventoryEntity[]).forEach(entity => {
        entity.customProps?.forEach(prop => {
            if (prop.key) keys.add(prop.key);
        });
    });
    return Array.from(keys).sort();
  }, [state.entities]);

  const handleDrillDown = (entity: InventoryEntity) => {
    if (isEditing) {
      handleToggleSelection(entity.id);
      return;
    }
    if (entity.type !== EntityType.Item) {
      setNavigationStack(prev => [...prev, entity.id]);
    } else {
      setEditingEntity(entity);
      setIsFormOpen(true);
    }
  };
  
  const handleBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(stack => stack.slice(0, -1));
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    const allChildIds = childEntities.map(e => e.id);
    const allSelected = allChildIds.length > 0 && allChildIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allChildIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allChildIds])]);
    }
  };

  const confirmDelete = () => {
    dispatch({ type: 'DELETE_ENTITIES', payload: { ids: selectedIds } });
    addToast(`${selectedIds.length} item(s) deleted.`, 'success');
    setSelectedIds([]);
    setIsEditing(false);
    setIsConfirmDeleteOpen(false);
  };
  
  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    dispatch({ type: 'COPY_ENTITIES', payload: { ids: selectedIds } });
    addToast(`${selectedIds.length} item(s) copied.`, 'info');
    setSelectedIds([]);
    setIsEditing(false);
  };
  
  const handlePaste = () => {
    if (!state.clipboard) {
        addToast('Clipboard is empty.', 'error');
        return;
    };
    dispatch({ type: 'PASTE_ENTITIES', payload: { destinationId: currentParentId } });
    addToast('Pasted from clipboard.', 'success');
  };

  const handleMove = (destinationId: string) => {
    dispatch({ type: 'MOVE_ENTITIES', payload: { ids: selectedIds, destinationId } });
    addToast(`${selectedIds.length} item(s) moved.`, 'success');
    setSelectedIds([]);
    setIsEditing(false);
    setIsMoveModalOpen(false);
  };

  const handleToLaundry = () => {
    const itemIds = selectedIds.filter(id => state.entities[id]?.type === EntityType.Item);
    if (itemIds.length === 0) {
      addToast('No items selected to move to laundry.', 'error');
      return;
    }
    dispatch({ type: 'SET_ITEM_STATUS', payload: { ids: itemIds, status: 'Dirty' } });
    addToast(`${itemIds.length} item(s) moved to laundry.`, 'info');
    setSelectedIds([]);
    setIsEditing(false);
  };
  
  const getPossibleMoveDestinations = (): InventoryEntity[] => {
    return (Object.values(state.entities) as InventoryEntity[])
      .filter(e => [EntityType.Room, EntityType.Unit, EntityType.Compartment, EntityType.Container].includes(e.type))
      .sort((a,b) => a.name.localeCompare(b.name));
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              {navigationStack.length > 1 && (
                  <button onClick={handleBack} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Go back">
                      <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
              )}
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Bulk Inventory Editor</h3>
            </div>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setSelectedIds([]); // Clear selection when toggling edit mode
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${isEditing ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
              >
                {isEditing ? `Done (${selectedIds.length})` : 'Edit'}
              </button>
          </div>
          <Breadcrumbs navigationStack={navigationStack} setNavigationStack={setNavigationStack} />
          
          {isEditing && (
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleCopy} disabled={selectedIds.length === 0} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><CopyIcon /></button>
                  <button onClick={handlePaste} disabled={!state.clipboard} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><PasteIcon /></button>
                  <button onClick={() => setIsMoveModalOpen(true)} disabled={selectedIds.length === 0} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><MoveIcon /></button>
                  <button onClick={() => setIsConfirmDeleteOpen(true)} disabled={selectedIds.length === 0} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-500 disabled:opacity-50"><TrashIcon /></button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setIsBulkTagsModalOpen(true)} disabled={selectedIds.filter(id => state.entities[id]?.type === EntityType.Item).length === 0} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><TagsIcon /></button>
                  <button onClick={() => setIsSetStatusModalOpen(true)} disabled={selectedIds.filter(id => state.entities[id]?.type === EntityType.Item).length === 0} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50">Set Status</button>
                  <button onClick={handleToLaundry} disabled={selectedIds.filter(id => state.entities[id]?.type === EntityType.Item).length === 0} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><LaundryIcon /></button>
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4">
            {childEntities.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">This location is empty.</p>
              </div>
            ) : (
              <>
                {isEditing && (
                    <label className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 px-2 pb-2 border-b dark:border-gray-700">
                    <input 
                        type="checkbox" 
                        checked={childEntities.length > 0 && childEntities.every(e => selectedIds.includes(e.id))} 
                        onChange={handleToggleAll} 
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        disabled={childEntities.length === 0}
                    />
                    <span>Select All</span>
                    </label>
                )}
                {childEntities.map(entity => (
                    <EntityListItem
                    key={entity.id}
                    entity={entity}
                    onSelect={() => handleDrillDown(entity)}
                    isEditing={isEditing}
                    isSelected={selectedIds.includes(entity.id)}
                    onToggleSelection={handleToggleSelection}
                    disableDrilldown={isEditing}
                    />
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEntity ? `Edit ${editingEntity.name}` : `Add New`}>
        <EntityForm
          entity={editingEntity}
          parentId={editingEntity ? editingEntity.parentId! : currentParentId}
          entityType={editingEntity ? editingEntity.type : newEntityType}
          onSave={() => setIsFormOpen(false)}
          onClose={() => setIsFormOpen(false)}
          allPropertyKeys={allPropertyKeys}
        />
      </Modal>

      <BulkEditTagsModal
        isOpen={isBulkTagsModalOpen}
        onClose={() => setIsBulkTagsModalOpen(false)}
        itemIds={selectedIds}
      />
      
      <SetStatusModal
        isOpen={isSetStatusModalOpen}
        onClose={() => setIsSetStatusModalOpen(false)}
        itemIds={selectedIds}
      />
      
      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="Move Items">
          <div className="space-y-2 max-h-96 overflow-y-auto">
              {getPossibleMoveDestinations().map(dest => (
                  <button key={dest.id} onClick={() => handleMove(dest.id)} className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                      {dest.name}
                  </button>
              ))}
          </div>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Items"
        message={`Are you sure you want to delete ${selectedIds.length} item(s)? This will also delete all items contained within them. This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
};