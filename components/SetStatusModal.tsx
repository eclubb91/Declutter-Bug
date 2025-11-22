import React, { useState, useContext } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { Modal } from './Modal';
import { Item } from '../types';
import { useToasts } from '../contexts/ToastContext';

interface SetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemIds: string[];
}

export const SetStatusModal: React.FC<SetStatusModalProps> = ({ isOpen, onClose, itemIds }) => {
  const { dispatch } = useContext(InventoryContext);
  const { addToast } = useToasts();
  const [status, setStatus] = useState<Item['status']>('Placed');

  const handleSave = () => {
    if (itemIds.length > 0) {
      dispatch({ type: 'SET_ITEM_STATUS', payload: { ids: itemIds, status } });
      addToast(`Status updated for ${itemIds.length} items`, 'success');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Set Status for ${itemIds.length} Items`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
          <select
            id="status-select"
            value={status}
            onChange={e => setStatus(e.target.value as Item['status'])}
            className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="Placed">Placed</option>
            <option value="Dirty">Dirty</option>
            <option value="Washing">Washing</option>
            <option value="Clean (Unplaced)">Clean (Unplaced)</option>
          </select>
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-600">
          <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleSave} type="button" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Changes</button>
        </div>
      </div>
    </Modal>
  );
};
