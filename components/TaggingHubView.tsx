
import React, { useState, useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { EntityType, Item, InventoryEntity, Container } from '../types';
import { TagIcon, ContainerIcon, HomeIcon } from './icons';
import { ManageTagsModal } from './ManageTagsModal';
import { TagCloud } from './TagCloud';

type SortKey = 'name' | 'itemCount' | 'tagCount';

const capacityStyles: Record<string, string> = {
  'Empty': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Plenty of Space': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Getting Full': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Full': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};


export const TaggingHubView: React.FC = () => {
  const { state } = useContext(InventoryContext);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const getPath = (entityId: string | null, entities: Record<string, InventoryEntity>): string => {
    if (!entityId || !entities[entityId] || entities[entityId].parentId === null) {
      return '';
    }
    const entity = entities[entityId];
    const parent = entities[entity.parentId];
    if (!parent || parent.type === EntityType.Property) return entity.name;
    const parentPath = getPath(entity.parentId, entities);
    return parentPath ? `${parentPath} / ${entity.name}` : entity.name;
  };

  const {
    tagsForTagCloud,
    permanentContainers,
    containerTags,
    containerItemCounts,
  } = useMemo(() => {
    const allEntities = Object.values(state.entities) as InventoryEntity[];
    const allItems = allEntities.filter((e): e is Item => e.type === EntityType.Item);
    const allContainers = allEntities.filter((e): e is Container => e.type === EntityType.Container);

    const newPermanentContainers = allContainers.filter(c => c.parentId !== 'misc_root');

    const newTagsForTagCloud = new Map<string, number>();
    const newContainerTags = new Map<string, Set<string>>();
    const newContainerItemCounts = new Map<string, number>();

    allItems.forEach(item => {
      item.tags.forEach(tag => {
        newTagsForTagCloud.set(tag, (newTagsForTagCloud.get(tag) || 0) + item.quantity);
      });
      if (item.parentId && item.status === 'Placed') {
        if (!newContainerTags.has(item.parentId)) {
          newContainerTags.set(item.parentId, new Set());
        }
        const tagsForContainer = newContainerTags.get(item.parentId)!;
        item.tags.forEach(tag => tagsForContainer.add(tag));
        newContainerItemCounts.set(item.parentId, (newContainerItemCounts.get(item.parentId) || 0) + item.quantity);
      }
    });

    return {
      tagsForTagCloud: newTagsForTagCloud,
      permanentContainers: newPermanentContainers,
      containerTags: newContainerTags,
      containerItemCounts: newContainerItemCounts,
    };
  }, [state.entities]);
  
  const sortedAndFilteredPermanentContainers = useMemo(() => {
    const filtered = selectedTag
      ? permanentContainers.filter(container => containerTags.get(container.id)?.has(selectedTag))
      : permanentContainers;

    return filtered.sort((a, b) => {
        let compare = 0;
        if (sortKey === 'name') {
            compare = a.name.localeCompare(b.name);
        } else if (sortKey === 'itemCount') {
            compare = (containerItemCounts.get(a.id) || 0) - (containerItemCounts.get(b.id) || 0);
        } else if (sortKey === 'tagCount') {
            compare = (containerTags.get(a.id)?.size || 0) - (containerTags.get(b.id)?.size || 0);
        }
        return sortDir === 'asc' ? compare : -compare;
    });
  }, [permanentContainers, containerTags, containerItemCounts, selectedTag, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
        setSortDir(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDir('asc');
    }
  }
  
  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      <div className="flex justify-end items-center">
        <button onClick={() => setIsManageTagsOpen(true)} title="Manage All Tags" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700">
          <TagIcon className="w-6 h-6 text-primary-600" />
        </button>
      </div>
      
      <TagCloud tags={tagsForTagCloud} selectedTag={selectedTag} onSelectTag={setSelectedTag} />

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Container Directory</h3>
          <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sort by:</span>
              <button onClick={() => handleSort('name')} className={`font-medium ${sortKey === 'name' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>Name</button>
              <button onClick={() => handleSort('itemCount')} className={`font-medium ${sortKey === 'itemCount' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>Items</button>
              <button onClick={() => handleSort('tagCount')} className={`font-medium ${sortKey === 'tagCount' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>Tags</button>
          </div>
        </div>
        <div className="space-y-3">
          {sortedAndFilteredPermanentContainers.length > 0 ? (
            sortedAndFilteredPermanentContainers.map(container => {
              const path = getPath(container.parentId, state.entities);
              const tags = Array.from(containerTags.get(container.id) || []).sort();
              return (
                <div key={container.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <ContainerIcon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1"/>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{container.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {path && <span className="flex items-center gap-1"><HomeIcon className="w-4 h-4" /> {path}</span>}
                         {container.capacity && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${capacityStyles[container.capacity] || ''}`}>
                              {container.capacity}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {tags.map(tag => (
                        <span key={tag} className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${selectedTag === tag ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">{selectedTag ? 'No containers found with this tag.' : 'No permanent containers found.'}</p>
            </div>
          )}
        </div>
      </div>
      
      <ManageTagsModal 
        isOpen={isManageTagsOpen}
        onClose={() => setIsManageTagsOpen(false)}
        tags={tagsForTagCloud}
      />
    </div>
  );
};