import React, { useState, useContext, useEffect } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { Modal } from './Modal';
import { TrashIcon } from './icons';
import { useToasts } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Map<string, number>;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({ isOpen, onClose, tags }) => {
  const { dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [sourceMergeTags, setSourceMergeTags] = useState<string[]>([]);
  const [targetMergeTag, setTargetMergeTag] = useState<string>('');
  
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isConfirmMergeOpen, setIsConfirmMergeOpen] = useState(false);


  // FIX: Cast Array.from result to string[] to prevent type inference issues.
  const sortedTags = (Array.from(tags.keys()) as string[]).sort();
  
  useEffect(() => {
    if (isOpen) {
        setRenamingTag(null);
        setNewName('');
        setSourceMergeTags([]);
        setTargetMergeTag('');
    }
  }, [isOpen])

  const handleRename = () => {
    if (renamingTag && newName && newName.trim() !== renamingTag) {
      dispatch({ type: 'RENAME_TAG', payload: { oldName: renamingTag, newName: newName.trim() } });
      addToast(`Tag renamed to "${newName.trim()}"`, 'success');
      setRenamingTag(null);
      setNewName('');
    } else {
      setRenamingTag(null);
    }
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      dispatch({ type: 'DELETE_TAG', payload: { tagName: tagToDelete } });
      addToast(`Tag "${tagToDelete}" deleted`, 'success');
      setTagToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  const confirmMerge = () => {
    if (sourceMergeTags.length > 0 && targetMergeTag) {
      dispatch({ type: 'MERGE_TAGS', payload: { sourceTags: sourceMergeTags, targetTag: targetMergeTag } });
      addToast(`${sourceMergeTags.length} tag(s) merged into "${targetMergeTag}"`, 'success');
      setSourceMergeTags([]);
      setTargetMergeTag('');
      setIsConfirmMergeOpen(false);
    }
  };
  
  const handleMerge = () => {
    if(sourceMergeTags.length > 0 && targetMergeTag) {
      setIsConfirmMergeOpen(true);
    }
  };

  const handleSourceTagSelect = (tag: string, checked: boolean) => {
    setSourceMergeTags(prev => checked ? [...prev, tag] : prev.filter(t => t !== tag));
    if (tag === targetMergeTag && !checked) {
        setTargetMergeTag('');
    }
  };
  
  const availableTagsForMergeTarget = sortedTags.filter(t => !sourceMergeTags.includes(t));

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Tags">
        <div className="space-y-6">
          
          <div className="p-4 border rounded-lg dark:border-gray-600">
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Merge Tags</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">1. Select tags to merge:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
                  {sortedTags.length > 0 ? sortedTags.map(tag => (
                    <label key={tag} className={`flex items-center space-x-2 p-2 rounded-md ${sourceMergeTags.includes(tag) ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}>
                      <input type="checkbox"
                        checked={sourceMergeTags.includes(tag)}
                        onChange={(e) => handleSourceTagSelect(tag, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{tag}</span>
                    </label>
                  )) : <span className="text-xs text-gray-400 col-span-full">No tags to merge.</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">2. Select tag to merge into:</label>
                <select
                  value={targetMergeTag}
                  onChange={(e) => setTargetMergeTag(e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  disabled={availableTagsForMergeTarget.length === 0}
                >
                    <option value="" disabled>Select target tag</option>
                    {availableTagsForMergeTarget.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
              </div>
              <button onClick={handleMerge} disabled={sourceMergeTags.length < 1 || !targetMergeTag} className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  Merge {sourceMergeTags.length || ''} tag{sourceMergeTags.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-600">
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Rename or Delete Tags</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sortedTags.map(tag => (
                  <div key={tag} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      {renamingTag === tag ? (
                      <input
                          type="text"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          onBlur={handleRename}
                          onKeyDown={e => e.key === 'Enter' && handleRename()}
                          autoFocus
                          className="flex-grow bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-2 py-1 text-sm"
                      />
                      ) : (
                      <span
                          className="flex-grow cursor-pointer"
                          onClick={() => { setRenamingTag(tag); setNewName(tag); }}
                      >
                          {tag} ({tags.get(tag)})
                      </span>
                      )}
                      <button onClick={() => { setTagToDelete(tag); setIsConfirmDeleteOpen(true); }} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full ml-2">
                          <TrashIcon className="w-4 h-4" />
                      </button>
                  </div>
                  ))}
              </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete}" from all items? This action cannot be undone.`}
        confirmText="Delete"
      />

      <ConfirmationModal
        isOpen={isConfirmMergeOpen}
        onClose={() => setIsConfirmMergeOpen(false)}
        onConfirm={confirmMerge}
        title="Merge Tags"
        message={`Are you sure you want to merge ${sourceMergeTags.length} tag(s) into "${targetMergeTag}"? The original tags will be removed.`}
        confirmText="Merge"
        confirmButtonClass="bg-primary-600 hover:bg-primary-700"
      />
    </>
  );
};