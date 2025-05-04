import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CustomerTab from './CustomerTab';
import ProductsTab from './ProductsTab';
import CheckoutTab from './CheckoutTab';
import { useCreateOrder } from '../../../hooks/useCreateOrder';
import './CreateInStoreOrder.css';

const CreateInStoreOrder = () => {
  const navigate = useNavigate();
  const {
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
    setActiveTab,
    setSearchTerm,
    setProductSearchTerm,
    setProductQuantities,
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
  } = useCreateOrder();

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
            <CustomerTab 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearchCustomers={handleSearchCustomers}
              customers={customers}
              handleSelectCustomer={handleSelectCustomer}
              newCustomerForm={newCustomerForm}
              newCustomerErrors={newCustomerErrors}
              handleNewCustomerChange={handleNewCustomerChange}
              handleSubmitNewCustomer={handleSubmitNewCustomer}
            />
          )}

          {activeTab === '2' && (
            <ProductsTab 
              selectedCustomer={selectedCustomer}
              isNewCustomer={isNewCustomer}
              newCustomerForm={newCustomerForm}
              productSearchTerm={productSearchTerm}
              setProductSearchTerm={setProductSearchTerm}
              handleSearchProducts={handleSearchProducts}
              products={products}
              productQuantities={productQuantities}
              setProductQuantities={setProductQuantities}
              handleAddToCart={handleAddToCart}
              selectedProducts={selectedProducts}
              handleChangeQuantity={handleChangeQuantity}
              handleRemoveProduct={handleRemoveProduct}
              totalAmount={totalAmount}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === '3' && (
            <CheckoutTab 
              selectedCustomer={selectedCustomer}
              isNewCustomer={isNewCustomer}
              newCustomerForm={newCustomerForm}
              selectedProducts={selectedProducts}
              totalAmount={totalAmount}
              formValues={formValues}
              formErrors={formErrors}
              handleInputChange={handleInputChange}
              handleCreateOrder={handleCreateOrder}
              loading={loading}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInStoreOrder; 