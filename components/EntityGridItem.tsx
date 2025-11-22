import React, { useContext } from 'react';
import { InventoryEntity, EntityType, Item } from '../types';
import { InventoryContext } from '../contexts/InventoryContext';
import {
  VisualDefaultIcon,
  VisualKitchenIcon,
  VisualBathroomIcon,
  VisualLivingRoomIcon,
  VisualAccessIcon,
  VisualContainerIcon,
  VisualUnitIcon,
  VisualCompartmentIcon,
  VisualDirtyBasketIcon,
  VisualWashingMachineIcon,
  VisualClotheslineIcon,
  VisualCleanBasketIcon
} from './icons';

interface EntityGridItemProps {
  entity: InventoryEntity;
  onSelect: () => void;
}

const getVisualIcon = (entity: InventoryEntity) => {
  // Check for special laundry containers first
  switch (entity.id) {
    case 'laundry_dirty': return <VisualDirtyBasketIcon className="w-16 h-16 text-red-500" />;
    case 'laundry_washing': return <VisualWashingMachineIcon className="w-16 h-16 text-blue-500" />;
    case 'laundry_drying': return <VisualClotheslineIcon className="w-16 h-16 text-sky-500" />;
    case 'laundry_clean': return <VisualCleanBasketIcon className="w-16 h-16 text-green-500" />;
  }
  
  if (entity.type === EntityType.Container) {
    return <VisualContainerIcon className="w-16 h-16 text-amber-500" />;
  }
  if (entity.type === EntityType.Unit) {
    return <VisualUnitIcon className="w-16 h-16 text-purple-500" />;
  }
  if (entity.type === EntityType.Compartment) {
    return <VisualCompartmentIcon className="w-16 h-16 text-cyan-500" />;
  }
  
  const name = entity.name.toLowerCase();
  if (name.includes('kitchen')) return <VisualKitchenIcon className="w-16 h-16 text-orange-500" />;
  if (name.includes('bathroom')) return <VisualBathroomIcon className="w-16 h-16 text-blue-500" />;
  if (name.includes('living')) return <VisualLivingRoomIcon className="w-16 h-16 text-green-500" />;
  if (name.includes('access') || name.includes('hall')) return <VisualAccessIcon className="w-16 h-16 text-gray-500" />;

  return <VisualDefaultIcon className="w-16 h-16 text-indigo-500" />;
};

export const EntityGridItem: React.FC<EntityGridItemProps> = ({ entity, onSelect }) => {
  const { state } = useContext(InventoryContext);

  const getRecursiveItemCount = (id: string): number => {
    const children = (Object.values(state.entities) as InventoryEntity[]).filter(e => e.parentId === id);
    return children.reduce((acc, child) => {
      if (child.type === EntityType.Item) {
        return acc + (child as Item).quantity;
      }
      // Recurse into any entity that can contain other entities
      if ([EntityType.Room, EntityType.Unit, EntityType.Compartment, EntityType.Container].includes(child.type as EntityType)) {
        return acc + getRecursiveItemCount(child.id);
      }
      return acc;
    }, 0);
  };
  
  const count = getRecursiveItemCount(entity.id);

  return (
    <div
      onClick={onSelect}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer aspect-square flex flex-col justify-between items-center p-4 text-center border dark:border-gray-700"
    >
      <div className="flex-grow flex items-center justify-center">
        {getVisualIcon(entity)}
      </div>
      <div className="w-full">
        <p className="font-semibold text-gray-800 dark:text-white truncate">{entity.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{count} item{count === 1 ? '' : 's'}</p>
      </div>
    </div>
  );
};