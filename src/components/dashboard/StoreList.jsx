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
            setCurrentSearchTerm(searchTerm);
            // This will prevent the double fetch by not changing shouldApplySearch yet
            fetchPaginatedStores(true);
        }
    }, [shouldApplySearch]);

    const fetchPaginatedStores = async (isSearchRequest = false) => {
        try {
            setLoading(true);
            let data;
            
            if ((shouldApplySearch || isSearchRequest) && searchTerm) {
                console.log(`Searching stores with term: "${searchTerm}"`);
                data = await storeService.searchStores(
                    searchTerm,
                    pagination.pageIndex,
                    pagination.pageSize,
                    activeFilter
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
                    pagination.pageIndex,
                    pagination.pageSize,
                    activeFilter
                );
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
            // Nếu chuỗi tìm kiếm trống, lấy tất cả cửa hàng
            if (!term.trim()) {
                response = await storeService.getPaginatedStores(
                    1, // Bắt đầu từ trang 1 cho tìm kiếm mới
                    pagination.pageSize,
                    activeFilter
                );
            } else {
                response = await storeService.searchStores(
                    term,
                    1, // Bắt đầu từ trang 1 cho tìm kiếm mới
                    pagination.pageSize,
                    activeFilter
                );
            }
            
            setStores(response.items);
            setPagination({
                ...pagination,
                pageIndex: 1,
                totalCount: response.totalCount,
                totalPages: response.totalPages
            });
            
            // Đặt cờ sau khi tìm kiếm thành công
            setShouldApplySearch(true);
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
        }
    }, [stores]);

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

    if (loading) return <div className="loading">Loading stores...</div>;

    return (
        <div className="store-list-container">
            <div className="store-list-header">
                <h2>Store List</h2>
                <div className="header-actions">
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
                    <div key={store.id} className="store-card">
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
                            {store.sellerName || (store.sellerId ? store.sellerId : 'Unknown')}
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
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditChange}
                                />
                            </div>
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
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
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
        </div>
    );
};

export default StoreList; 