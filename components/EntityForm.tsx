import React, { useState, useEffect, useContext, useMemo } from 'react';
import { InventoryEntity, EntityType, CustomProperty, Item, Container, LaundryLink } from '../types';
import { InventoryContext } from '../contexts/InventoryContext';
// FIX: Import TrashIcon and LightbulbIcon.
import { TrashIcon, LightbulbIcon } from './icons';
import { useToasts } from '../contexts/ToastContext';

interface EntityFormProps {
  entity?: InventoryEntity | null;
  parentId: string;
  entityType: EntityType;
  onSave: () => void;
  onClose: () => void;
  isMisc?: boolean;
  allPropertyKeys?: string[];
  isLaundryAddition?: boolean;
}

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

export const EntityForm: React.FC<EntityFormProps> = ({ entity, parentId, entityType, onSave, onClose, isMisc = false, allPropertyKeys = [], isLaundryAddition = false }) => {
  const { state, dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<Item['status']>('Placed');
  const [linkedTag, setLinkedTag] = useState('');
  const [customProps, setCustomProps] = useState<CustomProperty[]>([]);
  const [capacity, setCapacity] = useState<Container['capacity']>();
  const [currentParentId, setCurrentParentId] = useState(parentId);

  useEffect(() => {
    setCurrentParentId(parentId);
  }, [parentId]);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setCustomProps(entity.customProps || []);
      if (entity.type === EntityType.Item) {
        setQuantity((entity as Item).quantity);
        setTags((entity as Item).tags?.join(', ') || '');
        setStatus((entity as Item).status);
      }
      if (entity.type === EntityType.Container) {
        setCapacity((entity as Container).capacity);
      }
      if (entity.type === EntityType.LaundryLink) {
        setLinkedTag((entity as LaundryLink).linkedTag || '');
      }
    } else {
      setName('');
      setQuantity(1);
      setTags(isLaundryAddition ? 'laundry' : '');
      setStatus(isLaundryAddition ? 'Dirty' : (isMisc ? 'Clean (Unplaced)' : 'Placed'));
      setLinkedTag('');
      setCustomProps([]);
      setCapacity(undefined);
      setCurrentParentId(parentId); // Reset parent on new entity
    }
  }, [entity, parentId, isLaundryAddition, isMisc]);

  const tagsArray = useMemo(() => tags.split(',').map(t => t.trim()).filter(Boolean), [tags]);
  const isLaundryItem = useMemo(() => tagsArray.includes('laundry'), [tagsArray]);

  const suggestedContainer = useMemo(() => {
    if (entity || isMisc || entityType !== EntityType.Item || tagsArray.length === 0) {
      return null;
    }
    
    const allEntities = Object.values(state.entities) as InventoryEntity[];
    const allItems = allEntities.filter((e): e is Item => e.type === EntityType.Item);
    
    const permanentItemLocations = new Map<string, string[]>(); // Map<tag, containerId[]>
    allItems.forEach(item => {
        if (item.status === 'Placed' && item.parentId && state.entities[item.parentId]?.parentId !== 'misc_root') {
            item.tags.forEach(tag => {
                if (!permanentItemLocations.has(tag)) permanentItemLocations.set(tag, []);
                permanentItemLocations.get(tag)!.push(item.parentId!);
            });
        }
    });

    const tagCountsInContainers = new Map<string, number>();
    tagsArray.forEach(tag => {
        const containerIds = permanentItemLocations.get(tag);
        if (containerIds) {
            containerIds.forEach(containerId => {
                tagCountsInContainers.set(containerId, (tagCountsInContainers.get(containerId) || 0) + 1);
            });
        }
    });

    if (tagCountsInContainers.size === 0) return null;

    let bestContainerId: string | null = null;
    let maxScore = 0;
    for (const [containerId, score] of tagCountsInContainers.entries()) {
        if (score > maxScore) {
            maxScore = score;
            bestContainerId = containerId;
        }
    }

    return bestContainerId ? state.entities[bestContainerId] : null;

  }, [tagsArray, state.entities, entity, isMisc, entityType]);

  const handleAddProp = () => {
    setCustomProps([...customProps, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const handlePropChange = (index: number, field: 'key' | 'value', value: string) => {
    const newProps = [...customProps];
    newProps[index][field] = value;
    setCustomProps(newProps);
  };

  const handleRemoveProp = (id: string) => {
    setCustomProps(customProps.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomProps = customProps.filter(p => p.key.trim() !== '');
    
    const newEntity: InventoryEntity = {
      id: entity?.id || crypto.randomUUID(),
      name,
      type: entityType,
      parentId: currentParentId,
      customProps: finalCustomProps,
      ...(entityType === EntityType.Container && { capacity }),
      ...(entityType === EntityType.Item && { 
        quantity, 
        tags: tagsArray,
        status: status,
      }),
      ...(entityType === EntityType.LaundryLink && { linkedTag: linkedTag.trim() }),
    } as InventoryEntity;

    dispatch({ type: 'SAVE_ENTITY', payload: newEntity });
    addToast(`${entityType.toLowerCase().replace('_', ' ')} saved successfully!`, 'success');
    onSave();
  };
  
  const formTitle = entity ? `Edit ${entity.name}` : `Add New ${entityType.charAt(0) + entityType.slice(1).toLowerCase().replace('_', ' ')}`;
  const isCreatingNewItem = !entity && entityType === EntityType.Item;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-900 dark:text-white">
      <div>
        <label htmlFor="name" className="block mb-2 text-sm font-medium">Name</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
      </div>

      {entityType === EntityType.Container && (
        <div>
          <label htmlFor="capacity" className="block mb-2 text-sm font-medium">Capacity Status</label>
          <select 
            id="capacity" 
            value={capacity || ''} 
            onChange={(e) => setCapacity(e.target.value as Container['capacity'])}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="">Not set</option>
            <option value="Empty">Empty</option>
            <option value="Plenty of Space">Plenty of Space</option>
            <option value="Getting Full">Getting Full</option>
            <option value="Full">Full</option>
          </select>
        </div>
      )}

      {entityType === EntityType.LaundryLink && (
          <div>
            <label htmlFor="linkedTag" className="block mb-2 text-sm font-medium">Linked Tag</label>
            <input type="text" id="linkedTag" value={linkedTag} onChange={(e) => setLinkedTag(e.target.value)} required placeholder="e.g. t-shirt" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This links the group to all items with this tag.</p>
          </div>
      )}

      {entityType === EntityType.Item && (
        <>
          <div>
            <label htmlFor="quantity" className="block mb-2 text-sm font-medium">Quantity</label>
             <div className="relative flex items-center max-w-[8rem]">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-l-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16"/></svg>
                </button>
                <input type="text" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-primary-500 focus:border-primary-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required />
                <button type="button" onClick={() => setQuantity(q => q + 1)} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-r-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/></svg>
                </button>
            </div>
          </div>
          <div>
            <label htmlFor="tags" className="block mb-2 text-sm font-medium">Tags (comma-separated)</label>
            <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. clothing, electronics, laundry" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
          </div>
           <div>
              <label htmlFor="status" className="block mb-2 text-sm font-medium">Status</label>
              <select 
                id="status" 
                value={status} 
                onChange={(e) => setStatus(e.target.value as Item['status'])}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              >
                <option value="Placed">Placed</option>
                <option value="Clean (Unplaced)">Clean (Unplaced)</option>
                {isLaundryItem && <option value="Dirty">Dirty</option>}
                {isLaundryItem && <option value="Washing">Washing</option>}
              </select>
          </div>
          {isCreatingNewItem && suggestedContainer && (
             <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center justify-between gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 rounded-md">
                <div className="flex items-center gap-2">
                    <LightbulbIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Suggestion: Place in <strong>{getPath(suggestedContainer.id, state.entities)}</strong>
                    </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setCurrentParentId(suggestedContainer.id)} 
                  className="px-3 py-1 text-sm font-semibold bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                  disabled={currentParentId === suggestedContainer.id}
                >
                    {currentParentId === suggestedContainer.id ? 'Selected' : 'Select'}
                </button>
            </div>
          )}
        </>
      )}

      <div>
        <h4 className="text-md font-semibold mb-2 mt-4 border-t pt-4 dark:border-gray-600">Custom Properties</h4>
        <div className="space-y-2">
          {customProps.map((prop, index) => (
            <div key={prop.id} className="flex items-center gap-2">
              <input
                type="text"
                value={prop.key}
                onChange={(e) => handlePropChange(index, 'key', e.target.value)}
                placeholder="Property Name"
                list="property-keys"
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
              />
              <datalist id="property-keys">
                {allPropertyKeys.map(key => <option key={key} value={key} />)}
              </datalist>
              <input
                type="text"
                value={prop.value}
                onChange={(e) => handlePropChange(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
              />
              <button type="button" onClick={() => handleRemoveProp(prop.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={handleAddProp} className="mt-2 text-sm text-primary-600 hover:underline">Add Property</button>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-600">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {entity ? 'Save Changes' : 'Add Entity'}
        </button>
      </div>
    </form>
  );
};