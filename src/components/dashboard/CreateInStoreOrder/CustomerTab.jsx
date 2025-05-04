import React from 'react';

const CustomerTab = ({
  searchTerm,
  setSearchTerm,
  handleSearchCustomers,
  customers,
  handleSelectCustomer,
  newCustomerForm,
  newCustomerErrors,
  handleNewCustomerChange,
  handleSubmitNewCustomer
}) => {
  return (
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
  );
};

export default CustomerTab; 