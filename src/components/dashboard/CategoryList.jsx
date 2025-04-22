import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import categoryService from '../../services/category.service';
import './CategoryList.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentId: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await categoryService.createCategory(newCategory);
      setIsModalOpen(false);
      setNewCategory({
        name: '',
        description: '',
        parentId: ''
      });
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (id, updatedData) => {
    try {
      await categoryService.updateCategory(id, updatedData);
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(id);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCategories = () => {
    if (!sortConfig.key) return categories;

    return [...categories].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Xử lý các trường hợp đặc biệt
      if (sortConfig.key === 'parentId') {
        const aParent = categories.find(c => c.id === a.parentId);
        const bParent = categories.find(c => c.id === b.parentId);
        aValue = aParent ? aParent.name : '';
        bValue = bParent ? bParent.name : '';
      } else if (sortConfig.key === 'productsCount') {
        aValue = a.products?.length || 0;
        bValue = b.products?.length || 0;
      } else if (sortConfig.key === 'childrenCount') {
        aValue = a.children?.length || 0;
        bValue = b.children?.length || 0;
      } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUpIcon className="sort-icon" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="sort-icon active" />
      : <ChevronDownIcon className="sort-icon active" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getParentName = (parentId) => {
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

  return (
    <div className="category-list">
      <div className="category-header">
        <h1>Categories</h1>
        <button className="add-category-btn" onClick={() => setIsModalOpen(true)}>
          <PlusIcon />
          Add Category
        </button>
      </div>

      <div className="categories-table-container">
        <table className="categories-table">
          <thead>
            <tr>
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
            {getSortedCategories().map(category => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>{getParentName(category.parentId)}</td>
                <td>{category.children?.length || 0}</td>
                <td>{category.products?.length || 0}</td>
                <td className="date-column">{formatDate(category.createdAt)}</td>
                <td className="date-column">{formatDate(category.updatedAt)}</td>
                <td>
                  <div className="category-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsEditModalOpen(true);
                      }}
                      title="Edit"
                    >
                      <PencilIcon />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteCategory(category.id)}
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Category</h2>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <select
              value={newCategory.parentId}
              onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
            >
              <option value="">No Parent Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button onClick={handleCreateCategory}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedCategory && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Category</h2>
            <input
              type="text"
              placeholder="Category Name"
              value={selectedCategory.name}
              onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={selectedCategory.description}
              onChange={(e) => setSelectedCategory({ ...selectedCategory, description: e.target.value })}
            />
            <select
              value={selectedCategory.parentId || ''}
              onChange={(e) => setSelectedCategory({ ...selectedCategory, parentId: e.target.value })}
            >
              <option value="">No Parent Category</option>
              {categories
                .filter(category => category.id !== selectedCategory.id)
                .map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
            </select>
            <div className="modal-actions">
              <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button onClick={() => handleUpdateCategory(selectedCategory.id, selectedCategory)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList; 