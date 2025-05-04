import React from 'react';
import { CustomerInfo } from './CustomerInfo';
import productService from '../../../services/product.service';

const ProductsTab = ({
  selectedCustomer,
  isNewCustomer,
  newCustomerForm,
  productSearchTerm,
  setProductSearchTerm,
  handleSearchProducts,
  products,
  productQuantities,
  setProductQuantities,
  handleAddToCart,
  selectedProducts,
  handleChangeQuantity,
  handleRemoveProduct,
  totalAmount,
  setActiveTab
}) => {
  return (
    <div>
      <CustomerInfo 
        selectedCustomer={selectedCustomer}
        isNewCustomer={isNewCustomer}
        newCustomerForm={newCustomerForm}
      />

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
                  <td>{product.category?.name || product.categoryName || 'N/A'}</td>
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
  );
};

export default ProductsTab; 