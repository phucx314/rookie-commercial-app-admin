import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, PrinterIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import storeService from '../../services/store.service';
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
  // Date range filter
  const [dateRange, setDateRange] = useState({
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || ''
  });
  const [allOrders, setAllOrders] = useState([]);
  const [shouldApplySearch, setShouldApplySearch] = useState(!!searchParams.get('search'));
  const [shouldApplyDateFilter, setShouldApplyDateFilter] = useState(
    !!(searchParams.get('fromDate') && searchParams.get('toDate'))
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (pagination.pageIndex !== 1) {
      params.set('page', pagination.pageIndex);
    } else {
      params.delete('page');
    }
    
    if (pagination.pageSize !== 10) {
      params.set('pageSize', pagination.pageSize);
    } else {
      params.delete('pageSize');
    }
    
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    if (sortConfig.key) {
      params.set('sortBy', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }
    
    if (dateRange.fromDate) {
      params.set('fromDate', dateRange.fromDate);
    } else {
      params.delete('fromDate');
    }
    
    if (dateRange.toDate) {
      params.set('toDate', dateRange.toDate);
    } else {
      params.delete('toDate');
    }
    
    setSearchParams(params);
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, dateRange.fromDate, dateRange.toDate, sortConfig]);

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
      filterAndPaginateOrders(allOrders, true, false);
    }
  }, [shouldApplySearch]);

  // Separate useEffect to handle date filter
  useEffect(() => {
    if (shouldApplyDateFilter && allOrders.length > 0) {
      filterAndPaginateOrders(allOrders, false, true);
    }
  }, [shouldApplyDateFilter]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setAllOrders(data);
      
      // Áp dụng cả hai bộ lọc nếu cần
      const applyDateFilter = !!(dateRange.fromDate && dateRange.toDate);
      const applySearchFilter = !!searchTerm;
      
      filterAndPaginateOrders(data, applySearchFilter, applyDateFilter);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toastService.error('Cannot load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateOrders = (ordersData = allOrders, isSearchRequest = false, isDateFilterRequest = false) => {
    let filtered = [...ordersData]; // Tạo bản sao để tránh thay đổi dữ liệu gốc
    
    console.log("Filtering orders:", { 
      searchTerm, 
      dateRange, 
      shouldApplySearch, 
      shouldApplyDateFilter,
      isSearchRequest,
      isDateFilterRequest 
    });
    
    // Apply search filter if search term exists
    if ((shouldApplySearch || isSearchRequest) && searchTerm) {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
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
    
    // Apply date range filter
    if ((shouldApplyDateFilter || isDateFilterRequest) && dateRange.fromDate && dateRange.toDate) {
      const fromDate = new Date(dateRange.fromDate);
      fromDate.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00:00 của ngày fromDate
      
      const toDate = new Date(dateRange.toDate);
      toDate.setHours(23, 59, 59, 999); // Kết thúc ở 23:59:59.999 của ngày toDate
      
      console.log("Date filtering from", fromDate, "to", toDate);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= fromDate && orderDate <= toDate;
      });
      
      if (isDateFilterRequest) {
        setTimeout(() => {
          setShouldApplyDateFilter(false);
        }, 10);
      }
    }
    
    // Log kết quả filter
    console.log(`Filtered orders: ${filtered.length} of ${ordersData.length}`);
    
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

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateRangeSubmit = (e) => {
    e.preventDefault();
    console.log("Applying date filter:", dateRange);
    setPagination({
      ...pagination,
      pageIndex: 1
    });
    setShouldApplyDateFilter(true);
  };

  const clearDateFilter = () => {
    setDateRange({
      fromDate: '',
      toDate: ''
    });
    setPagination({
      ...pagination,
      pageIndex: 1
    });
    setShouldApplyDateFilter(true);
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

  // Thêm hàm in hóa đơn
  const handlePrintBill = async (order) => {
    // Kiểm tra đơn hàng đã thanh toán và đã giao chưa
    if (order.status !== 3 || order.paymentStatus !== 1) {
      toastService.warning('Only paid and delivered orders can be printed');
      return;
    }
    
    try {
      // Cần lấy thêm chi tiết đơn hàng để in
      const orderDetails = await orderService.getOrderById(order.id);
      
      // Log để debug
      console.log('Order details for printing:', orderDetails);
      
      // Hiện thị thông báo nếu không có thông tin sản phẩm
      if (!orderDetails.orderItems || orderDetails.orderItems.length === 0) {
        toastService.warning('Order has no items to print');
        return;
      }

      // Truy vấn thêm thông tin sản phẩm và cửa hàng cho mỗi item
      const orderItems = await Promise.all(orderDetails.orderItems.map(async (item) => {
        let productName = 'Unknown Product';
        let storeInfo = null;
        
        try {
          // Nếu đã có thông tin sản phẩm
          if (item.product && item.product.name) {
            productName = item.product.name;
            
            // Cố gắng lấy thông tin cửa hàng từ sản phẩm nếu có
            if (item.product.storeId) {
              try {
                const storeData = await storeService.getStoreById(item.product.storeId);
                storeInfo = {
                  id: storeData.id,
                  name: storeData.name,
                  logoUrl: storeData.logoUrl
                };
              } catch (storeError) {
                console.warn(`Could not fetch store info for product ${item.productId}:`, storeError);
              }
            }
          } 
          // Nếu không có thông tin sản phẩm, thử gọi API lấy thông tin sản phẩm
          else if (item.productId) {
            // Thử gọi API lấy thông tin sản phẩm sử dụng productService
            try {
              const productData = await productService.getProductById(item.productId);
              if (productData) {
                productName = productData.name;
                
                // Lấy thông tin cửa hàng từ sản phẩm
                if (productData.storeId) {
                  try {
                    const storeData = await storeService.getStoreById(productData.storeId);
                    storeInfo = {
                      id: storeData.id,
                      name: storeData.name,
                      logoUrl: storeData.logoUrl
                    };
                  } catch (storeError) {
                    console.warn(`Could not fetch store info for product ${item.productId}:`, storeError);
                  }
                }
              }
            } catch (productError) {
              console.warn(`Could not fetch product info for ${item.productId}:`, productError);
              productName = `Product (ID: ${item.productId})`;
            }
          }
        } catch (error) {
          console.warn(`Error processing order item:`, error);
        }
        
        return {
          name: productName,
          price: item.price,
          quantity: item.quantity,
          storeInfo: storeInfo
        };
      }));
      
      // Chuẩn bị dữ liệu cho hóa đơn
      const orderData = {
        ...orderDetails,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: getPaymentMethodText(orderDetails.paymentMethod),
        customerName: orderDetails.customer?.fullName || 'Guest Customer',
        customerEmail: orderDetails.customer?.email || '',
        customerPhone: orderDetails.customer?.phoneNumber || '',
        orderItems: orderItems
      };
      
      // Gọi service để in hóa đơn
      orderService.printBill(orderData);
    } catch (error) {
      console.error('Error printing bill:', error);
      toastService.error('Error generating bill: ' + (error.response?.data?.message || error.message));
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

      {/* Date Range Filter */}
      <div className="date-filter-container">
        <form onSubmit={handleDateRangeSubmit} className="date-range-form">
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                name="fromDate"
                value={dateRange.fromDate}
                onChange={handleDateRangeChange}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                name="toDate"
                value={dateRange.toDate}
                onChange={handleDateRangeChange}
                className="date-input"
              />
            </div>
            <div className="filter-btn-container">
              <button type="submit" className="filter-btn">
                <FunnelIcon className="filter-icon" />
                Apply Filter
              </button>
            </div>
            {(dateRange.fromDate || dateRange.toDate) && (
              <div className="clear-filter-btn-container">
                <button type="button" className="clear-filter-btn" onClick={clearDateFilter}>
                  <XMarkIcon className="clear-icon" />
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </form>
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
            {orders.length > 0 ? (
              orders.map(order => (
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
                      {order.status === 3 && order.paymentStatus === 1 && (
                        <button 
                          className="print-btn"
                          onClick={() => handlePrintBill(order)}
                          title="Print Bill"
                        >
                          <PrinterIcon />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-orders-message">
                  {searchTerm || (dateRange.fromDate && dateRange.toDate) 
                    ? "No orders found matching your filters." 
                    : "No orders found."}
                </td>
              </tr>
            )}
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