
import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, PropsWithChildren } from 'react';
import { InventoryEntity, Clipboard, EntityType, Item, Container } from '../types';

interface AppState {
  entities: Record<string, InventoryEntity>;
  clipboard: Clipboard | null;
}

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'SAVE_ENTITY'; payload: InventoryEntity }
  | { type: 'DELETE_ENTITIES'; payload: { ids: string[] } }
  | { type: 'COPY_ENTITIES'; payload: { ids: string[] } }
  | { type: 'PASTE_ENTITIES'; payload: { destinationId: string } }
  | { type: 'MOVE_ENTITIES'; payload: { ids: string[]; destinationId: string } }
  | { type: 'PLACE_MISC_ITEMS'; payload: { ids: string[]; destinationId: string } }
  | { type: 'RENAME_TAG'; payload: { oldName: string; newName: string } }
  | { type: 'MERGE_TAGS'; payload: { sourceTags: string[]; targetTag: string } }
  | { type: 'DELETE_TAG'; payload: { tagName: string } }
  | { type: 'BULK_ADD_TAGS'; payload: { ids: string[]; tags: string[] } }
  | { type: 'BULK_REMOVE_TAGS'; payload: { ids: string[]; tags: string[] } }
  | { type: 'BULK_REPLACE_TAG'; payload: { ids: string[]; oldTag: string; newTag: string } }
  | { type: 'SET_CONTAINER_CAPACITY'; payload: { id: string; capacity: Container['capacity'] } }
  | { type: 'SET_ITEM_STATUS'; payload: { ids: string[]; status: Item['status'] } }
  | { type: 'RENAME_PROPERTY_KEY'; payload: { oldKey: string; newKey: string } }
  | { type: 'DELETE_PROPERTY_KEY'; payload: { key: string } };

export const initialState: AppState = {
  entities: {
    'root': { id: 'root', name: 'My Home', type: EntityType.Property, parentId: null, customProps: [] },
    'misc_root': { id: 'misc_root', name: 'Misc Containers', type: EntityType.Property, parentId: null, customProps: [] },
    'laundry_dirty': { id: 'laundry_dirty', name: 'Dirty Laundry Basket', type: EntityType.Container, parentId: 'root', customProps: [] },
    'laundry_washing': { id: 'laundry_washing', name: 'Washing Machine', type: EntityType.Container, parentId: 'root', customProps: [] },
    'laundry_drying': { id: 'laundry_drying', name: 'Clothesline', type: EntityType.Container, parentId: 'root', customProps: [] },
    'laundry_clean': { id: 'laundry_clean', name: 'Clean Laundry Basket', type: EntityType.Container, parentId: 'root', customProps: [] },
  },
  clipboard: null,
};

function inventoryReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'SAVE_ENTITY': {
      let entityToSave = action.payload;
      // Enforce status rules for items
      if (entityToSave.type === EntityType.Item) {
        const item = entityToSave as Item;
        const isLaundry = item.tags.includes('laundry');
        const isLaundryStatus = ['Dirty', 'Washing'].includes(item.status);
        if (!isLaundry && isLaundryStatus) {
          item.status = 'Clean (Unplaced)';
        }
      }
      const newEntities = { ...state.entities, [entityToSave.id]: entityToSave };
      return { ...state, entities: newEntities };
    }
    case 'DELETE_ENTITIES': {
      const newEntities = { ...state.entities };
      const idsToDelete = new Set(action.payload.ids);

      const recursiveDelete = (id: string) => {
        idsToDelete.add(id);
        // FIX: Explicitly type `entity` to avoid `unknown` type from Object.values.
        (Object.values(newEntities) as InventoryEntity[]).forEach((entity) => {
          if (entity.parentId === id) {
            recursiveDelete(entity.id);
          }
        });
      };
      
      action.payload.ids.forEach(id => recursiveDelete(id));
      
      idsToDelete.forEach(id => {
        delete newEntities[id];
      });

      return { ...state, entities: newEntities };
    }
    case 'COPY_ENTITIES':
      return { ...state, clipboard: { entityIds: action.payload.ids } };
    case 'PASTE_ENTITIES': {
      if (!state.clipboard) return state;

      const newEntities = { ...state.entities };
      const { destinationId } = action.payload;
      const idMap = new Map<string, string>();
      
      const cloneEntity = (originalId: string, newParentId: string) => {
        const originalEntity = state.entities[originalId];
        // FIX: Prevent pasting of Property entities and handle discriminated union spread correctly.
        if (!originalEntity || originalEntity.type === EntityType.Property) return;
        
        const newId = crypto.randomUUID();
        idMap.set(originalId, newId);
        
        const newEntity = {
          ...originalEntity,
          id: newId,
          parentId: newParentId,
          customProps: originalEntity.customProps.map(prop => ({...prop, id: crypto.randomUUID()})),
        } as InventoryEntity;

        if (newEntity.type === EntityType.Item) {
          // Pasted items should become unplaced until user organizes them.
          newEntity.status = 'Clean (Unplaced)';
        }

        newEntities[newId] = newEntity;

        // FIX: Explicitly type `e` to avoid `unknown` type from Object.values.
        const children = (Object.values(state.entities) as InventoryEntity[]).filter(e => e.parentId === originalId);
        children.forEach(child => cloneEntity(child.id, newId));
      };

      state.clipboard.entityIds.forEach(id => cloneEntity(id, destinationId));
      
      return { ...state, entities: newEntities, clipboard: null };
    }
    case 'MOVE_ENTITIES': {
        const { ids, destinationId } = action.payload;
        const newEntities = { ...state.entities };
        let newStatus: Item['status'] | null = null;
        switch(destinationId) {
            case 'laundry_dirty': newStatus = 'Dirty'; break;
            case 'laundry_washing':
            case 'laundry_drying': newStatus = 'Washing'; break;
            case 'laundry_clean': newStatus = 'Clean (Unplaced)'; break;
        }

        ids.forEach(id => {
            if(newEntities[id]) {
                newEntities[id].parentId = destinationId;
                if(newStatus && newEntities[id].type === EntityType.Item) {
                    (newEntities[id] as Item).status = newStatus;
                }
            }
        });
        return { ...state, entities: newEntities };
    }
    case 'PLACE_MISC_ITEMS': {
      const { ids, destinationId } = action.payload;
      const newEntities = { ...state.entities };
      ids.forEach(id => {
        const item = newEntities[id];
        if(item && item.type === EntityType.Item) {
          (item as Item).parentId = destinationId;
          (item as Item).status = 'Placed';
        }
      });
      return { ...state, entities: newEntities };
    }
    case 'RENAME_TAG': {
        const { oldName, newName } = action.payload;
        if (!oldName || !newName || oldName === newName) return state;
        const newEntities = { ...state.entities };
        for (const id in newEntities) {
            const entity = newEntities[id];
            if (entity.type === EntityType.Item) {
                const item = entity as Item;
                const tagIndex = item.tags.indexOf(oldName);
                if (tagIndex > -1) {
                    const newTags = [...item.tags];
                    newTags[tagIndex] = newName;
                    const updatedItem = { ...item, tags: [...new Set(newTags)] };

                    // Also check if status needs to be updated after tag change
                    const isLaundry = updatedItem.tags.includes('laundry');
                    const isLaundryStatus = ['Dirty', 'Washing'].includes(updatedItem.status);
                    if (!isLaundry && isLaundryStatus) {
                        updatedItem.status = 'Clean (Unplaced)';
                    }

                    newEntities[id] = updatedItem;
                }
            }
        }
        return { ...state, entities: newEntities };
    }
    case 'MERGE_TAGS': {
        const { sourceTags, targetTag } = action.payload;
        const newEntities = { ...state.entities };
        const sourceTagsSet = new Set(sourceTags);
        for (const id in newEntities) {
            const entity = newEntities[id];
            if (entity.type === EntityType.Item) {
                const item = entity as Item;
                const hasSourceTag = item.tags.some(t => sourceTagsSet.has(t));
                if (hasSourceTag) {
                    let newTags = item.tags.filter(t => !sourceTagsSet.has(t));
                    if (!newTags.includes(targetTag)) {
                        newTags.push(targetTag);
                    }
                    newEntities[id] = { ...item, tags: newTags };
                }
            }
        }
        return { ...state, entities: newEntities };
    }
    case 'DELETE_TAG': {
        const { tagName } = action.payload;
        const newEntities = { ...state.entities };
        for (const id in newEntities) {
            const entity = newEntities[id];
            if (entity.type === EntityType.Item) {
                const item = entity as Item;
                if (item.tags.includes(tagName)) {
                   const updatedItem = { ...item, tags: item.tags.filter(t => t !== tagName) };
                    // Also check if status needs to be updated after tag change
                    if (tagName === 'laundry') {
                        const isLaundryStatus = ['Dirty', 'Washing'].includes(updatedItem.status);
                        if (isLaundryStatus) {
                            updatedItem.status = 'Clean (Unplaced)';
                        }
                    }
                    newEntities[id] = updatedItem;
                }
            }
        }
        return { ...state, entities: newEntities };
    }
    case 'BULK_ADD_TAGS': {
      const { ids, tags } = action.payload;
      const newEntities = { ...state.entities };
      ids.forEach(id => {
        const entity = newEntities[id];
        if (entity && entity.type === EntityType.Item) {
          const item = entity as Item;
          const newTags = [...new Set([...item.tags, ...tags])];
          newEntities[id] = { ...item, tags: newTags };
        }
      });
      return { ...state, entities: newEntities };
    }
    case 'BULK_REMOVE_TAGS': {
      const { ids, tags } = action.payload;
      const tagsToRemoveSet = new Set(tags);
      const newEntities = { ...state.entities };
      ids.forEach(id => {
        const entity = newEntities[id];
        if (entity && entity.type === EntityType.Item) {
          const item = entity as Item;
          const newTags = item.tags.filter(t => !tagsToRemoveSet.has(t));
          const updatedItem = { ...item, tags: newTags };

          if (tagsToRemoveSet.has('laundry')) {
            const isLaundryStatus = ['Dirty', 'Washing'].includes(updatedItem.status);
            if (isLaundryStatus) {
                updatedItem.status = 'Clean (Unplaced)';
            }
          }
          newEntities[id] = updatedItem;
        }
      });
      return { ...state, entities: newEntities };
    }
    case 'BULK_REPLACE_TAG': {
      const { ids, oldTag, newTag } = action.payload;
      if (!oldTag || !newTag || oldTag === newTag) return state;
      const newEntities = { ...state.entities };
      ids.forEach(id => {
        const entity = newEntities[id];
        if (entity && entity.type === EntityType.Item) {
          const item = entity as Item;
          const tagIndex = item.tags.indexOf(oldTag);
          if (tagIndex > -1) {
            const newTags = [...item.tags];
            newTags[tagIndex] = newTag;
            const updatedItem = { ...item, tags: [...new Set(newTags)] };

             if (oldTag === 'laundry' && newTag !== 'laundry') {
                const isLaundryStatus = ['Dirty', 'Washing'].includes(updatedItem.status);
                if (isLaundryStatus) {
                    updatedItem.status = 'Clean (Unplaced)';
                }
             }
             newEntities[id] = updatedItem;
          }
        }
      });
      return { ...state, entities: newEntities };
    }
    case 'SET_CONTAINER_CAPACITY': {
        const { id, capacity } = action.payload;
        const newEntities = { ...state.entities };
        const container = newEntities[id];
        if(container && container.type === EntityType.Container) {
            (container as Container).capacity = capacity;
        }
        return { ...state, entities: newEntities };
    }
    case 'SET_ITEM_STATUS': {
        const { ids, status } = action.payload;
        const newEntities = { ...state.entities };
        ids.forEach(id => {
            const item = newEntities[id];
            if(item && item.type === EntityType.Item) {
                (item as Item).status = status;
                if (status === 'Placed' && item.parentId === 'misc_root') {
                    // This case should be handled by a more specific action like PLACE_MISC_ITEMS
                    // but as a fallback, we prevent items from being 'Placed' in the misc root.
                    console.warn("Cannot set status to 'Placed' for items in misc_root without a destination.");
                }
            }
        });
        return { ...state, entities: newEntities };
    }
    case 'RENAME_PROPERTY_KEY': {
      const { oldKey, newKey } = action.payload;
      if (!oldKey || !newKey || oldKey === newKey) return state;
      const newEntities = { ...state.entities };
      for (const id in newEntities) {
        const entity = newEntities[id];
        if (entity.customProps && entity.customProps.length > 0) {
          let propsChanged = false;
          const newProps = entity.customProps.map(prop => {
            if (prop.key === oldKey) {
              propsChanged = true;
              return { ...prop, key: newKey };
            }
            return prop;
          });
          if (propsChanged) {
            newEntities[id] = { ...entity, customProps: newProps };
          }
        }
      }
      return { ...state, entities: newEntities };
    }
    case 'DELETE_PROPERTY_KEY': {
      const { key } = action.payload;
      const newEntities = { ...state.entities };
      for (const id in newEntities) {
        const entity = newEntities[id];
        if (entity.customProps && entity.customProps.some(p => p.key === key)) {
          newEntities[id] = {
            ...entity,
            customProps: entity.customProps.filter(p => p.key !== key),
          };
        }
      }
      return { ...state, entities: newEntities };
    }
    default:
      return state;
  }
}

