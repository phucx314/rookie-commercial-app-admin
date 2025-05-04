import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OrderList from '../components/dashboard/OrderList';
import CreateInStoreOrderPage from './CreateInStoreOrderPage';

const OrdersView = () => {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path="create" element={<CreateInStoreOrderPage />} />
      {/* Thêm route cho view và edit sau */}
      <Route path=":id" element={<div>Order Details (Coming Soon)</div>} />
      <Route path="edit/:id" element={<div>Edit Order (Coming Soon)</div>} />
    </Routes>
  );
};

export default OrdersView; 