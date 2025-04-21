import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import StoreList from './components/dashboard/StoreList';
import CategoryList from './components/dashboard/CategoryList';
import ProductList from './components/dashboard/ProductList';
import DashboardLayout from './components/layout/DashboardLayout';
import PrivateRoute from './components/auth/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const ProtectedRouteWithLayout = ({ children }) => (
  <PrivateRoute>
    <DashboardLayout>
      {children}
    </DashboardLayout>
  </PrivateRoute>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRouteWithLayout><Dashboard /></ProtectedRouteWithLayout>} />
            <Route path="/stores" element={<ProtectedRouteWithLayout><StoreList /></ProtectedRouteWithLayout>} />
            <Route path="/categories" element={<ProtectedRouteWithLayout><CategoryList /></ProtectedRouteWithLayout>} />
            <Route path="/products" element={<ProtectedRouteWithLayout><ProductList /></ProtectedRouteWithLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
