import React, { useState, useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { EntityType, InventoryEntity, Item } from '../types';
import { Header } from './Header';
import { EntityListItem } from './EntityListItem';
import { Modal } from './Modal';
import { EntityForm } from './EntityForm';
import { PlusIcon } from './icons';
import { EntityGridItem } from './EntityGridItem';

export const InventoryView: React.FC = () => {
  const { state } = useContext(InventoryContext);
  const [navigationStack, setNavigationStack] = useState<string[]>(['root']);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<InventoryEntity | null>(null);
  const [newEntityType, setNewEntityType] = useState<EntityType>(EntityType.Room);

  const currentParentId = navigationStack[navigationStack.length - 1];
  const currentParent = state.entities[currentParentId];

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
    if (entity.type !== EntityType.Item) {
      setNavigationStack(prev => [...prev, entity.id]);
    } else {
      setEditingEntity(entity);
      setIsFormOpen(true);
    }
  };

  const openAddForm = () => {
    let typeToAdd = EntityType.Room;
    if (currentParent?.type === EntityType.Room) {
        typeToAdd = EntityType.Unit;
    } else if (currentParent?.type === EntityType.Unit) {
        typeToAdd = EntityType.Compartment;
    } else if (currentParent?.type === EntityType.Compartment || currentParent?.type === EntityType.Container) {
        typeToAdd = EntityType.Container;
    }
    setNewEntityType(typeToAdd);
    setEditingEntity(null);
    setIsFormOpen(true);
  };
  
  const canAddRoom = currentParent?.type === EntityType.Property;
  const canAddUnit = currentParent?.type === EntityType.Room;
  const canAddCompartment = [EntityType.Room, EntityType.Unit].includes(currentParent?.type as EntityType);
  const canAddContainer = [EntityType.Room, EntityType.Unit, EntityType.Compartment, EntityType.Container].includes(currentParent?.type as EntityType);
  const canAddItem = [EntityType.Room, EntityType.Unit, EntityType.Compartment, EntityType.Container].includes(currentParent?.type as EntityType);

  const hasItemChildren = useMemo(() => childEntities.length > 0 && childEntities.every(e => e.type === EntityType.Item), [childEntities]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
      <Header
        navigationStack={navigationStack}
        setNavigationStack={setNavigationStack}
        title="Visual Hierarchy"
      />

      <main className="flex-grow overflow-y-auto p-4">
        {childEntities.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">This location is empty.</p>
          </div>
        ) : (
          hasItemChildren ? (
            <div className="space-y-3">
              {childEntities.map(entity => (
                <EntityListItem
                  key={entity.id}
                  entity={entity}
                  onSelect={() => handleDrillDown(entity)}
                  isEditing={false}
                  isSelected={false}
                  onToggleSelection={() => {}}
                  disableDrilldown={false}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {childEntities.map(entity => (
                <EntityGridItem
                  key={entity.id}
                  entity={entity}
                  onSelect={() => handleDrillDown(entity)}
                />
              ))}
            </div>
          )
        )}
      </main>

      <button
        onClick={openAddForm}
        className="absolute bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        aria-label="Add new entity"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEntity ? `Edit ${editingEntity.name}` : `Add New`}>
        <>
          {!editingEntity && (
            <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <button onClick={() => setNewEntityType(EntityType.Room)} disabled={!canAddRoom} className={`py-2 px-4 text-sm font-medium disabled:opacity-50 ${newEntityType === EntityType.Room ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Room</button>
              <button onClick={() => setNewEntityType(EntityType.Unit)} disabled={!canAddUnit} className={`py-2 px-4 text-sm font-medium disabled:opacity-50 ${newEntityType === EntityType.Unit ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Unit</button>
              <button onClick={() => setNewEntityType(EntityType.Compartment)} disabled={!canAddCompartment} className={`py-2 px-4 text-sm font-medium disabled:opacity-50 ${newEntityType === EntityType.Compartment ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Compartment</button>
              <button onClick={() => setNewEntityType(EntityType.Container)} disabled={!canAddContainer} className={`py-2 px-4 text-sm font-medium disabled:opacity-50 ${newEntityType === EntityType.Container ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Container</button>
              <button onClick={() => setNewEntityType(EntityType.Item)} disabled={!canAddItem} className={`py-2 px-4 text-sm font-medium disabled:opacity-50 ${newEntityType === EntityType.Item ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Item</button>
            </div>
          )}
          <EntityForm
            entity={editingEntity}
            parentId={editingEntity ? editingEntity.parentId! : currentParentId}
            entityType={editingEntity ? editingEntity.type : newEntityType}
            onSave={() => setIsFormOpen(false)}
            onClose={() => setIsFormOpen(false)}
            allPropertyKeys={allPropertyKeys}
          />
        </>
      </Modal>
    </div>
  );
};