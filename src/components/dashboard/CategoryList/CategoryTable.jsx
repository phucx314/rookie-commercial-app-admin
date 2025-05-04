import React from 'react';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import categoryService from '../../../services/category.service';

const CategoryTable = ({
  categories,
  allCategories,
  selectMode,
  selectedItems,
  sortConfig,
  handleSort,
  toggleItemSelection,
  toggleSelectAll,
  onEdit,
  onDelete
}) => {
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUpIcon className="sort-icon" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="sort-icon active" />
      : <ChevronDownIcon className="sort-icon active" />;
  };

  return (
    <div className="categories-table-container">
      <table className="categories-table">
        <thead>
          <tr>
            {selectMode && (
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedItems.size === categories.length && categories.length > 0}
                  onChange={toggleSelectAll}
                  id="select-all-checkbox"
                />
              </th>
            )}
            <th onClick={() => handleSort('name')} className="sortable">
              Name {renderSortIcon('name')}
            </th>
            <th onClick={() => handleSort('description')} className="sortable">
              Description {renderSortIcon('description')}
            </th>
            <th onClick={() => handleSort('parentId')} className="sortable">
              Parent Category {renderSortIcon('parentId')}
            </th>
            <th onClick={() => handleSort('childrenCount')} className="sortable">
              Subcategories {renderSortIcon('childrenCount')}
            </th>
            <th onClick={() => handleSort('productsCount')} className="sortable">
              Products {renderSortIcon('productsCount')}
            </th>
            <th onClick={() => handleSort('createdAt')} className="sortable">
              Created At {renderSortIcon('createdAt')}
            </th>
            <th onClick={() => handleSort('updatedAt')} className="sortable">
              Updated At {renderSortIcon('updatedAt')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id} className={selectedItems.has(category.id) ? 'selected-row' : ''}>
              {selectMode && (
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(category.id)}
                    onChange={() => toggleItemSelection(category.id)}
                    id={`select-checkbox-${category.id}`}
                  />
                </td>
              )}
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>{categoryService.getParentName(allCategories, category.parentId)}</td>
              <td>{category.children?.length || 0}</td>
              <td>{category.products?.length || 0}</td>
              <td className="date-column">{categoryService.formatDate(category.createdAt)}</td>
              <td className="date-column">{categoryService.formatDate(category.updatedAt)}</td>
              <td>
                <div className="category-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => onEdit(category)}
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => onDelete(category.id)}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable; 