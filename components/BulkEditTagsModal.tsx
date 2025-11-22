import React, { useState, useContext, useMemo, useEffect } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { Modal } from './Modal';
// FIX: Import `EntityType` to resolve reference error.
import { Item, EntityType } from '../types';
import { useToasts } from '../contexts/ToastContext';

interface BulkEditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemIds: string[];
}

type EditMode = 'add' | 'remove' | 'replace';

export const BulkEditTagsModal: React.FC<BulkEditTagsModalProps> = ({ isOpen, onClose, itemIds }) => {
  const { state, dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [mode, setMode] = useState<EditMode>('add');
  
  const [tagsToAdd, setTagsToAdd] = useState('');
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [tagToReplace, setTagToReplace] = useState('');
  const [newTag, setNewTag] = useState('');

  const allSelectedItems = useMemo(() => {
    return itemIds.map(id => state.entities[id]).filter((e): e is Item => e?.type === EntityType.Item);
  }, [itemIds, state.entities]);

  const allTagsInSelection = useMemo(() => {
    const tags = new Set<string>();
    allSelectedItems.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allSelectedItems]);

  useEffect(() => {
    if (isOpen) {
      setMode('add');
      setTagsToAdd('');
      setTagsToRemove([]);
      setTagToReplace('');
      setNewTag('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (mode === 'add') {
      const parsedTags = tagsToAdd.split(',').map(t => t.trim()).filter(Boolean);
      if (parsedTags.length > 0) {
        dispatch({ type: 'BULK_ADD_TAGS', payload: { ids: itemIds, tags: parsedTags } });
      }
    } else if (mode === 'remove') {
      if (tagsToRemove.length > 0) {
        dispatch({ type: 'BULK_REMOVE_TAGS', payload: { ids: itemIds, tags: tagsToRemove } });
      }
    } else if (mode === 'replace') {
      if (tagToReplace && newTag) {
        dispatch({ type: 'BULK_REPLACE_TAG', payload: { ids: itemIds, oldTag: tagToReplace, newTag: newTag.trim() } });
      }
    }
    addToast('Tags updated successfully', 'success');
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Tags for ${itemIds.length} Items`}>
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button onClick={() => setMode('add')} className={`${mode === 'add' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Add</button>
            <button onClick={() => setMode('remove')} className={`${mode === 'remove' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Remove</button>
            <button onClick={() => setMode('replace')} className={`${mode === 'replace' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Replace</button>
          </nav>
        </div>

        {mode === 'add' && (
          <div>
            <label htmlFor="tags-to-add" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags to Add (comma-separated)</label>
            <input
              type="text"
              id="tags-to-add"
              value={tagsToAdd}
              onChange={e => setTagsToAdd(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g. electronics, kitchen"
            />
          </div>
        )}

        {mode === 'remove' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags to Remove</label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
              {allTagsInSelection.length > 0 ? allTagsInSelection.map(tag => (
                <label key={tag} className="flex items-center space-x-2 p-2 rounded-md">
                  <input
                    type="checkbox"
                    checked={tagsToRemove.includes(tag)}
                    onChange={e => {
                      setTagsToRemove(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag));
                    }}
                    className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{tag}</span>
                </label>
              )) : <span className="text-sm text-gray-400 col-span-full">No common tags found.</span>}
            </div>
          </div>
        )}

        {mode === 'replace' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="tag-to-replace" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag to Replace</label>
              <select
                id="tag-to-replace"
                value={tagToReplace}
                onChange={e => setTagToReplace(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="" disabled>Select a tag</option>
                {allTagsInSelection.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="new-tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Tag</label>
              <input
                type="text"
                id="new-tag"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter new tag name"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-600">
            <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
            <button onClick={handleSave} type="button" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Changes</button>
        </div>
      </div>
    </Modal>
  );
};
