import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import './CreateInStoreOrder.css';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import { toastService } from '../../services/toast.service';

const CreateInStoreOrder = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    shippingAddress: '',
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'CashOnDelivery',
  });
  const [formErrors, setFormErrors] = useState({});
  const [newCustomerForm, setNewCustomerForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    address: '',
  });
  const [newCustomerErrors, setNewCustomerErrors] = useState({});
  const [activeTab, setActiveTab] = useState('1');

  // State for customer
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // State for products
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // State for order
  const [loading, setLoading] = useState(false);

  // Thêm state lưu quantity nhập cho từng product
  const [productQuantities, setProductQuantities] = useState({});
  
  // Thêm state cho đơn hàng đã tạo
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    loadInitialProducts();
  }, []);

  useEffect(() => {
    // Calculate total when selected products change
    calculateTotal();
  }, [selectedProducts]);

  const loadInitialProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      // Đảm bảo luôn là mảng
      setProducts(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Unable to load product list', error);
      setProducts([]);
    }
  };

  const handleSearchCustomers = async () => {
    if (!searchTerm) return;

    try {
      const searchParams = {};
      
      if (searchTerm.includes('@')) {
        searchParams.email = searchTerm;
      } else if (/^\d+$/.test(searchTerm)) {
        // Tìm kiếm bằng số điện thoại nếu searchTerm chỉ chứa số
        searchParams.phoneNumber = searchTerm;
      } else {
        searchParams.username = searchTerm;
      }

      const data = await orderService.searchCustomers(searchParams);
      setCustomers(data);
    } catch (error) {
      console.error('Error searching customers', error);
    }
  };

  const handleSearchProducts = async () => {
    try {
      if (!productSearchTerm) {
        loadInitialProducts();
        return;
      }
      const data = await productService.searchProducts(productSearchTerm);
      // Đảm bảo luôn là mảng
      setProducts(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Error searching products', error);
      setProducts([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setActiveTab('2'); // Switch to products tab
  };

  const handleAddToCart = (product) => {
    const quantity = parseInt(productQuantities[product.id]) || 1;
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      // Nếu đã có, cộng thêm quantity
      const updatedProducts = selectedProducts.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
      );
      setSelectedProducts(updatedProducts);
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity }]);
    }
    // Reset input về 1 sau khi add
    setProductQuantities({ ...productQuantities, [product.id]: 1 });
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleChangeQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    const updatedProducts = selectedProducts.map(p => 
      p.id === productId ? { ...p, quantity: newQuantity } : p
    );
    setSelectedProducts(updatedProducts);
  };

  const calculateTotal = () => {
    const total = orderService.calculateTotal(selectedProducts);
    setTotalAmount(total);
    setFormValues({
      ...formValues,
      totalAmount: total
    });
  };

  const validateNewCustomerForm = () => {
    const errors = {};
    if (!newCustomerForm.username) errors.username = 'Username is required';
    if (!newCustomerForm.email) errors.email = 'Email is required';
    if (newCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerForm.email)) {
      errors.email = 'Invalid email format';
    }
    if (!newCustomerForm.fullName) errors.fullName = 'Full name is required';
    
    setNewCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOrderForm = () => {
    const errors = {};
    if (!formValues.shippingAddress) errors.shippingAddress = 'Shipping address is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitNewCustomer = (e) => {
    e.preventDefault();
    if (validateNewCustomerForm()) {
      setIsNewCustomer(true);
      setSelectedCustomer(null);
      setActiveTab('2'); // Switch to products tab
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!validateOrderForm()) return;
    
    if (selectedProducts.length === 0) {
      toastService.error('Please select at least one product');
      return;
    }

    if (!selectedCustomer && !isNewCustomer) {
      toastService.error('Please select or create a customer');
      return;
    }

    setLoading(true);

    try {
      // Convert string values to enum integers
      let statusInt = 0; // Pending
      switch(formValues.status) {
        case 'Processing': statusInt = 1; break;
        case 'Shipped': statusInt = 2; break;
        case 'Delivered': statusInt = 3; break;
        case 'Cancelled': statusInt = 4; break;
        case 'Returned': statusInt = 5; break;
        default: statusInt = 3; // Default Delivered
      }
      
      let paymentStatusInt = 0; // Pending
      switch(formValues.paymentStatus) {
        case 'Paid': paymentStatusInt = 1; break;
        case 'Failed': paymentStatusInt = 2; break;
        case 'Refunded': paymentStatusInt = 3; break;
        default: paymentStatusInt = 1; // Default Paid
      }
      
      let paymentMethodInt = 0; // CashOnDelivery
      switch(formValues.paymentMethod) {
        case 'BankTransfer': paymentMethodInt = 1; break;
        case 'CreditCard': paymentMethodInt = 2; break;
        case 'EWallet': paymentMethodInt = 3; break;
        default: paymentMethodInt = 0; // Default CashOnDelivery
      }

      // Create basic order data
      const orderData = {
        totalAmount,
        shippingAddress: formValues.shippingAddress,
        status: statusInt,
        paymentStatus: paymentStatusInt,
        paymentMethod: paymentMethodInt,
        orderItems: selectedProducts.map(p => ({
          productId: p.id,
          quantity: p.quantity,
          price: p.price
        }))
      };

      // Add customer information
      if (isNewCustomer) {
        // New customer - send full customer data
        orderData.customer = {
          username: newCustomerForm.username,
          email: newCustomerForm.email,
          fullName: newCustomerForm.fullName,
          phoneNumber: newCustomerForm.phoneNumber || '',
          address: newCustomerForm.address || ''
        };
      } else {
        // Existing customer - only need to send customerId
        orderData.customerId = selectedCustomer.id;
      }

      console.log('Sending order data:', orderData);
      const response = await orderService.createInStoreOrder(orderData);
      
      // Lưu thông tin đơn hàng đã tạo để có thể in hóa đơn
      const createdOrderData = {
        ...orderData,
        customerName: isNewCustomer ? newCustomerForm.fullName : selectedCustomer.fullName,
        customerEmail: isNewCustomer ? newCustomerForm.email : selectedCustomer.email,
        customerPhone: isNewCustomer ? newCustomerForm.phoneNumber : selectedCustomer.phoneNumber,
        orderItems: selectedProducts.map(p => ({
          ...p,
          name: p.name,
          price: p.price,
          quantity: p.quantity
        })),
        status: formValues.status,
        paymentStatus: formValues.paymentStatus,
        paymentMethod: formValues.paymentMethod
      };
      
      setCreatedOrder(createdOrderData);
      
      toastService.success('Order created successfully');
      
      // Hiển thị nút in bill nếu đơn hàng đã thanh toán và đã giao
      if (formValues.status === 'Delivered' && formValues.paymentStatus === 'Paid') {
        // Không tự động chuyển về trang orders để người dùng có thể in hóa đơn
        // navigate('/orders');
      } else {
        setTimeout(() => {
          navigate('/orders');
        }, 3000); // Chờ 3 giây để người dùng xem thông báo thành công
      }
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Display detailed error messages if available
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors)
          .flat()
          .join(', ');
        toastService.error(`Error creating order: ${errorMessages}`);
      } else {
        toastService.error(`Error creating order: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerForm({
      ...newCustomerForm,
      [name]: value
    });
  };

  // Thêm hàm in hóa đơn
  const handlePrintBill = () => {
    if (!createdOrder) {
      toastService.error('No order data available for printing');
      return;
    }
    
    // Kiểm tra đơn hàng đã thanh toán và đã giao chưa
    if (createdOrder.status !== 'Delivered' || createdOrder.paymentStatus !== 'Paid') {
      toastService.warning('Only paid and delivered orders can be printed');
      return;
    }
    
    // Gọi service để in hóa đơn
    orderService.printBill(createdOrder);
  };

  return (
    <div className="create-order-container">
      <div className="create-order-header">
        <div className="create-order-header-actions">
          <button
            className="create-order-back-button"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeftIcon className="create-order-back-icon" />
            Back to Orders
          </button>
        </div>
        <div>
          <h1>Create In-Store Order</h1>
          <p>Create a new order for a walk-in customer</p>
        </div>
      </div>

      <div className="create-order-tabs">
        <div className="create-order-tab-list">
          <div 
            className={`create-order-tab-item ${activeTab === '1' ? 'active' : ''}`}
            onClick={() => !selectedCustomer && setActiveTab('1')}
          >
            1. Select Customer
          </div>
          <div 
            className={`create-order-tab-item ${activeTab === '2' ? 'active' : ''}`}
            onClick={() => (selectedCustomer || isNewCustomer) && setActiveTab('2')}
          >
            2. Add Products
          </div>
          <div 
            className={`create-order-tab-item ${activeTab === '3' ? 'active' : ''}`}
            onClick={() => selectedProducts.length > 0 && setActiveTab('3')}
          >
            3. Review & Checkout
          </div>
        </div>

        <div className="create-order-tab-content">
          {activeTab === '1' && (
            <div>
              <div className="create-order-search-section">
                <h2>Search for a Customer</h2>
                <div className="create-order-search-bar">
                  <div className="create-order-search-input-container">
                  <input
                    type="text"
                      className="create-order-search-input"
                      placeholder="Search by email, username or phone number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomers()}
                  />
                  </div>
                  <button
                    className="create-order-search-button"
                    onClick={handleSearchCustomers}
                  >
                    Search
                  </button>
                </div>

                {customers.length > 0 && (
                  <div className="customer-search-results">
                    <table className="customer-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.username}</td>
                            <td>{customer.fullName}</td>
                            <td>{customer.email}</td>
                            <td>{customer.phoneNumber || 'N/A'}</td>
                            <td>
                              <button 
                                className="customer-select-button"
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="create-order-divider">
                  <span className="create-order-divider-text">OR</span>
              </div>

                <h2>Create a New Customer</h2>
                <form onSubmit={handleSubmitNewCustomer}>
                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Username*</label>
                    <input 
                      type="text"
                      className="create-order-form-input"
                      name="username"
                      value={newCustomerForm.username}
                      onChange={handleNewCustomerChange}
                    />
                    {newCustomerErrors.username && (
                      <div className="create-order-error-message">{newCustomerErrors.username}</div>
                    )}
                  </div>
                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Email*</label>
                    <input 
                      type="email"
                      className="create-order-form-input"
                      name="email"
                      value={newCustomerForm.email}
                      onChange={handleNewCustomerChange}
                    />
                    {newCustomerErrors.email && (
                      <div className="create-order-error-message">{newCustomerErrors.email}</div>
                    )}
                  </div>
                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Full Name*</label>
                    <input 
                      type="text"
                      className="create-order-form-input"
                      name="fullName"
                      value={newCustomerForm.fullName}
                      onChange={handleNewCustomerChange}
                    />
                    {newCustomerErrors.fullName && (
                      <div className="create-order-error-message">{newCustomerErrors.fullName}</div>
                    )}
                  </div>
                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Phone Number</label>
                    <input 
                      type="text"
                      className="create-order-form-input"
                      name="phoneNumber"
                      value={newCustomerForm.phoneNumber}
                      onChange={handleNewCustomerChange}
                    />
                  </div>
                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Address</label>
                    <input
                      type="text"
                      className="create-order-form-input"
                      name="address"
                      value={newCustomerForm.address}
                      onChange={handleNewCustomerChange}
                    />
                  </div>

                  <button className="create-customer-button" type="submit">
                    Create & Select
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === '2' && (
            <div>
              {(selectedCustomer || isNewCustomer) && (
                <div className="selected-customer">
                  <h3>Selected Customer</h3>
                  <div className="customer-info">
                    {selectedCustomer ? (
                      <>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Username</p>
                          <p>{selectedCustomer.username}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Full Name</p>
                          <p>{selectedCustomer.fullName}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Email</p>
                          <p>{selectedCustomer.email}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Phone Number</p>
                          <p>{selectedCustomer.phoneNumber || 'N/A'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Username</p>
                          <p>{newCustomerForm.username}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Full Name</p>
                          <p>{newCustomerForm.fullName}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Email</p>
                          <p>{newCustomerForm.email}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Phone Number</p>
                          <p>{newCustomerForm.phoneNumber || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="create-order-search-section">
                <h2>Search for Products</h2>
                <div className="create-order-search-bar">
                  <div className="create-order-search-input-container">
                  <input
                    type="text"
                      className="create-order-search-input"
                      placeholder="Search by product name"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchProducts()}
                  />
                  </div>
                  <button
                    className="create-order-search-button"
                    onClick={handleSearchProducts}
                  >
                    Search
                  </button>
                </div>

                <div className="create-order-product-list">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Quantity</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                            ) : (
                              <div style={{ width: 48, height: 48, background: '#eee', borderRadius: 4 }} />
                            )}
                          </td>
                          <td>{product.name}</td>
                          <td>{product.sku || 'N/A'}</td>
                          <td>{product.category?.name || product.categoryName || (() => {console.log('No category for product:', product); return 'N/A';})()}</td>
                          <td>{productService.formatPrice(product.price)}</td>
                          <td>{product.stockQuantity}</td>
                          <td>
                            <input
                              type="number"
                              className="create-order-quantity-input"
                              value={productQuantities[product.id] || 1}
                              min={1}
                              max={product.stockQuantity}
                              onChange={e => setProductQuantities({ ...productQuantities, [product.id]: e.target.value })}
                            />
                          </td>
                          <td>
                            <button
                              className="product-add-button"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stockQuantity === 0}
                              title="Add to cart"
                            >
                              <span style={{ fontSize: 16, fontWeight: 'bold' }}>+</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="create-order-selected-products">
                  <h3>Selected Products</h3>
                  <table className="create-order-cart-table">
                      <thead>
                        <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                      {selectedProducts.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                          <td>{productService.formatPrice(product.price)}</td>
                            <td>
                              <input
                                type="number"
                              className="create-order-quantity-input"
                              value={product.quantity}
                              onChange={(e) => handleChangeQuantity(product.id, parseInt(e.target.value))}
                              min={1}
                                max={product.stockQuantity}
                              />
                            </td>
                          <td>{productService.formatPrice(product.price * product.quantity)}</td>
                            <td>
                              <button
                              className="product-remove-button"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                              Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  <div className="create-order-total">
                    <span>Total</span>
                    <span>{productService.formatPrice(totalAmount)}</span>
                  </div>
                </div>
              )}

              <div className="create-order-actions">
                <button
                  className="order-cancel-button"
                  onClick={() => setActiveTab('1')}
                  type="button"
                >
                  Back
                      </button>
                <button
                  className="order-create-button"
                  onClick={() => selectedProducts.length > 0 && setActiveTab('3')}
                  type="button"
                  disabled={selectedProducts.length === 0}
                >
                  Continue
                      </button>
              </div>
            </div>
          )}

          {activeTab === '3' && (
            <div>
              {(selectedCustomer || isNewCustomer) && (
                <div className="selected-customer">
                  <h3>Customer</h3>
                  <div className="customer-info">
                    {selectedCustomer ? (
                      <>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Username</p>
                          <p>{selectedCustomer.username}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Full Name</p>
                          <p>{selectedCustomer.fullName}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Email</p>
                          <p>{selectedCustomer.email}</p>
                        </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Phone Number</p>
                          <p>{selectedCustomer.phoneNumber || 'N/A'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Username</p>
                          <p>{newCustomerForm.username}</p>
                </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Full Name</p>
                          <p>{newCustomerForm.fullName}</p>
                    </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Email</p>
                          <p>{newCustomerForm.email}</p>
                    </div>
                        <div className="customer-info-item">
                          <p className="customer-info-label">Phone Number</p>
                          <p>{newCustomerForm.phoneNumber || 'N/A'}</p>
                    </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="create-order-selected-products">
                <h3>Order Items</h3>
                <table className="create-order-cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{productService.formatPrice(product.price)}</td>
                        <td>{product.quantity}</td>
                        <td>{productService.formatPrice(product.price * product.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="create-order-total">
                  <span>Total</span>
                  <span>{productService.formatPrice(totalAmount)}</span>
                </div>
                    </div>

              <div className="create-order-summary">
                <h3>Order Details</h3>
                <form onSubmit={handleCreateOrder}>
                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Shipping Address*</label>
                      <input 
                      type="text"
                      className="create-order-form-input"
                      name="shippingAddress"
                      value={formValues.shippingAddress}
                        onChange={handleInputChange}
                      />
                    {formErrors.shippingAddress && (
                      <div className="create-order-error-message">{formErrors.shippingAddress}</div>
                    )}
                  </div>

                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Order Status</label>
                    <select
                      className="create-order-form-input"
                      name="status"
                      value={formValues.status}
                      onChange={handleInputChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                    </select>
                </div>

                  <div className="create-order-payment-options">
                    <label className="create-order-form-label">Payment Method</label>
                    <div className="create-order-payment-option">
                      <input 
                        type="radio" 
                        id="cashOnDelivery"
                        name="paymentMethod" 
                        value="CashOnDelivery" 
                        checked={formValues.paymentMethod === 'CashOnDelivery'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="cashOnDelivery">Cash On Delivery</label>
                    </div>
                    <div className="create-order-payment-option">
                      <input 
                        type="radio" 
                        id="bankTransfer"
                        name="paymentMethod" 
                        value="BankTransfer"
                        checked={formValues.paymentMethod === 'BankTransfer'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="bankTransfer">Bank Transfer</label>
                    </div>
                    <div className="create-order-payment-option">
                      <input 
                        type="radio" 
                        id="creditCard"
                        name="paymentMethod" 
                        value="CreditCard"
                        checked={formValues.paymentMethod === 'CreditCard'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="creditCard">Credit Card</label>
                    </div>
                    <div className="create-order-payment-option">
                      <input 
                        type="radio" 
                        id="eWallet"
                        name="paymentMethod" 
                        value="EWallet" 
                        checked={formValues.paymentMethod === 'EWallet'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="eWallet">E-Wallet</label>
                  </div>
                </div>

                  <div className="create-order-form-group">
                    <label className="create-order-form-label">Payment Status</label>
                    <select
                      className="create-order-form-input"
                      name="paymentStatus"
                      value={formValues.paymentStatus}
                      onChange={handleInputChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                </div>

                  <div className="create-order-actions">
                    <button
                      className="order-cancel-button"
                      onClick={() => setActiveTab('2')}
                      type="button"
                    >
                      Back
                  </button>
                  {createdOrder && formValues.status === 'Delivered' && formValues.paymentStatus === 'Paid' && (
                    <button 
                      className="print-bill-button"
                      onClick={handlePrintBill}
                      type="button"
                    >
                      <PrinterIcon className="print-icon" />
                      Print Bill
                    </button>
                  )}
                  {!createdOrder && (
                    <button 
                      className="order-create-button"
                    type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner"></span>
                          <span style={{ marginLeft: '8px' }}>Creating...</span>
                        </>
                      ) : (
                        'Create Order'
                      )}
                    </button>
                  )}
                  {createdOrder && (
                    <button
                      className="order-create-button"
                      onClick={() => navigate('/orders')}
                      type="button"
                    >
                      Go to Orders
                    </button>
                  )}
                </div>
              </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInStoreOrder; 