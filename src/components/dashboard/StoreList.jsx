import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { storeService, toastService } from '../../services';
import Pagination from '../common/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import './StoreList.css';

const StoreList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storeStats, setStoreStats] = useState({});
    const [activeFilter, setActiveFilter] = useState(searchParams.get('status') || 'all');
    const [editingStore, setEditingStore] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        address: '',
        phoneNumber: '',
        email: '',
        logoUrl: ''
    });
    
    // Thêm state cho modal tạo cửa hàng mới
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        address: '',
        phoneNumber: '',
        email: '',
        logoUrl: '',
        sellerId: ''
    });
    
    // State cho danh sách sellers
    const [sellers, setSellers] = useState([]);
    const [loadingSellers, setLoadingSellers] = useState(false);
    
    // Pagination states
    const [pagination, setPagination] = useState({
        pageIndex: parseInt(searchParams.get('page')) || 1,
        pageSize: parseInt(searchParams.get('pageSize')) || 12,
        totalCount: 0,
        totalPages: 0
    });
    
    // Tìm kiếm
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [shouldApplySearch, setShouldApplySearch] = useState(!!searchParams.get('search'));
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');

    // Multiple select states
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectMode, setSelectMode] = useState(false);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        
        if (pagination.pageIndex !== 1) {
            params.set('page', pagination.pageIndex);
        }
        
        if (pagination.pageSize !== 12) {
            params.set('pageSize', pagination.pageSize);
        }
        
        if (activeFilter !== 'all') {
            params.set('status', activeFilter);
        }
        
        if (searchTerm) {
            params.set('search', searchTerm);
        }
        
        // Update URL without causing a navigation/reload
        setSearchParams(params);
    }, [pagination.pageIndex, pagination.pageSize, activeFilter, searchTerm, shouldApplySearch, setSearchParams]);

    // Check URL params on mount
    useEffect(() => {
        const pageFromUrl = searchParams.get('page');
        const pageSizeFromUrl = searchParams.get('pageSize');
        if (pageFromUrl || pageSizeFromUrl) {
            setPagination(prev => ({
                ...prev,
                pageIndex: pageFromUrl ? parseInt(pageFromUrl) : prev.pageIndex,
                pageSize: pageSizeFromUrl ? parseInt(pageSizeFromUrl) : prev.pageSize
            }));
        }
        
        const statusFromUrl = searchParams.get('status');
        if (statusFromUrl) {
            setActiveFilter(statusFromUrl);
        }

        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchTerm(searchFromUrl);
            setShouldApplySearch(true);
        }
    }, []);

    useEffect(() => {
        fetchPaginatedStores();
    }, [pagination.pageIndex, pagination.pageSize, activeFilter]);

    // Separate useEffect to handle search
    useEffect(() => {
        if (shouldApplySearch) {
            // Store the current search term for comparison
            setCurrentSearchTerm(searchTerm || '');
            // Only fetch if this is from URL param initialization, not after searchStores is called
            if (currentSearchTerm !== searchTerm) {
                fetchPaginatedStores(true);
            } else {
                // Just reset the flag without triggering another fetch
                setTimeout(() => {
                    setShouldApplySearch(false);
                }, 10);
            }
        }
    }, [shouldApplySearch]);

    // Hàm mới để force refresh dữ liệu
    const handleRefreshData = () => {
        console.log("Đang làm mới dữ liệu cửa hàng...");
        fetchPaginatedStores(false, true);
    };

    const fetchPaginatedStores = async (isSearchRequest = false, isForceRefresh = false) => {
        try {
            setLoading(true);
            let data;
            
            if ((shouldApplySearch || isSearchRequest) && searchTerm) {
                console.log(`Searching stores with term: "${searchTerm}"`);
                data = await storeService.searchStores(
                    searchTerm,
                    pagination.pageIndex,
                    pagination.pageSize,
                    activeFilter,
                    'Name', // SortBy parameter
                    'asc'   // SortDirection parameter
                );
                
                // Only reset the flag if this was called from the search useEffect
                if (isSearchRequest) {
                    // Reset shouldApplySearch without triggering another fetch
                    setTimeout(() => {
                        setShouldApplySearch(false);
                    }, 10);
                }
            } else {
                console.log(`Loading stores with filter: ${activeFilter}`);
                data = await storeService.getPaginatedStores(
                    pagination.pageIndex || 1,
                    pagination.pageSize || 12,
                    activeFilter || 'all',
                    '', // Truyền chuỗi rỗng thay vì undefined
                    'Name', // SortBy parameter
                    'asc'   // SortDirection parameter
                );
            }
            
            // Log dữ liệu để kiểm tra
            if (isForceRefresh) {
                console.log("Dữ liệu cửa hàng đã được làm mới:", data);
                data.items.forEach(store => {
                    console.log(`Cửa hàng: ${store.name}, Seller ID: ${store.sellerId}, Seller Name: ${store.sellerName}`);
                });
            }
            
            setStores(data.items);
            setPagination({
                ...pagination,
                totalCount: data.totalCount,
                totalPages: data.totalPages
            });
        } catch (err) {
            toastService.error('Cannot load store list. Please try again later.');
            console.error('Error fetching paginated stores:', err);
        } finally {
            setLoading(false);
        }
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
        searchStores(searchTerm);
    };

    // Hàm mới để trực tiếp xử lý tìm kiếm
    const searchStores = async (term) => {
        try {
            setLoading(true);
            console.log(`Directly searching stores with term: "${term}"`);
            
            let response;
            // Đảm bảo term không bao giờ là null hoặc undefined
            const searchTermValue = term && term.trim() ? term.trim() : '';
            
            // Nếu chuỗi tìm kiếm trống, lấy tất cả cửa hàng
            if (!searchTermValue) {
                response = await storeService.getPaginatedStores(
                    1, // Bắt đầu từ trang 1 cho tìm kiếm mới
                    pagination.pageSize || 12,
                    activeFilter || 'all',
                    '',
                    'Name', // SortBy parameter
                    'asc'   // SortDirection parameter
                );
            } else {
                response = await storeService.searchStores(
                    searchTermValue,
                    1, // Bắt đầu từ trang 1 cho tìm kiếm mới
                    pagination.pageSize || 12,
                    activeFilter || 'all',
                    'Name', // SortBy parameter
                    'asc'   // SortDirection parameter
                );
            }
            
            setStores(response.items);
            setPagination({
                ...pagination,
                pageIndex: 1,
                totalCount: response.totalCount,
                totalPages: response.totalPages
            });
            
            // Lưu từ khóa tìm kiếm hiện tại để so sánh
            setCurrentSearchTerm(term || '');
            
            // KHÔNG đặt shouldApplySearch = true ở đây để tránh gọi API lần nữa
            // setShouldApplySearch(true);
        } catch (err) {
            toastService.error('Cannot search stores. Please try again later.');
            console.error('Error searching stores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchStoreStats = async () => {
            try {
                const statsPromises = stores.map(store => 
                    storeService.getStoreStats(store.id)
                        .then(response => ({ 
                            storeId: store.id, 
                            stats: response 
                        }))
                        .catch(error => ({ 
                            storeId: store.id, 
                            stats: { totalProducts: 0, totalOrders: 0, totalRevenue: 0 } 
                        }))
                );

                const statsResults = await Promise.all(statsPromises);
                const statsMap = {};
                statsResults.forEach(result => {
                    statsMap[result.storeId] = result.stats;
                });
                setStoreStats(statsMap);
            } catch (err) {
                console.error('Error fetching store stats:', err);
            }
        };

        if (stores.length > 0) {
            fetchStoreStats();
            // Lấy thông tin người bán nếu thiếu
            fetchMissingSellerInfo();
        }
    }, [stores]);

    // Hàm mới để lấy thông tin người bán bị thiếu
    const fetchMissingSellerInfo = async () => {
        const storesWithoutSellerName = stores.filter(store => !store.sellerName && store.sellerId);
        if (storesWithoutSellerName.length === 0) return;
        
        console.log(`Có ${storesWithoutSellerName.length} cửa hàng thiếu thông tin người bán. Đang lấy thông tin...`);
        
        try {
            const updatedStores = [...stores];
            
            // Lấy thông tin người bán cho từng cửa hàng
            for (const store of storesWithoutSellerName) {
                const sellerInfo = await storeService.getSellerInfo(store.sellerId);
                if (sellerInfo) {
                    // Cập nhật thông tin người bán trong store
                    const index = updatedStores.findIndex(s => s.id === store.id);
                    if (index !== -1) {
                        updatedStores[index] = {
                            ...updatedStores[index],
                            sellerName: sellerInfo.username || sellerInfo.fullName
                        };
                        console.log(`Đã cập nhật thông tin người bán cho cửa hàng ${store.name}: ${sellerInfo.username || sellerInfo.fullName}`);
                    }
                }
            }
            
            // Cập nhật state danh sách cửa hàng với thông tin đã cập nhật
            setStores(updatedStores);
            
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người bán:', error);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination({
            ...pagination,
            pageIndex: newPage
        });
    };

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const handleImageError = (e, storeName) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        // Reset to page 1 when changing filter
        setPagination({
            ...pagination,
            pageIndex: 1
        });
    };

    const handleEditClick = (store) => {
        setEditingStore(store);
        setEditForm({
            name: store.name,
            description: store.description || '',
            address: store.address || '',
            phoneNumber: store.phoneNumber || '',
            email: store.email || '',
            logoUrl: store.logoUrl || ''
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await toastService.promise(
                storeService.updateStore(editingStore.id, editForm),
                {
                    pending: 'Updating store...',
                    success: 'Store updated successfully!',
                    error: 'Cannot update store. Please try again.'
                }
            );
            fetchPaginatedStores();
            setEditingStore(null);
        } catch (err) {
            console.error('Error updating store:', err);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Multiple select handlers
    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        if (selectMode) {
            // Clear selections when exiting select mode
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
        if (selectedItems.size === stores.length) {
            // Deselect all
            setSelectedItems(new Set());
        } else {
            // Select all
            const allIds = stores.map(store => store.id);
            setSelectedItems(new Set(allIds));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedItems.size === 0) return;
        
        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.size} cửa hàng đã chọn?`)) {
            setLoading(true);
            
            try {
                // Process deletions one by one
                const deletePromises = Array.from(selectedItems).map(id =>
                    storeService.deleteStore(id)
                        .then(() => ({ id, success: true }))
                        .catch(error => {
                            console.error(`Error deleting store ${id}:`, error);
                            return { id, success: false, error };
                        })
                );
                
                const results = await Promise.all(deletePromises);
                
                // Count successes and failures correctly
                const successful = results.filter(r => r.success === true).length;
                const failed = results.filter(r => r.success === false).length;
                
                if (failed > 0) {
                    toastService.warning(`Đã xóa ${successful} cửa hàng thành công, ${failed} cửa hàng thất bại.`);
                } else {
                    toastService.success(`Đã xóa ${successful} cửa hàng thành công!`);
                }
                
                // Exit select mode and refresh data
                setSelectMode(false);
                setSelectedItems(new Set());
                fetchPaginatedStores();
            } catch (error) {
                console.error('Error in batch delete:', error);
                toastService.error('Lỗi khi xóa cửa hàng hàng loạt');
            } finally {
                setLoading(false);
            }
        }
    };

    // Fetch danh sách Sellers
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                setLoadingSellers(true);
                const sellersData = await storeService.getSellersList();
                console.log('Sellers data:', sellersData);
                setSellers(sellersData);
            } catch (error) {
                console.error('Error fetching sellers list:', error);
            } finally {
                setLoadingSellers(false);
            }
        };
        
        // Chỉ gọi API khi modal hiển thị
        if (showCreateModal) {
            fetchSellers();
        }
    }, [showCreateModal]);
    
    // Xử lý submit form tạo cửa hàng mới
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Kiểm tra dữ liệu đầu vào
            if (!createForm.name || !createForm.address || !createForm.phoneNumber || !createForm.email) {
                toastService.error('Please fill in all required fields');
                setLoading(false);
                return;
            }
            
            // Kiểm tra xem có sellers không
            if (sellers.length === 0) {
                toastService.error('Cannot create store: No active sellers available in the system');
                setLoading(false);
                return;
            }
            
            if (!createForm.sellerId) {
                toastService.error('Please select a seller for this store');
                setLoading(false);
                return;
            }
            
            // Kiểm tra xem seller đã được chọn có hợp lệ không
            const selectedSeller = sellers.find(seller => seller.id === createForm.sellerId);
            if (!selectedSeller) {
                toastService.error('The selected seller is not valid');
                setLoading(false);
                return;
            }
            
            // Gọi API tạo cửa hàng mới
            await toastService.promise(
                storeService.createStore(createForm),
                {
                    pending: 'Creating new store...',
                    success: `Store created successfully for seller ${selectedSeller.username}!`,
                    error: 'Failed to create store. Please try again.'
                }
            );
            
            // Đóng modal và làm mới dữ liệu
            setShowCreateModal(false);
            setCreateForm({
                name: '',
                description: '',
                address: '',
                phoneNumber: '',
                email: '',
                logoUrl: '',
                sellerId: ''
            });
            fetchPaginatedStores();
        } catch (error) {
            console.error('Error creating store:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Xử lý thay đổi giá trị form tạo cửa hàng mới
    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) return <div className="loading">Loading stores...</div>;

    return (
        <div className="store-list-container">
            <div className="store-list-header">
                <h2>Store List</h2>
                <div className="header-actions">
                    <button 
                        className="create-store-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create New Store
                    </button>
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
                    <form onSubmit={handleSearch} className="search-form-inline" id="store-search-form">
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search stores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                id="store-search-input"
                                name="store-search"
                            />
                            <button type="submit" className="search-button-inside" id="store-search-button" name="store-search-button">
                                <MagnifyingGlassIcon className="search-icon" />
                            </button>
                        </div>
                    </form>
                    <div className="store-filters">
                        <button 
                            className={activeFilter === 'all' ? 'active' : ''} 
                            onClick={() => handleFilterChange('all')}
                        >
                            All
                        </button>
                        <button 
                            className={activeFilter === 'active' ? 'active' : ''} 
                            onClick={() => handleFilterChange('active')}
                        >
                            Active
                        </button>
                        <button 
                            className={activeFilter === 'inactive' ? 'active' : ''} 
                            onClick={() => handleFilterChange('inactive')}
                        >
                            Inactive
                        </button>
                    </div>
                </div>
            </div>

            <div className="store-grid">
                {stores.map(store => (
                    <div key={store.id} className={`store-card ${selectedItems.has(store.id) ? 'selected-card' : ''}`}>
                        {selectMode && (
                            <div className="store-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.has(store.id)}
                                    onChange={() => toggleItemSelection(store.id)}
                                    id={`select-checkbox-${store.id}`}
                                />
                            </div>
                        )}
                        <div className="store-logo">
                            {store.logoUrl ? (
                                <>
                                    <img 
                                        src={store.logoUrl} 
                                        alt={`${store.name} logo`} 
                                        className="store-logo-image"
                                        onError={(e) => handleImageError(e, store.name)}
                                    />
                                    <div className="store-logo-fallback">
                                        {getInitial(store.name)}
                                    </div>
                                </>
                            ) : (
                                <div className="store-logo-fallback">
                                    {getInitial(store.name)}
                                </div>
                            )}
                        </div>
                        <h3 className="store-name">{store.name}</h3>
                        <p className="store-address">{store.address || 'Address not available'}</p>
                        <p className="store-seller">
                            <span className="seller-label">Seller:</span> 
                            {store.sellerName || 'Chưa có thông tin người bán'}
                        </p>
                        
                        <div className="store-stats">
                            <div className="stat-item">
                                <div className="stat-label">Products</div>
                                <div className="stat-value">{storeStats[store.id]?.totalProducts || 0}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Orders</div>
                                <div className="stat-value">{storeStats[store.id]?.totalOrders || 0}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Revenue</div>
                                <div className="stat-value">{storeService.formatCurrency(storeStats[store.id]?.totalRevenue || 0)}</div>
                            </div>
                        </div>

                        <div className="store-actions">
                            <button className="view-details-btn">View Details</button>
                            <button 
                                className="edit-store-btn"
                                onClick={() => handleEditClick(store)}
                            >
                                Edit Store
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination 
                currentPage={pagination.pageIndex}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
            />
            
            <div className="pagination-info">
                Showing {stores.length} of {pagination.totalCount} stores
                | Page {pagination.pageIndex} of {pagination.totalPages}
                <div className="page-size-selector">
                    <label htmlFor="store-page-size-select">Items/page:</label>
                    <select 
                        id="store-page-size-select"
                        value={pagination.pageSize}
                        onChange={(e) => {
                            setPagination({
                                ...pagination,
                                pageSize: parseInt(e.target.value),
                                pageIndex: 1 // Reset to page 1 when changing items/page
                            });
                        }}
                        className="page-size-select"
                    >
                        <option value="6">6</option>
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="48">48</option>
                    </select>
                </div>
            </div>

            {editingStore && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Edit Store</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-form-content">
                                <div className="form-layout two-columns">
                            <div className="form-group">
                                <label>Store Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                                    <div className="form-group">
                                        <label>Logo URL</label>
                                        <input
                                            type="url"
                                            name="logoUrl"
                                            value={editForm.logoUrl}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditChange}
                                />
                            </div>

                                <div className="form-layout two-columns">
                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={editForm.address}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={editForm.phoneNumber}
                                    onChange={handleEditChange}
                                />
                                    </div>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                />
                            </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setEditingStore(null)}>
                                    Cancel
                                </button>
                                <button type="submit">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {showCreateModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Create New Store</h2>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="modal-form-content">
                                <div className="form-layout two-columns">
                                    <div className="form-group">
                                        <label>Store Name <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={createForm.name}
                                            onChange={handleCreateChange}
                                            required
                                            placeholder="Enter store name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Logo URL</label>
                                        <input
                                            type="url"
                                            name="logoUrl"
                                            value={createForm.logoUrl}
                                            onChange={handleCreateChange}
                                            placeholder="Enter logo URL"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={createForm.description}
                                        onChange={handleCreateChange}
                                        placeholder="Enter store description"
                                    />
                                </div>

                                <div className="form-layout two-columns">
                                    <div className="form-group">
                                        <label>Address <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={createForm.address}
                                            onChange={handleCreateChange}
                                            required
                                            placeholder="Enter store address"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number <span className="required">*</span></label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={createForm.phoneNumber}
                                            onChange={handleCreateChange}
                                            required
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={createForm.email}
                                        onChange={handleCreateChange}
                                        required
                                        placeholder="Enter email address"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Store Owner (Seller) <span className="required">*</span></label>
                                    <select
                                        name="sellerId"
                                        value={createForm.sellerId}
                                        onChange={handleCreateChange}
                                        required
                                        disabled={loadingSellers}
                                    >
                                        <option value="">Select a seller</option>
                                        {sellers.length > 0 ? (
                                            sellers.map(seller => (
                                                <option key={seller.id} value={seller.id}>
                                                    {seller.username} ({seller.email})
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No active sellers found</option>
                                        )}
                                    </select>
                                    {loadingSellers && <div className="loading-indicator">Loading sellers...</div>}
                                    {!loadingSellers && sellers.length === 0 && (
                                        <div className="warning-message">
                                            No active sellers found. Please ensure there are users with the Seller role.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit">Create Store</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreList; 