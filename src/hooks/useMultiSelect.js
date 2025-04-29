import { useState } from 'react';

export const useMultiSelect = (items) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedItems(new Set());
    }
  };

  const toggleItemSelection = (id) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = items.map(item => item.id);
      setSelectedItems(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectMode(false);
  };

  return {
    selectedItems,
    selectMode,
    toggleSelectMode,
    toggleItemSelection,
    toggleSelectAll,
    clearSelection
  };
}; 