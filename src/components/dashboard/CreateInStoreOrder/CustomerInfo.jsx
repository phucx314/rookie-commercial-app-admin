import React from 'react';

export const CustomerInfo = ({ selectedCustomer, isNewCustomer, newCustomerForm }) => {
  if (!selectedCustomer && !isNewCustomer) return null;

  return (
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
  );
}; 