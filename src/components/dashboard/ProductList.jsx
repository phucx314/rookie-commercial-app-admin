import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { productService, categoryService, storeService, toastService } from '../../services';
import Pagination from '../common/Pagination';
import './ProductList.css';

const ProductList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [sortConfig, setSortConfig] = useState({ 
        key: searchParams.get('sortBy') || null, 
        direction: searchParams.get('sortDir') || 'asc' 
    });
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        imageUrl: '',
        categoryId: '',
        storeId: ''
    });
    
    // Pagination states
    const [pagination, setPagination] = useState({
        pageIndex: parseInt(searchParams.get('page')) || 1,
        pageSize: parseInt(searchParams.get('pageSize')) || 10,
        totalCount: 0,
        totalPages: 0
    });
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('category') || 'all');
    const [selectedStoreId, setSelectedStoreId] = useState(searchParams.get('store') || 'all');

    // Need to track whether to filter by search term
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
        
        if (selectedCategoryId !== 'all') {
            params.set('category', selectedCategoryId);
        }
        
        if (selectedStoreId !== 'all') {
            params.set('store', selectedStoreId);
        }
        
        if (sortConfig.key) {
            params.set('sortBy', sortConfig.key);
            params.set('sortDir', sortConfig.direction);
        }
        
        // Update URL without causing a navigation/reload
        setSearchParams(params);
    }, [pagination.pageIndex, pagination.pageSize, selectedCategoryId, selectedStoreId, searchTerm, shouldApplySearch, sortConfig, setSearchParams]);

    useEffect(() => {
        fetchInitialData();
    }, []);
    
    useEffect(() => {
        fetchProducts();
    }, [pagination.pageIndex, pagination.pageSize, selectedCategoryId, selectedStoreId]);

    // Separate useEffect to handle search
    useEffect(() => {
        if (shouldApplySearch) {
            // Store the current search term for comparison
            setCurrentSearchTerm(searchTerm);
            // Only fetch if this is from URL param initialization, not after searchProducts is called
            if (!searchTerm || currentSearchTerm !== searchTerm) {
                fetchProducts(true);
            } else {
                // Just reset the flag without triggering another fetch
                setTimeout(() => {
                    setShouldApplySearch(false);
                }, 10);
            }
        }
    }, [shouldApplySearch]);

    // Check URL params on mount
    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchTerm(searchFromUrl);
            setShouldApplySearch(true);
        }
        
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl) {
            setSelectedCategoryId(categoryFromUrl);
        }
        
        const storeFromUrl = searchParams.get('store');
        if (storeFromUrl) {
            setSelectedStoreId(storeFromUrl);
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

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [categories, stores] = await Promise.all([
                categoryService.getAllCategories(),
                storeService.getAllStores()
            ]);
            setCategories(categories);
            setStores(stores);
            await fetchProducts();
        } catch (err) {
            toastService.error('Cannot load data. Please try again later.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchProducts = async (isSearchRequest = false) => {
        try {
            setLoading(true);
            let response;
            
            if ((shouldApplySearch || isSearchRequest) && searchTerm) {
                console.log(`Searching products with term: "${searchTerm}"`);
                response = await productService.searchProducts(
                    searchTerm,
                    pagination.pageIndex,
                    pagination.pageSize
                );
                
                // Only reset the flag if this was called from the search useEffect
                if (isSearchRequest) {
                    // Reset shouldApplySearch without triggering another fetch
                    setTimeout(() => {
                        setShouldApplySearch(false);
                    }, 10);
                }
            } else if (selectedCategoryId !== 'all' && selectedStoreId !== 'all') {
                // Lọc theo cả danh mục và cửa hàng (lọc kép)
                console.log(`Fetching products for category: ${selectedCategoryId} and store: ${selectedStoreId}`);
                
                // Lấy tất cả sản phẩm của danh mục đó trước
                const categoryResponse = await productService.getPaginatedProductsByCategory(
                    selectedCategoryId,
                    1, // Luôn bắt đầu từ trang 1 để đảm bảo lấy tất cả
                    1000 // Lấy số lượng lớn để đảm bảo lấy được tất cả (giả định không quá 1000 sản phẩm)
                );
                
                // Lọc thủ công theo store
                if (categoryResponse && categoryResponse.items) {
                    console.log(`Filtering ${categoryResponse.items.length} products by store ID: ${selectedStoreId}`);
                    
                    // Debug để kiểm tra storeId trong products
                    categoryResponse.items.forEach(product => {
                        console.log(`Product ${product.name} has storeId: ${product.storeId}`);
                    });
                    
                    const filteredItems = categoryResponse.items.filter(product => 
                        product.storeId && product.storeId.toString() === selectedStoreId.toString()
                    );
                    
                    console.log(`Found ${filteredItems.length} products after store filtering`);
                    
                    // Tạo trang dữ liệu giả lập cho phân trang ở client
                    const start = (pagination.pageIndex - 1) * pagination.pageSize;
                    const paginatedItems = filteredItems.slice(start, start + pagination.pageSize);
                    
                    response = {
                        items: paginatedItems,
                        totalCount: filteredItems.length,
                        pageIndex: pagination.pageIndex,
                        pageSize: pagination.pageSize,
                        totalPages: Math.ceil(filteredItems.length / pagination.pageSize) || 1
                    };
                }
            } else if (selectedCategoryId !== 'all') {
                // Chỉ lọc theo danh mục
                console.log(`Fetching products for category: ${selectedCategoryId}`);
                response = await productService.getPaginatedProductsByCategory(
                    selectedCategoryId,
                    pagination.pageIndex,
                    pagination.pageSize
                );
            } else if (selectedStoreId !== 'all') {
                // Chỉ lọc theo cửa hàng
                console.log(`Fetching products for store ID: ${selectedStoreId}`);
                
                // Lấy tất cả sản phẩm rồi lọc thủ công
                const allProductsResponse = await productService.getPaginatedProducts(
                    1, // Luôn bắt đầu từ trang 1 để đảm bảo lấy tất cả
                    1000 // Lấy số lượng lớn để đảm bảo lấy được tất cả (giả định không quá 1000 sản phẩm)
                );
                
                if (allProductsResponse && allProductsResponse.items) {
                    console.log(`Filtering ${allProductsResponse.items.length} products by store ID: ${selectedStoreId}`);
                    
                    // Debug để kiểm tra storeId trong products
                    allProductsResponse.items.forEach(product => {
                        console.log(`Product ${product.name} has storeId: ${product.storeId}`);
                    });
                    
                    const filteredItems = allProductsResponse.items.filter(product => 
                        product.storeId && product.storeId.toString() === selectedStoreId.toString()
                    );
                    
                    console.log(`Found ${filteredItems.length} products after store filtering`);
                    
                    // Tạo trang dữ liệu giả lập cho phân trang ở client
                    const start = (pagination.pageIndex - 1) * pagination.pageSize;
                    const paginatedItems = filteredItems.slice(start, start + pagination.pageSize);
                    
                    response = {
                        items: paginatedItems,
                        totalCount: filteredItems.length,
                        pageIndex: pagination.pageIndex,
                        pageSize: pagination.pageSize,
                        totalPages: Math.ceil(filteredItems.length / pagination.pageSize) || 1
                    };
                }
            } else {
                console.log('Fetching all paginated products');
                response = await productService.getPaginatedProducts(
                    pagination.pageIndex,
                    pagination.pageSize
                );
            }
            
            // Đảm bảo response tồn tại trước khi cập nhật state
            if (response && response.items) {
                setProducts(response.items);
                setPagination({
                    ...pagination,
                    totalCount: response.totalCount || 0,
                    totalPages: response.totalPages || Math.ceil((response.totalCount || 0) / pagination.pageSize) || 1
                });
            } else {
                // Nếu không có response.items, hiển thị danh sách trống
                setProducts([]);
                setPagination({
                    ...pagination,
                    totalCount: 0,
                    totalPages: 1
                });
            }
        } catch (err) {
            toastService.error('Không thể tải sản phẩm. Vui lòng thử lại sau.');
            console.error('Error fetching products:', err);
            // Trong trường hợp lỗi, hiển thị danh sách trống
            setProducts([]);
            setPagination({
                ...pagination,
                totalCount: 0,
                totalPages: 1
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination({
            ...pagination,
            pageIndex: newPage
        });
    };
    
    const handleSearch = (e) => {
        e.preventDefault();
        console.log(`Initiating search with term: "${searchTerm}"`);
        
        // Reset to page 1 when searching
        setPagination({
            ...pagination,
            pageIndex: 1
        });
        
        // Immediately search instead of just setting a flag
        searchProducts(searchTerm);
    };

    // New function to directly handle search
    const searchProducts = async (term) => {
        try {
            setLoading(true);
            console.log(`Directly searching products with term: "${term}"`);
            
            let response;
            // Nếu chuỗi tìm kiếm trống, lấy tất cả sản phẩm
            if (!term.trim()) {
                response = await productService.getPaginatedProducts(
                    1, // always start at page 1 for new search
                    pagination.pageSize
                );
            } else {
                response = await productService.searchProducts(
                    term,
                    1, // always start at page 1 for new search
                    pagination.pageSize
                );
            }
            
            setProducts(response.items);
            setPagination({
                ...pagination,
                pageIndex: 1,
                totalCount: response.totalCount,
                totalPages: response.totalPages
            });
            
            // Lưu từ khóa tìm kiếm hiện tại để so sánh
            setCurrentSearchTerm(term);
            
            // KHÔNG đặt shouldApplySearch = true ở đây để tránh gọi API lần nữa
            // setShouldApplySearch(true);
        } catch (err) {
            toastService.error('Không thể tìm kiếm sản phẩm. Vui lòng thử lại sau.');
            console.error('Error searching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setSelectedCategoryId(categoryId);
        // Reset search when changing categories
        setShouldApplySearch(false);
        setSearchTerm('');
        // Reset to page 1 when changing category
        setPagination({
            ...pagination,
            pageIndex: 1
        });
    };

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        setSelectedStoreId(storeId);
        // Reset search when changing stores
        setShouldApplySearch(false);
        setSearchTerm('');
        // Reset to page 1 when changing store
        setPagination({
            ...pagination,
            pageIndex: 1
        });
    };

    const handleCreateProduct = async () => {
        try {
            await toastService.promise(
                productService.createProduct(newProduct),
                {
                    pending: 'Creating product...',
                    success: 'Product created successfully!',
                    error: 'Cannot create product. Please try again.'
                }
            );
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
            await toastService.promise(
                productService.updateProduct(id, updatedData),
                {
                    pending: 'Updating product...',
                    success: 'Product updated successfully!',
                    error: 'Cannot update product. Please try again.'
                }
            );
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
                await toastService.promise(
                    productService.deleteProduct(id),
                    {
                        pending: 'Deleting product...',
                        success: 'Product deleted successfully!',
                        error: 'Cannot delete product. Please try again.'
                    }
                );
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleDuplicateProduct = async (product) => {
        try {
            // Log product data to see what we're duplicating
            console.log("Original product:", product);
            
            // Create a new product object based on the existing one
            const duplicatedProduct = {
                name: `${product.name} (Copy)`,
                description: product.description || "",
                price: product.price,
                stockQuantity: product.stockQuantity,
                categoryId: product.categoryId,
                storeId: product.storeId,
                imageUrl: product.imageUrl || "", // Include imageUrl as it may be required
                // Skip: id, createdAt, updatedAt as they will be generated by the server
            };
            
            console.log("Duplicating product with data:", duplicatedProduct);

            await toastService.promise(
                productService.createProduct(duplicatedProduct),
                {
                    pending: 'Duplicating product...',
                    success: 'Product duplicated successfully!',
                    error: 'Cannot duplicate product. Please try again.'
                }
            );
            
            // Refresh the product list
            fetchProducts();
        } catch (error) {
            console.error('Error duplicating product:', error);
            // Log more detailed error response
            if (error.response) {
                console.error('Error response data:', error.response.data);
            }
        }
    };

    const renderRating = (product) => {
        if (!product.reviews || product.reviews.length === 0) return '-';
        const avgRating = productService.calculateAverageRating(product);
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
        <div className="product-list">
            <div className="product-header">
                <h1>Product List</h1>
                <div className="header-actions">
                    <div className="category-filter">
                        <select 
                            value={selectedCategoryId} 
                            onChange={handleCategoryChange}
                            className="category-select"
                            id="category-filter-select"
                            name="category-filter"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="store-filter">
                        <select 
                            value={selectedStoreId} 
                            onChange={handleStoreChange}
                            className="store-select"
                            id="store-filter-select"
                            name="store-filter"
                        >
                            <option value="all">All Stores</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>
                                    {store.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <form onSubmit={handleSearch} className="search-form-inline" id="product-search-form">
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                id="product-search-input"
                                name="product-search"
                            />
                            <button type="submit" className="search-button-inside" id="product-search-button" name="product-search-button">
                                <MagnifyingGlassIcon className="search-icon" />
                            </button>
                        </div>
                    </form>
                    <button className="add-product-btn" onClick={() => setIsModalOpen(true)}>
                        <PlusIcon className="w-5 h-5" />
                        Add Product
                    </button>
                </div>
            </div>
            
            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th onClick={() => handleSort('name')} className="sortable">
                                Product Name {renderSortIcon('name')}
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
                                Stock Quantity {renderSortIcon('stockQuantity')}
                            </th>
                            <th onClick={() => handleSort('rating')} className="sortable">
                                Rating {renderSortIcon('rating')}
                            </th>
                            <th onClick={() => handleSort('createdAt')} className="sortable">
                                Created {renderSortIcon('createdAt')}
                            </th>
                            <th onClick={() => handleSort('updatedAt')} className="sortable">
                                Updated {renderSortIcon('updatedAt')}
                            </th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productService.getSortedProducts(products, categories, stores, sortConfig).map(product => (
                            <tr key={product.id}>
                                <td>
                                    <img 
                                        src={product.imageUrl || '/placeholder.png'} 
                                        alt={product.name}
                                        className="product-image"
                                    />
                                </td>
                                <td>{product.name}</td>
                                <td>{productService.getCategoryName(categories, product.categoryId)}</td>
                                <td className="store-name">{productService.getStoreName(stores, product.storeId)}</td>
                                <td>{product.description}</td>
                                <td className="price-column">{productService.formatPrice(product.price)}</td>
                                <td>{product.stockQuantity}</td>
                                <td>{renderRating(product)}</td>
                                <td className="date-column">{productService.formatDate(product.createdAt)}</td>
                                <td className="date-column">{productService.formatDate(product.updatedAt)}</td>
                                <td>
                                    <div className="product-actions">
                                        <button 
                                            className="edit-btn"
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setIsEditModalOpen(true);
                                            }}
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            className="duplicate-btn"
                                            onClick={() => handleDuplicateProduct(product)}
                                            title="Duplicate"
                                        >
                                            <DocumentDuplicateIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDeleteProduct(product.id)}
                                            title="Delete"
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
            
            <Pagination 
                currentPage={pagination.pageIndex}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
            />
            
            <div className="pagination-info">
                Showing {products.length} of {pagination.totalCount} products 
                | Page {pagination.pageIndex} of {pagination.totalPages}
                <div className="page-size-selector">
                    <label htmlFor="page-size-select">Items/page:</label>
                    <select 
                        id="page-size-select"
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

            {/* Create product modal */}
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

            {/* Edit product modal */}
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