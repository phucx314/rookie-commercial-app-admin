import React from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CategoryHeader = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  selectMode,
  selectedItems,
  toggleSelectMode,
  handleBatchDelete,
  onAddNew
}) => {
  return (
    <div className="category-header">
      <h1>Categories</h1>
      <div className="header-actions">
        <form onSubmit={handleSearch} className="search-form-inline" id="category-search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              id="category-search-input"
              name="category-search"
            />
            <button type="submit" className="search-button-inside" id="category-search-button" name="category-search-button">
              <MagnifyingGlassIcon className="search-icon" />
            </button>
          </div>
        </form>
        <button
          className={`select-mode-btn ${selectMode ? 'active' : ''}`}
          onClick={toggleSelectMode}
        >
          {selectMode ? 'Cancel' : 'Select'}
        </button>
        {selectMode && (
          <button 
            className="batch-delete-btn"
            onClick={handleBatchDelete}
            disabled={selectedItems.size === 0}
          >
            Delete Selected ({selectedItems.size})
          </button>
        )}
        {!selectMode && (
          <button className="add-category-btn" onClick={onAddNew}>
            <PlusIcon />
            Add Category
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryHeader; 