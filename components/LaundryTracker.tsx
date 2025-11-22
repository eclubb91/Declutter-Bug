
import React, { useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';
import { EntityType, Item, InventoryEntity } from '../types';

export const LaundryTracker: React.FC = () => {
    const { state } = useContext(InventoryContext);

    const laundryCounts = useMemo(() => {
        const counts = { Dirty: 0, Washing: 0, Clean: 0 };
        (Object.values(state.entities) as InventoryEntity[]).forEach(entity => {
            if (entity.type === EntityType.Item) {
                const item = entity as Item;
                if (item.status === 'Dirty') counts.Dirty += item.quantity;
                if (item.status === 'Washing') counts.Washing += item.quantity;
                if (item.status === 'Clean (Unplaced)') counts.Clean += item.quantity;
            }
        });
        return counts;
    }, [state.entities]);

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Laundry Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-red-500">{laundryCounts.Dirty}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dirty Items</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-blue-500">{laundryCounts.Washing}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">In Wash</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-green-500">{laundryCounts.Clean}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Clean</p>
                </div>
            </div>
        </div>
    );
};