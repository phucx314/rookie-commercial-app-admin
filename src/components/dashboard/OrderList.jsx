import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import Pagination from '../common/Pagination';
import { toastService } from '../../services';
import './OrderList.css';

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ 
    key: searchParams.get('sortBy') || 'createdAt', 
    direction: searchParams.get('sortDir') || 'desc' 
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('pageSize')) || 10,
    totalCount: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [allOrders, setAllOrders] = useState([]);
  const [shouldApplySearch, setShouldApplySearch] = useState(!!searchParams.get('search'));

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
    
    setSearchParams(params);
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, shouldApplySearch, sortConfig, setSearchParams]);

  useEffect(() => {
    fetchAllOrders();
  }, []);
  
  useEffect(() => {
    if (allOrders.length > 0) {
      filterAndPaginateOrders();
    }
  }, [pagination.pageIndex, pagination.pageSize, allOrders, sortConfig]);

  // Separate useEffect to handle search
  useEffect(() => {
    if (shouldApplySearch && allOrders.length > 0) {
      filterAndPaginateOrders(allOrders, true);
    }
  }, [shouldApplySearch]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setAllOrders(data);
      filterAndPaginateOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toastService.error('Cannot load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateOrders = (ordersData = allOrders, isSearchRequest = false) => {
    let filtered = ordersData;
    
    // Apply search filter if search term exists
    if ((shouldApplySearch || isSearchRequest) && searchTerm) {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      filtered = ordersData.filter(order => 
        order.customer?.fullName?.toLowerCase().includes(lowercaseSearchTerm) ||
        order.customer?.email?.toLowerCase().includes(lowercaseSearchTerm) ||
        order.shippingAddress?.toLowerCase().includes(lowercaseSearchTerm)
      );
      
      if (isSearchRequest) {
        setTimeout(() => {
          setShouldApplySearch(false);
        }, 10);
      }
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special cases
      if (sortConfig.key === 'customer') {
        aValue = a.customer?.fullName || '';
        bValue = b.customer?.fullName || '';
      } else if (sortConfig.key === 'totalAmount') {
        aValue = parseFloat(a.totalAmount);
        bValue = parseFloat(b.totalAmount);
      } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aValue = new Date(a[sortConfig.key]);
        bValue = new Date(b[sortConfig.key]);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Calculate pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    
    // Apply pagination
    const startIndex = (pagination.pageIndex - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedItems = filtered.slice(startIndex, endIndex);
    
    // Update state
    setOrders(paginatedItems);
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
    setPagination({
      ...pagination,
      pageIndex: 1
    });
    setShouldApplySearch(true);
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 0: return 'status-badge pending';
      case 1: return 'status-badge processing';
      case 2: return 'status-badge shipped';
      case 3: return 'status-badge delivered';
      case 4: return 'status-badge cancelled';
      case 5: return 'status-badge returned';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      case 5: return 'Returned';
      default: return 'Unknown';
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 0: return 'payment-badge pending';
      case 1: return 'payment-badge paid';
      case 2: return 'payment-badge failed';
      case 3: return 'payment-badge refunded';
      default: return 'payment-badge';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Paid';
      case 2: return 'Failed';
      case 3: return 'Refunded';
      default: return 'Unknown';
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 0: return 'Cash On Delivery';
      case 1: return 'Bank Transfer';
      case 2: return 'Credit Card';
      case 3: return 'E-Wallet';
      default: return 'Unknown';
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="order-list">
      <div className="order-header">
        <h1>Orders</h1>
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-form-inline">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button-inside">
                <MagnifyingGlassIcon className="search-icon" />
              </button>
            </div>
          </form>
          <button 
            className="create-order-btn"
            onClick={() => navigate('/orders/create')}
          >
            <PlusIcon />
            Create Order
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="sortable">
                Order ID {renderSortIcon('id')}
              </th>
              <th onClick={() => handleSort('customer')} className="sortable">
                Customer {renderSortIcon('customer')}
              </th>
              <th onClick={() => handleSort('totalAmount')} className="sortable">
                Total Amount {renderSortIcon('totalAmount')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {renderSortIcon('status')}
              </th>
              <th onClick={() => handleSort('paymentStatus')} className="sortable">
                Payment Status {renderSortIcon('paymentStatus')}
              </th>
              <th onClick={() => handleSort('paymentMethod')} className="sortable">
                Payment Method {renderSortIcon('paymentMethod')}
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                Created At {renderSortIcon('createdAt')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  {order.customer ? (
                    <div className="customer-info">
                      <span className="customer-name">{order.customer.fullName}</span>
                      <span className="customer-email">{order.customer.email}</span>
                    </div>
                  ) : (
                    'Guest'
                  )}
                </td>
                <td className="amount-column">
                  {productService.formatPrice(order.totalAmount)}
                </td>
                <td>
                  <span className={getStatusBadgeClass(order.status)}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td>
                  <span className={getPaymentStatusBadgeClass(order.paymentStatus)}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </td>
                <td>{getPaymentMethodText(order.paymentMethod)}</td>
                <td className="date-column">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td>
                  <div className="order-actions">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      title="View Details"
                    >
                      View
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => navigate(`/orders/edit/${order.id}`)}
                      title="Edit"
                    >
                      <PencilIcon />
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
        Showing {orders.length} of {pagination.totalCount} orders
        | Page {pagination.pageIndex} of {pagination.totalPages}
        <div className="page-size-selector">
          <label>Items/page:</label>
          <select 
            value={pagination.pageSize}
            onChange={(e) => {
              setPagination({
                ...pagination,
                pageSize: parseInt(e.target.value),
                pageIndex: 1
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
    </div>
  );
};

export default OrderList; 