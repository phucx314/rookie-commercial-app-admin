import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import categoryService from '../../services/category.service';
import Pagination from '../common/Pagination';
import { toastService } from '../../services';
import './CategoryList.css';

const CategoryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortConfig, setSortConfig] = useState({ 
    key: searchParams.get('sortBy') || null, 
    direction: searchParams.get('sortDir') || 'asc' 
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentId: ''
  });
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('pageSize')) || 10,
    totalCount: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [allCategories, setAllCategories] = useState([]);
  const [shouldApplySearch, setShouldApplySearch] = useState(!!searchParams.get('search'));
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (pagination.pageIndex !== 1) {
      params.set('page', pagination.pageIndex);
    }
    
    if (pagination.pageSize !== 10) {
      params.set('pageSize', pagination.pageSize);
    }
    
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    
    if (sortConfig.key) {
      params.set('sortBy', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }
    
    // Update URL without causing a navigation/reload
    setSearchParams(params);
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, shouldApplySearch, sortConfig, setSearchParams]);

  useEffect(() => {
    fetchAllCategories();
  }, []);
  
  useEffect(() => {
    if (allCategories.length > 0) {
      filterAndPaginateCategories();
    }
  }, [pagination.pageIndex, pagination.pageSize, allCategories, sortConfig]);

  // Separate useEffect to handle search
  useEffect(() => {
    if (shouldApplySearch && allCategories.length > 0) {
      setCurrentSearchTerm(searchTerm);
      filterAndPaginateCategories(allCategories, true);
    }
  }, [shouldApplySearch]);

  // Check URL params on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
      setShouldApplySearch(true);
    }
    
    const pageFromUrl = searchParams.get('page');
    const pageSizeFromUrl = searchParams.get('pageSize');
    if (pageFromUrl || pageSizeFromUrl) {
      setPagination(prev => ({
        ...prev,
        pageIndex: pageFromUrl ? parseInt(pageFromUrl) : prev.pageIndex,
        pageSize: pageSizeFromUrl ? parseInt(pageSizeFromUrl) : prev.pageSize
      }));
    }
    
    const sortByFromUrl = searchParams.get('sortBy');
    const sortDirFromUrl = searchParams.get('sortDir');
    if (sortByFromUrl) {
      setSortConfig({
        key: sortByFromUrl,
        direction: sortDirFromUrl || 'asc'
      });
    }
  }, []);

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching all categories');
      const data = await categoryService.getAllCategories();
      setAllCategories(data);
      filterAndPaginateCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toastService.error('Cannot load categories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterAndPaginateCategories = (categoriesData = allCategories, isSearchRequest = false) => {
    let filtered = categoriesData;
    
    // Apply search filter if search term exists and search button was clicked
    if ((shouldApplySearch || isSearchRequest) && searchTerm) {
      console.log(`Filtering categories with search term: ${searchTerm}`);
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      filtered = categoriesData.filter(category => 
        category.name.toLowerCase().includes(lowercaseSearchTerm) || 
        (category.description && category.description.toLowerCase().includes(lowercaseSearchTerm))
      );
      
      // Only reset the flag if this was called from the search useEffect
      if (isSearchRequest) {
        // Reset shouldApplySearch without triggering another filter
        setTimeout(() => {
          setShouldApplySearch(false);
        }, 10);
      }
    }
    
    // Apply sorting
    filtered = categoryService.getSortedCategories(filtered, sortConfig);
    
    // Calculate pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    
    // Apply pagination
    const startIndex = (pagination.pageIndex - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedItems = filtered.slice(startIndex, endIndex);
    
    // Update state
    setCategories(paginatedItems);
    setPagination({
      ...pagination,
      totalCount,
      totalPages
    });
  };

  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      pageIndex: newPage
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Performing category search with term: "${searchTerm}"`);
    
    // Reset to page 1 when searching
    setPagination({
      ...pagination,
      pageIndex: 1
    });
    
    // Immediately search instead of just setting a flag
    searchCategories(searchTerm);
  };

  // New function to directly handle search
  const searchCategories = (term) => {
    console.log(`Directly searching categories with term: "${term}"`);
    
    // Nếu chuỗi tìm kiếm trống, hiển thị tất cả danh mục
    let filtered = allCategories;
    
    // Chỉ lọc khi có term
    if (term.trim()) {
    const lowercaseSearchTerm = term.toLowerCase();
      filtered = allCategories.filter(category => 
      category.name.toLowerCase().includes(lowercaseSearchTerm) || 
      (category.description && category.description.toLowerCase().includes(lowercaseSearchTerm))
    );
    }
    
    // Apply sorting and pagination to filtered results
    const sortedCategories = categoryService.getSortedCategories(filtered, sortConfig);
    
    // Calculate pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    
    // Apply pagination
    const startIndex = 0; // start at first page
    const endIndex = pagination.pageSize;
    const paginatedItems = sortedCategories.slice(startIndex, endIndex);
    
    // Update state
    setCategories(paginatedItems);
    setPagination({
      ...pagination,
      pageIndex: 1,
      totalCount,
      totalPages
    });
    
    // Set the flag after successful search
    setShouldApplySearch(true);
  };

  const handleCreateCategory = async () => {
    try {
      // Process data via service
      const categoryToCreate = categoryService.prepareCreateCategoryData(newCategory);
      
      await toastService.promise(
        categoryService.createCategory(categoryToCreate),
        {
          pending: 'Creating category...',
          success: 'Category created successfully!',
          error: 'Cannot create category. Please try again.'
        }
      );
      
      setIsModalOpen(false);
      setNewCategory({
        name: '',
        description: '',
        parentId: ''
      });
      // Reset search when adding a new category
      setShouldApplySearch(false);
      fetchAllCategories(); // Refresh all categories after creating a new one
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (id, updatedData) => {
    try {
      // Process data via service
      const categoryToUpdate = categoryService.prepareUpdateCategoryData(updatedData);
      
      await toastService.promise(
        categoryService.updateCategory(id, categoryToUpdate),
        {
          pending: 'Updating category...',
          success: 'Category updated successfully!',
          error: 'Cannot update category. Please try again.'
        }
      );
      
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      // Reset search when updating a category
      setShouldApplySearch(false);
      fetchAllCategories(); // Refresh all categories after updating
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await toastService.promise(
          categoryService.deleteCategory(id),
          {
            pending: 'Deleting category...',
            success: 'Category deleted successfully!',
            error: 'Cannot delete category. Please try again.'
          }
        );
        // Reset search when deleting a category
        setShouldApplySearch(false);
        fetchAllCategories(); // Refresh all categories after deleting
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

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUpIcon className="sort-icon" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="sort-icon active" />
      : <ChevronDownIcon className="sort-icon active" />;
  };

  if (loading) return <div className="loading">Loading data...</div>;

  return (
    <div className="category-list">
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
          <button className="add-category-btn" onClick={() => setIsModalOpen(true)}>
            <PlusIcon />
            Add Category
          </button>
        </div>
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
            {categories.map(category => (
              <tr key={category.id}>
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

      <Pagination 
        currentPage={pagination.pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
      
      <div className="pagination-info">
        Showing {categories.length} of {pagination.totalCount} categories
        | Page {pagination.pageIndex} of {pagination.totalPages}
        <div className="page-size-selector">
          <label htmlFor="category-page-size-select">Items/page:</label>
          <select 
            id="category-page-size-select"
            value={pagination.pageSize}
            onChange={(e) => {
              setPagination({
                ...pagination,
                pageSize: parseInt(e.target.value),
                pageIndex: 1 // Reset về trang 1 khi thay đổi số lượng items/trang
              });
            }}
            className="page-size-select"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
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
              id="new-category-name"
              name="new-category-name"
            />
            <textarea
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              id="new-category-description"
              name="new-category-description"
            />
            <select
              value={newCategory.parentId}
              onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
              id="new-category-parent"
              name="new-category-parent"
            >
              <option value="">No Parent Category</option>
              {allCategories.map(category => (
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
              id="edit-category-name"
              name="edit-category-name"
            />
            <textarea
              placeholder="Description"
              value={selectedCategory.description}
              onChange={(e) => setSelectedCategory({ ...selectedCategory, description: e.target.value })}
              id="edit-category-description"
              name="edit-category-description"
            />
            <select
              value={selectedCategory.parentId || ''}
              onChange={(e) => setSelectedCategory({ ...selectedCategory, parentId: e.target.value })}
              id="edit-category-parent"
              name="edit-category-parent"
            >
              <option value="">No Parent Category</option>
              {allCategories
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