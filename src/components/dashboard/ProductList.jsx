import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { productService, categoryService, storeService } from '../../services';
import './ProductList.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [products, categories, stores] = await Promise.all([
                productService.getAllProducts(),
                categoryService.getAllCategories(),
                storeService.getAllStores()
            ]);
            setProducts(products);
            setCategories(categories);
            setStores(stores);
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async () => {
        try {
            await productService.createProduct(newProduct);
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
            fetchInitialData();
        } catch (error) {
            setError('Không thể tạo sản phẩm mới');
            console.error('Error creating product:', error);
        }
    };

    const handleUpdateProduct = async (id, updatedData) => {
        try {
            await productService.updateProduct(id, updatedData);
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            fetchInitialData();
        } catch (error) {
            setError('Không thể cập nhật sản phẩm');
            console.error('Error updating product:', error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await productService.deleteProduct(id);
                fetchInitialData();
            } catch (error) {
                setError('Không thể xóa sản phẩm');
                console.error('Error deleting product:', error);
            }
        }
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

    if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="product-list">
            <div className="product-header">
                <h1>Danh sách sản phẩm</h1>
                <button className="add-product-btn" onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5" />
                    Thêm sản phẩm
                </button>
            </div>

            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Hình ảnh</th>
                            <th onClick={() => handleSort('name')} className="sortable">
                                Tên sản phẩm {renderSortIcon('name')}
                            </th>
                            <th onClick={() => handleSort('categoryId')} className="sortable">
                                Danh mục {renderSortIcon('categoryId')}
                            </th>
                            <th onClick={() => handleSort('storeId')} className="sortable">
                                Cửa hàng {renderSortIcon('storeId')}
                            </th>
                            <th onClick={() => handleSort('description')} className="sortable">
                                Mô tả {renderSortIcon('description')}
                            </th>
                            <th onClick={() => handleSort('price')} className="sortable">
                                Giá {renderSortIcon('price')}
                            </th>
                            <th onClick={() => handleSort('stockQuantity')} className="sortable">
                                Tồn kho {renderSortIcon('stockQuantity')}
                            </th>
                            <th onClick={() => handleSort('rating')} className="sortable">
                                Đánh giá {renderSortIcon('rating')}
                            </th>
                            <th onClick={() => handleSort('createdAt')} className="sortable">
                                Ngày tạo {renderSortIcon('createdAt')}
                            </th>
                            <th onClick={() => handleSort('updatedAt')} className="sortable">
                                Cập nhật {renderSortIcon('updatedAt')}
                            </th>
                            <th>Thao tác</th>
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
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setIsEditModalOpen(true);
                                            }}
                                            title="Sửa"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDeleteProduct(product.id)}
                                            title="Xóa"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal tạo sản phẩm mới */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Thêm sản phẩm mới</h2>
                        <input
                            type="text"
                            placeholder="Tên sản phẩm"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                        <textarea
                            placeholder="Mô tả"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Giá"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                        />
                        <input
                            type="number"
                            placeholder="Số lượng tồn kho"
                            value={newProduct.stockQuantity}
                            onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) })}
                        />
                        <input
                            type="text"
                            placeholder="URL hình ảnh"
                            value={newProduct.imageUrl}
                            onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                        />
                        <select
                            value={newProduct.categoryId}
                            onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                        >
                            <option value="">Chọn danh mục</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                        <select
                            value={newProduct.storeId}
                            onChange={(e) => setNewProduct({ ...newProduct, storeId: e.target.value })}
                        >
                            <option value="">Chọn cửa hàng</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                        <div className="modal-actions">
                            <button onClick={() => setIsModalOpen(false)}>Hủy</button>
                            <button onClick={handleCreateProduct}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chỉnh sửa sản phẩm */}
            {isEditModalOpen && selectedProduct && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Chỉnh sửa sản phẩm</h2>
                        <input
                            type="text"
                            placeholder="Tên sản phẩm"
                            value={selectedProduct.name}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                        />
                        <textarea
                            placeholder="Mô tả"
                            value={selectedProduct.description}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Giá"
                            value={selectedProduct.price}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) })}
                        />
                        <input
                            type="number"
                            placeholder="Số lượng tồn kho"
                            value={selectedProduct.stockQuantity}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, stockQuantity: parseInt(e.target.value) })}
                        />
                        <input
                            type="text"
                            placeholder="URL hình ảnh"
                            value={selectedProduct.imageUrl}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, imageUrl: e.target.value })}
                        />
                        <select
                            value={selectedProduct.categoryId}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, categoryId: e.target.value })}
                        >
                            <option value="">Chọn danh mục</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                        <select
                            value={selectedProduct.storeId}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, storeId: e.target.value })}
                        >
                            <option value="">Chọn cửa hàng</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                        <div className="modal-actions">
                            <button onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                            <button onClick={() => handleUpdateProduct(selectedProduct.id, selectedProduct)}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList; 