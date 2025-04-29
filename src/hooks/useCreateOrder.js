import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/order.service';
import productService from '../services/product.service';
import { toastService } from '../services';

export const useCreateOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  
  // Form states
  const [formValues, setFormValues] = useState({
    shippingAddress: '',
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'CashOnDelivery',
  });
  const [formErrors, setFormErrors] = useState({});

  // Customer states
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    address: '',
  });
  const [newCustomerErrors, setNewCustomerErrors] = useState({});

  // Product states
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);

  // Load initial products
  useEffect(() => {
    loadInitialProducts();
  }, []);

  // Calculate total when selected products change
  useEffect(() => {
    calculateTotal();
  }, [selectedProducts]);

  const loadInitialProducts = async () => {
    try {
      const data = await productService.getAllProducts();
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
      setProducts(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Error searching products', error);
      setProducts([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setActiveTab('2');
  };

  const handleAddToCart = (product) => {
    const quantity = parseInt(productQuantities[product.id]) || 1;
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      const updatedProducts = selectedProducts.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
      );
      setSelectedProducts(updatedProducts);
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity }]);
    }
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
    setFormValues(prev => ({
      ...prev,
      totalAmount: total
    }));
  };

  const validateNewCustomerForm = () => {
    const errors = {};
    if (!newCustomerForm.username) errors.username = 'Username is required';
    if (!newCustomerForm.email) errors.email = 'Email is required';
    if (newCustomerForm.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(newCustomerForm.email)) {
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
      setActiveTab('2');
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
      let statusInt = 0;
      switch(formValues.status) {
        case 'Processing': statusInt = 1; break;
        case 'Shipped': statusInt = 2; break;
        case 'Delivered': statusInt = 3; break;
        case 'Cancelled': statusInt = 4; break;
        case 'Returned': statusInt = 5; break;
        default: statusInt = 3;
      }
      
      let paymentStatusInt = 0;
      switch(formValues.paymentStatus) {
        case 'Paid': paymentStatusInt = 1; break;
        case 'Failed': paymentStatusInt = 2; break;
        case 'Refunded': paymentStatusInt = 3; break;
        default: paymentStatusInt = 1;
      }
      
      let paymentMethodInt = 0;
      switch(formValues.paymentMethod) {
        case 'BankTransfer': paymentMethodInt = 1; break;
        case 'CreditCard': paymentMethodInt = 2; break;
        case 'EWallet': paymentMethodInt = 3; break;
        default: paymentMethodInt = 0;
      }

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

      if (isNewCustomer) {
        orderData.customer = {
          username: newCustomerForm.username,
          email: newCustomerForm.email,
          fullName: newCustomerForm.fullName,
          phoneNumber: newCustomerForm.phoneNumber || '',
          address: newCustomerForm.address || ''
        };
      } else {
        orderData.customerId = selectedCustomer.id;
      }

      await orderService.createInStoreOrder(orderData);
      toastService.success('Order created successfully');
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      
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
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return {
    // States
    loading,
    activeTab,
    formValues,
    formErrors,
    customers,
    selectedCustomer,
    isNewCustomer,
    newCustomerForm,
    newCustomerErrors,
    products,
    selectedProducts,
    productQuantities,
    totalAmount,
    searchTerm,
    productSearchTerm,

    // Setters
    setActiveTab,
    setSearchTerm,
    setProductSearchTerm,
    setProductQuantities,

    // Handlers
    handleSearchCustomers,
    handleSearchProducts,
    handleSelectCustomer,
    handleAddToCart,
    handleRemoveProduct,
    handleChangeQuantity,
    handleSubmitNewCustomer,
    handleCreateOrder,
    handleInputChange,
    handleNewCustomerChange
  };
}; 