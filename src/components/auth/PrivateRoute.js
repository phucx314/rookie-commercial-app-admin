import React from 'react';
import { Navigate } from 'react-router-dom';

// Kiểm tra session
const checkSession = () => {
  const token = localStorage.getItem('token');
  const user = sessionStorage.getItem('user');
  const expiration = sessionStorage.getItem('expiration');
  const lastActivity = sessionStorage.getItem('lastActivity');

  if (!token || !user || !expiration || !lastActivity) {
    return false;
  }

  // Kiểm tra thời gian hết hạn
  const expirationDate = new Date(expiration);
  if (expirationDate < new Date()) {
    // Xóa hết thông tin nếu đã hết hạn
    localStorage.removeItem('token');
    sessionStorage.clear();
    return false;
  }

  // Kiểm tra thời gian không hoạt động (ví dụ: 30 phút)
  const lastActivityTime = new Date(lastActivity);
  const inactiveTime = new Date() - lastActivityTime;
  const maxInactiveTime = 30 * 60 * 1000; // 30 phút

  if (inactiveTime > maxInactiveTime) {
    // Xóa hết thông tin nếu không hoạt động quá lâu
    localStorage.removeItem('token');
    sessionStorage.clear();
    return false;
  }

  // Cập nhật thời gian hoạt động cuối
  sessionStorage.setItem('lastActivity', new Date().toISOString());
  return true;
};

const PrivateRoute = ({ children }) => {
  if (!checkSession()) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default PrivateRoute; 