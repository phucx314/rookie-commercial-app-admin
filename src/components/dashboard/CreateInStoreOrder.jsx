import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setProducts(data);
    } catch (error) {
      console.error('Unable to load product list', error);
    }
  };

  const handleSearchCustomers = async () => {
    if (!searchTerm) return;

    try {
      const searchParams = {};
      
      if (searchTerm.includes('@')) {
        searchParams.email = searchTerm;
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
      setProducts(data);
    } catch (error) {
      console.error('Error searching products', error);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setActiveTab('2'); // Switch to products tab
  };

  const handleAddToCart = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    
    if (existingProduct) {
      // Increase quantity if product already in cart
      const updatedProducts = selectedProducts.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      );
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
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
        // Backend has been updated to not require the Customer field anymore
        orderData.customerId = selectedCustomer.id;
      }

      console.log('Sending order data:', orderData);
      await orderService.createInStoreOrder(orderData);
      toastService.success('Order created successfully');
      navigate('/orders');
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

  return (
    <div className="create-order-container">
      <div className="create-order-header">
        <h1>Create In-Store Order</h1>
        <p>Enter order information and select products to create a new order</p>
      </div>

      <div className="order-tabs">
        <div className="tab-list">
          <div 
            className={`tab-item ${activeTab === '1' ? 'active' : ''}`} 
            onClick={() => setActiveTab('1')}
          >
            1. Select Customer
          </div>
          <div 
            className={`tab-item ${activeTab === '2' ? 'active' : ''}`} 
            onClick={() => setActiveTab('2')}
          >
            2. Select Products
          </div>
          <div 
            className={`tab-item ${activeTab === '3' ? 'active' : ''}`} 
            onClick={() => setActiveTab('3')}
          >
            3. Confirm Order
          </div>
        </div>

        <div className="tab-content">
          {activeTab === '1' && (
            <>
              <div className="search-section">
                <h2>Search Existing Customers</h2>
                <div className="search-bar">
                  <input
                    type="text"
                    className="create-order-search-input"
                    placeholder="Search by username or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-button" onClick={handleSearchCustomers}>
                    🔍 Search
                  </button>
                </div>

                {customers.length > 0 && (
                  <div className="customer-search-results">
                    <table className="customer-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Full Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map(customer => (
                          <tr key={customer.id}>
                            <td>{customer.username}</td>
                            <td>{customer.email}</td>
                            <td>{customer.fullName}</td>
                            <td>
                              <button 
                                className="select-button"
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
              </div>

              <hr className="divider" />
              <div className="divider-text">    </div>

              <div className="search-section">
                <h2>Create New Customer</h2>
                <form onSubmit={handleSubmitNewCustomer}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input 
                      type="text"
                      className="form-input"
                      name="username"
                      value={newCustomerForm.username}
                      onChange={handleNewCustomerChange}
                    />
                    {newCustomerErrors.username && <div className="error-message">{newCustomerErrors.username}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email"
                      className="form-input"
                      name="email"
                      value={newCustomerForm.email}
                      onChange={handleNewCustomerChange}
                    />
                    {newCustomerErrors.email && <div className="error-message">{newCustomerErrors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text"
                      className="form-input"
                      name="fullName"
                      value={newCustomerForm.fullName}
                      onChange={handleNewCustomerChange}
                    />
                    {newCustomerErrors.fullName && <div className="error-message">{newCustomerErrors.fullName}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text"
                      className="form-input"
                      name="phoneNumber"
                      value={newCustomerForm.phoneNumber}
                      onChange={handleNewCustomerChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea 
                      className="form-input"
                      name="address"
                      rows="3"
                      value={newCustomerForm.address}
                      onChange={handleNewCustomerChange}
                    ></textarea>
                  </div>

                  <button className="create-customer-button" type="submit">
                    👤 Create New Customer and Continue
                  </button>
                </form>
              </div>
            </>
          )}

          {activeTab === '2' && (
            <>
              <div className="search-section">
                <h2>Search Products</h2>
                <div className="search-bar">
                  <input
                    type="text"
                    className="create-order-search-input"
                    placeholder="Search products by name"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                  <button className="search-button" onClick={handleSearchProducts}>
                    🔍 Search
                  </button>
                </div>

                <div className="create-order-product-list">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>${product.price.toLocaleString()}</td>
                          <td>{product.stockQuantity}</td>
                          <td>
                            <button
                              className="add-button"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stockQuantity <= 0}
                            >
                              ➕ Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="selected-products">
                <h3>Cart</h3>
                {selectedProducts.length > 0 ? (
                  <>
                    <table className="cart-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.map(product => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>${product.price.toLocaleString()}</td>
                            <td>
                              <input
                                type="number"
                                className="quantity-input"
                                min="1"
                                max={product.stockQuantity}
                                value={product.quantity}
                                onChange={(e) => handleChangeQuantity(product.id, parseInt(e.target.value, 10))}
                              />
                            </td>
                            <td>${(product.price * product.quantity).toLocaleString()}</td>
                            <td>
                              <button
                                className="remove-button"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                ❌ Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3}><strong>Total</strong></td>
                          <td><strong>${totalAmount.toLocaleString()}</strong></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="actions">
                      <button className="cancel-button" onClick={() => setActiveTab('1')}>
                        Back
                      </button>
                      <button className="create-button" onClick={() => setActiveTab('3')}>
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <p>No products selected</p>
                )}
              </div>
            </>
          )}

          {activeTab === '3' && (
            <div className="order-summary">
              <h3>Order Information</h3>
              <form onSubmit={handleCreateOrder}>
                <div className="form-group">
                  <label className="form-label">Shipping Address</label>
                  <textarea 
                    className="form-input"
                    name="shippingAddress"
                    rows="3"
                    value={formValues.shippingAddress}
                    onChange={handleInputChange}
                  ></textarea>
                  {formErrors.shippingAddress && <div className="error-message">{formErrors.shippingAddress}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Order Status</label>
                  <div className="payment-options">
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="status-processing" 
                        name="status" 
                        value="Processing" 
                        checked={formValues.status === 'Processing'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="status-processing">Processing</label>
                    </div>
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="status-shipped" 
                        name="status" 
                        value="Shipped" 
                        checked={formValues.status === 'Shipped'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="status-shipped">Shipped</label>
                    </div>
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="status-delivered" 
                        name="status" 
                        value="Delivered" 
                        checked={formValues.status === 'Delivered'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="status-delivered">Delivered</label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <div className="payment-options">
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="payment-status-pending" 
                        name="paymentStatus" 
                        value="Pending" 
                        checked={formValues.paymentStatus === 'Pending'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="payment-status-pending">Pending</label>
                    </div>
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="payment-status-paid" 
                        name="paymentStatus" 
                        value="Paid" 
                        checked={formValues.paymentStatus === 'Paid'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="payment-status-paid">Paid</label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <div className="payment-options">
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="payment-method-cash" 
                        name="paymentMethod" 
                        value="CashOnDelivery" 
                        checked={formValues.paymentMethod === 'CashOnDelivery'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="payment-method-cash">Cash</label>
                    </div>
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="payment-method-card" 
                        name="paymentMethod" 
                        value="CreditCard" 
                        checked={formValues.paymentMethod === 'CreditCard'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="payment-method-card">Credit Card</label>
                    </div>
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="payment-method-bank" 
                        name="paymentMethod" 
                        value="BankTransfer" 
                        checked={formValues.paymentMethod === 'BankTransfer'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="payment-method-bank">Bank Transfer</label>
                    </div>
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="payment-method-ewallet" 
                        name="paymentMethod" 
                        value="EWallet" 
                        checked={formValues.paymentMethod === 'EWallet'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="payment-method-ewallet">E-Wallet</label>
                    </div>
                  </div>
                </div>

                <div className="order-total">
                  <span>Total:</span>
                  <span>${totalAmount.toLocaleString()}</span>
                </div>

                <div className="actions">
                  <button type="button" className="cancel-button" onClick={() => setActiveTab('2')}>
                    Back
                  </button>
                  <button 
                    type="submit"
                    className="create-button" 
                    disabled={selectedProducts.length === 0 || loading}
                  >
                    {loading ? <span className="loading-spinner"></span> : '🛒'} Create Order
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInStoreOrder; 