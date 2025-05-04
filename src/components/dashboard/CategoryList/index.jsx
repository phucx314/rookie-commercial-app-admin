import React, { useState } from 'react';
import CategoryHeader from './CategoryHeader';
import CategoryTable from './CategoryTable';
import CategoryModal from './CategoryModal';
import Pagination from '../../common/Pagination';
import { useCategories } from '../../../hooks/useCategories';
import { useMultiSelect } from '../../../hooks/useMultiSelect';
import './CategoryList.css';

const CategoryList = () => {
  const {
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
  } = useCategories();

  const {
    selectedItems,
    selectMode,
    toggleSelectMode,
    toggleItemSelection,
    toggleSelectAll,
    clearSelection
  } = useMultiSelect(categories);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    name: '',
    description: '',
    parentId: ''
  });

  // Modal handlers
  const handleCreateSubmit = async (data) => {
    const success = await createCategory(data);
    if (success) {
      setIsModalOpen(false);
      setModalData({ name: '', description: '', parentId: '' });
    }
  };

  const handleUpdateSubmit = async (data) => {
    const success = await updateCategory(data.id, data);
    if (success) {
      setIsEditModalOpen(false);
      setModalData({ name: '', description: '', parentId: '' });
    }
  };

  const handleBatchDelete = async () => {
    const success = await batchDeleteCategories(selectedItems);
    if (success) {
      clearSelection();
    }
  };

  if (loading) return <div className="loading">Loading data...</div>;

  return (
    <div className="category-list">
      <CategoryHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        selectMode={selectMode}
        selectedItems={selectedItems}
        toggleSelectMode={toggleSelectMode}
        handleBatchDelete={handleBatchDelete}
        onAddNew={() => setIsModalOpen(true)}
      />

      <CategoryTable 
        categories={categories}
        allCategories={allCategories}
        selectMode={selectMode}
        selectedItems={selectedItems}
        sortConfig={sortConfig}
        handleSort={handleSort}
        toggleItemSelection={toggleItemSelection}
        toggleSelectAll={toggleSelectAll}
        onEdit={(category) => {
          setModalData(category);
          setIsEditModalOpen(true);
        }}
        onDelete={deleteCategory}
      />

      <Pagination 
        currentPage={pagination.pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPagination(prev => ({ ...prev, pageIndex: newPage }))}
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
              setPagination(prev => ({
                ...prev,
                pageSize: parseInt(e.target.value),
                pageIndex: 1
              }));
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

      <CategoryModal 
        isOpen={isModalOpen}
        title="Add New"
        category={modalData}
        allCategories={allCategories}
        onClose={() => {
          setIsModalOpen(false);
          setModalData({ name: '', description: '', parentId: '' });
        }}
        onChange={setModalData}
        onSubmit={handleCreateSubmit}
      />

      <CategoryModal 
        isOpen={isEditModalOpen}
        title="Edit"
        category={modalData}
        allCategories={allCategories}
        onClose={() => {
          setIsEditModalOpen(false);
          setModalData({ name: '', description: '', parentId: '' });
        }}
        onChange={setModalData}
        onSubmit={handleUpdateSubmit}
      />
    </div>
  );
};

export default CategoryList; 