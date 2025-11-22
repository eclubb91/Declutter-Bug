import React, { useContext } from 'react';
import { InventoryEntity, EntityType, Item, Container } from '../types';
import { InventoryContext } from '../contexts/InventoryContext';
import { HomeIcon, RoomIcon, ContainerIcon, ItemIcon, ChevronRightIcon, SquareIcon, CheckSquareIcon, TagIcon, UnitIcon, CompartmentIcon } from './icons';

interface EntityListItemProps {
  entity: InventoryEntity;
  onSelect: () => void;
  isEditing: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  disableDrilldown?: boolean;
}

const getIcon = (type: EntityType) => {
  switch (type) {
    case EntityType.Property: return <HomeIcon className="w-8 h-8 text-primary-500" />;
    case EntityType.Room: return <RoomIcon className="w-8 h-8 text-indigo-500" />;
    case EntityType.Unit: return <UnitIcon className="w-8 h-8 text-purple-500" />;
    case EntityType.Compartment: return <CompartmentIcon className="w-8 h-8 text-cyan-500" />;
    case EntityType.Container: return <ContainerIcon className="w-8 h-8 text-amber-500" />;
    case EntityType.Item: return <ItemIcon className="w-8 h-8 text-teal-500" />;
    default: return null;
  }
};

const capacityStyles: Record<string, string> = {
  'Empty': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Plenty of Space': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Getting Full': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Full': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusStyles: Record<string, string> = {
  'Placed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Dirty': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Washing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Clean (Unplaced)': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export const EntityListItem: React.FC<EntityListItemProps> = ({ entity, onSelect, isEditing, isSelected, onToggleSelection, disableDrilldown = false }) => {
  const { state, dispatch } = useContext(InventoryContext);

  const getChildCount = (parentId: string) => {
    // FIX: Explicitly type `e` to avoid `unknown` type from Object.values.
    return (Object.values(state.entities) as InventoryEntity[]).filter(e => e.parentId === parentId).length;
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as Item['status'];
    dispatch({ type: 'SET_ITEM_STATUS', payload: { ids: [entity.id], status: newStatus }});
  }

  const count = entity.type !== EntityType.Item ? getChildCount(entity.id) : (entity as Item).quantity;
  const countLabel = entity.type === EntityType.Item ? 'Quantity' : 'Items';
  
  const handleItemClick = () => {
    if (!isEditing) {
      if (!disableDrilldown) onSelect();
    } else {
      onToggleSelection(entity.id);
    }
  };

  const isLaundryItem = entity.type === EntityType.Item && (entity as Item).tags.includes('laundry');

  return (
    <div
      onClick={handleItemClick}
      className={`flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border ${!disableDrilldown ? 'cursor-pointer' : ''} ${isSelected ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700'}`}
    >
      {isEditing && (
        <div className="mr-4 pt-2" onClick={(e) => { e.stopPropagation(); onToggleSelection(entity.id); }}>
          {isSelected ? <CheckSquareIcon className="w-6 h-6 text-primary-600" /> : <SquareIcon className="w-6 h-6 text-gray-400" />}
        </div>
      )}
      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-4">
        {getIcon(entity.type)}
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between">
            <p className="font-semibold text-lg text-gray-800 dark:text-white">{entity.name}</p>
             {entity.type === EntityType.Item && !isEditing && (
                <select 
                    value={(entity as Item).status}
                    onChange={handleStatusChange}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="Placed">Placed</option>
                    <option value="Clean (Unplaced)">Clean (Unplaced)</option>
                    {isLaundryItem && <option value="Dirty">Dirty</option>}
                    {isLaundryItem && <option value="Washing">Washing</option>}
                </select>
             )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500 dark:text-gray-400">{count} {countLabel}</p>
            {entity.type === EntityType.Container && (entity as Container).capacity && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${capacityStyles[(entity as Container).capacity!] || ''}`}>
                    {(entity as Container).capacity}
                </span>
            )}
            {entity.type === EntityType.Item && (
                 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusStyles[(entity as Item).status] || ''}`}>
                    {(entity as Item).status}
                </span>
            )}
        </div>
        {entity.customProps && entity.customProps.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entity.customProps.filter(p => p.key).map(prop => (
              <div key={prop.id} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                <span className="font-medium">{prop.key}:</span> {prop.value}
              </div>
            ))}
          </div>
        )}
        {entity.type === EntityType.Item && (entity as Item).tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(entity as Item).tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {entity.type !== EntityType.Item && !isEditing && !disableDrilldown && (
        <div className="self-center">
            <ChevronRightIcon className="w-6 h-6 text-gray-400" />
        </div>
      )}
    </div>
  );
};