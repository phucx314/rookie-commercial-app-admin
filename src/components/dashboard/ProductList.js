import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    imageUrl: '',
    categoryId: '',
    storeId: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStores();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/Product');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/Category');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get('/Store');
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const createProductDto = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stockQuantity: parseInt(newProduct.stockQuantity),
        imageUrl: newProduct.imageUrl,
        categoryId: newProduct.categoryId,
        storeId: newProduct.storeId
      };

      await axios.post('/Product', createProductDto);
      setIsModalOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        imageUrl: '',
        categoryId: '',
        storeId: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdateProduct = async (id, updatedData) => {
    try {
      const updateDto = {
        name: updatedData.name,
        description: updatedData.description,
        price: updatedData.price,
        stockQuantity: updatedData.stockQuantity,
        imageUrl: updatedData.imageUrl,
        categoryId: updatedData.categoryId,
        storeId: updatedData.storeId
      };
      
      await axios.put(`/Product/${id}`, updateDto);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/Product/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : '-';
  };

  const renderRating = (product) => {
    if (!product.reviews || product.reviews.length === 0) return '-';
    const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
    return (
      <div className="rating">
        {avgRating.toFixed(1)}
        <StarIcon className="star-icon" />
      </div>
    );
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedProducts = () => {
    if (!sortConfig.key) return products;

    return [...products].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Xử lý các trường hợp đặc biệt
      if (sortConfig.key === 'categoryId') {
        aValue = getCategoryName(a.categoryId);
        bValue = getCategoryName(b.categoryId);
      } else if (sortConfig.key === 'storeId') {
        aValue = getStoreName(a.storeId);
        bValue = getStoreName(b.storeId);
      } else if (sortConfig.key === 'rating') {
        aValue = a.reviews?.length ? a.reviews.reduce((sum, review) => sum + review.rating, 0) / a.reviews.length : 0;
        bValue = b.reviews?.length ? b.reviews.reduce((sum, review) => sum + review.rating, 0) / b.reviews.length : 0;
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="product-list">
      <div className="product-header">
        <h1>Products</h1>
        <button className="add-product-btn" onClick={() => setIsModalOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Image</th>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {renderSortIcon('name')}
              </th>
              <th onClick={() => handleSort('categoryId')} className="sortable">
                Category {renderSortIcon('categoryId')}
              </th>
              <th onClick={() => handleSort('storeId')} className="sortable">
                Store {renderSortIcon('storeId')}
              </th>
              <th onClick={() => handleSort('description')} className="sortable">
                Description {renderSortIcon('description')}
              </th>
              <th onClick={() => handleSort('price')} className="sortable">
                Price {renderSortIcon('price')}
              </th>
              <th onClick={() => handleSort('stockQuantity')} className="sortable">
                Stock {renderSortIcon('stockQuantity')}
              </th>
              <th onClick={() => handleSort('rating')} className="sortable">
                Rating {renderSortIcon('rating')}
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
            {getSortedProducts().map(product => (
              <tr key={product.id}>
                <td>
                  <img 
                    src={product.imageUrl || '/placeholder.png'} 
                    alt={product.name}
                    className="product-image"
                  />
                </td>
                <td>{product.name}</td>
                <td>{getCategoryName(product.categoryId)}</td>
                <td className="store-name">{getStoreName(product.storeId)}</td>
                <td>{product.description}</td>
                <td className="price-column">{formatPrice(product.price)}</td>
                <td>{product.stockQuantity}</td>
                <td>{renderRating(product)}</td>
                <td className="date-column">{formatDate(product.createdAt)}</td>
                <td className="date-column">{formatDate(product.updatedAt)}</td>
                <td>
                  <div className="product-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => openEditModal(product)}
                      title="Edit"
                    >
                      <PencilIcon />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteProduct(product.id)}
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
            <h2>Add New Product</h2>
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={newProduct.stockQuantity}
              onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newProduct.imageUrl}
              onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
            />
            <select
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={newProduct.storeId}
              onChange={(e) => setNewProduct({ ...newProduct, storeId: e.target.value })}
            >
              <option value="">Select Store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button onClick={handleCreateProduct}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Product</h2>
            <input
              type="text"
              placeholder="Product Name"
              value={selectedProduct.name}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={selectedProduct.description}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={selectedProduct.price}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={selectedProduct.stockQuantity}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, stockQuantity: parseInt(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Image URL"
              value={selectedProduct.imageUrl}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, imageUrl: e.target.value })}
            />
            <select
              value={selectedProduct.categoryId}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, categoryId: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={selectedProduct.storeId}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, storeId: e.target.value })}
            >
              <option value="">Select Store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button onClick={() => handleUpdateProduct(selectedProduct.id, selectedProduct)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList; 