import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import categoryService from '../services/category.service';
import { toastService } from '../services';

export const useCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ 
    key: searchParams.get('sortBy') || null, 
    direction: searchParams.get('sortDir') || 'asc' 
  });
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('pageSize')) || 10,
    totalCount: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [shouldApplySearch, setShouldApplySearch] = useState(!!searchParams.get('search'));

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (pagination.pageIndex !== 1) params.set('page', pagination.pageIndex);
    if (pagination.pageSize !== 10) params.set('pageSize', pagination.pageSize);
    if (searchTerm) params.set('search', searchTerm);
    if (sortConfig.key) {
      params.set('sortBy', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }
    
    setSearchParams(params);
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, shouldApplySearch, sortConfig, setSearchParams]);

  // Fetch all categories
  const fetchAllCategories = async () => {
    try {
      setLoading(true);
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

  // Filter and paginate categories
  const filterAndPaginateCategories = (categoriesData = allCategories, isSearchRequest = false) => {
    let filtered = categoriesData;
    
    if ((shouldApplySearch || isSearchRequest) && searchTerm) {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      filtered = categoriesData.filter(category => 
        category.name.toLowerCase().includes(lowercaseSearchTerm) || 
        (category.description && category.description.toLowerCase().includes(lowercaseSearchTerm))
      );
      
      if (isSearchRequest) {
        setTimeout(() => setShouldApplySearch(false), 10);
      }
    }
    
    filtered = categoryService.getSortedCategories(filtered, sortConfig);
    
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    
    const startIndex = (pagination.pageIndex - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedItems = filtered.slice(startIndex, endIndex);
    
    setCategories(paginatedItems);
    setPagination(prev => ({
      ...prev,
      totalCount,
      totalPages
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({
      ...prev,
      pageIndex: 1
    }));
    searchCategories(searchTerm);
  };

  // Search categories
  const searchCategories = (term) => {
    let filtered = term.trim() ? allCategories.filter(category => 
      category.name.toLowerCase().includes(term.toLowerCase()) || 
      (category.description && category.description.toLowerCase().includes(term.toLowerCase()))
    ) : allCategories;
    
    const sortedCategories = categoryService.getSortedCategories(filtered, sortConfig);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const paginatedItems = sortedCategories.slice(0, pagination.pageSize);
    
    setCategories(paginatedItems);
    setPagination(prev => ({
      ...prev,
      pageIndex: 1,
      totalCount,
      totalPages
    }));
    setShouldApplySearch(true);
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // CRUD operations
  const createCategory = async (categoryData) => {
    try {
      const categoryToCreate = categoryService.prepareCreateCategoryData(categoryData);
      await toastService.promise(
        categoryService.createCategory(categoryToCreate),
        {
          pending: 'Creating category...',
          success: 'Category created successfully!',
          error: 'Cannot create category. Please try again.'
        }
      );
      setShouldApplySearch(false);
      await fetchAllCategories();
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      return false;
    }
  };

  const updateCategory = async (id, updatedData) => {
    try {
      const categoryToUpdate = categoryService.prepareUpdateCategoryData(updatedData);
      await toastService.promise(
        categoryService.updateCategory(id, categoryToUpdate),
        {
          pending: 'Updating category...',
          success: 'Category updated successfully!',
          error: 'Cannot update category. Please try again.'
        }
      );
      setShouldApplySearch(false);
      await fetchAllCategories();
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return false;
    
    try {
      await toastService.promise(
        categoryService.deleteCategory(id),
        {
          pending: 'Deleting category...',
          success: 'Category deleted successfully!',
          error: 'Cannot delete category. Please try again.'
        }
      );
      setShouldApplySearch(false);
      await fetchAllCategories();
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  const batchDeleteCategories = async (selectedIds) => {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} danh mục đã chọn?`)) return;
    
    setLoading(true);
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        categoryService.deleteCategory(id)
          .then(() => ({ id, success: true }))
          .catch(error => ({ id, success: false, error }))
      );
      
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed > 0) {
        toastService.warning(`Đã xóa ${successful} danh mục thành công, ${failed} danh mục thất bại.`);
      } else {
        toastService.success(`Đã xóa ${successful} danh mục thành công!`);
      }
      
      await fetchAllCategories();
      return true;
    } catch (error) {
      console.error('Error in batch delete:', error);
      toastService.error('Lỗi khi xóa danh mục hàng loạt');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllCategories();
  }, []);

  // Apply filters when data changes
  useEffect(() => {
    if (allCategories.length > 0) {
      filterAndPaginateCategories();
    }
  }, [pagination.pageIndex, pagination.pageSize, allCategories, sortConfig]);

  // Apply search
  useEffect(() => {
    if (shouldApplySearch && allCategories.length > 0) {
      filterAndPaginateCategories(allCategories, true);
    }
  }, [shouldApplySearch]);

  return {
    categories,
    allCategories,
    loading,
    sortConfig,
    pagination,
    searchTerm,
    setSearchTerm,
    handleSearch,
    handleSort,
    setPagination,
    createCategory,
    updateCategory,
    deleteCategory,
    batchDeleteCategories
  };
}; 