export const InventoryContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

const ensureLaundryContainers = (currentEntities: Record<string, InventoryEntity>): Record<string, InventoryEntity> => {
    const entities = { ...currentEntities };
    // FIX: Explicitly type the array to ensure objects conform to the Container interface.
    const requiredContainers: Container[] = [
        { id: 'laundry_dirty', name: 'Dirty Laundry Basket', type: EntityType.Container, parentId: 'root', customProps: [] },
        { id: 'laundry_washing', name: 'Washing Machine', type: EntityType.Container, parentId: 'root', customProps: [] },
        { id: 'laundry_drying', name: 'Clothesline', type: EntityType.Container, parentId: 'root', customProps: [] },
        { id: 'laundry_clean', name: 'Clean Laundry Basket', type: EntityType.Container, parentId: 'root', customProps: [] },
    ];
    requiredContainers.forEach(container => {
        if (!entities[container.id]) {
            entities[container.id] = container;
        }
    });
    return entities;
}


// FIX: Use PropsWithChildren for correct typing of components with children.
export const InventoryProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  useEffect(() => {
    try {
      const savedStateString = localStorage.getItem('inventoryState');
      if (savedStateString) {
        const savedState = JSON.parse(savedStateString);
        // Ensure laundry containers exist for users with older data
        savedState.entities = ensureLaundryContainers(savedState.entities);
        dispatch({ type: 'LOAD_STATE', payload: savedState });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('inventoryState', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state]);

  return (
    <InventoryContext.Provider value={{ state, dispatch }}>
      {children}
    </InventoryContext.Provider>
  );
};
