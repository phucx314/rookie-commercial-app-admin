import React from 'react';
import { CustomerInfo } from './CustomerInfo';
import productService from '../../../services/product.service';

const CheckoutTab = ({
  selectedCustomer,
  isNewCustomer,
  newCustomerForm,
  selectedProducts,
  totalAmount,
  formValues,
  formErrors,
  handleInputChange,
  handleCreateOrder,
  loading,
  setActiveTab
}) => {
  return (
    <div>
      <CustomerInfo 
        selectedCustomer={selectedCustomer}
        isNewCustomer={isNewCustomer}
        newCustomerForm={newCustomerForm}
      />

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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutTab; 