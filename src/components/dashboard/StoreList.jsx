import React, { useState, useEffect } from 'react';
import { storeService, toastService } from '../../services';
import './StoreList.css';

const StoreList = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storeStats, setStoreStats] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');
    const [editingStore, setEditingStore] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        address: '',
        phoneNumber: '',
        email: '',
        logoUrl: ''
    });

    useEffect(() => {
        fetchStores(activeFilter);
    }, [activeFilter]);

    const fetchStores = async (filter = 'all') => {
        try {
            setLoading(true);
            const data = await storeService.getAllStores(filter !== 'all' ? { status: filter } : {});
            setStores(data);
        } catch (err) {
            toastService.error('Cannot load store list. Please try again later.');
            console.error('Error fetching stores:', err);
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

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const handleImageError = (e, storeName) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
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
            fetchStores(activeFilter);
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