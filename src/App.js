import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import ProductList from './components/dashboard/ProductList';
import StoreList from './components/dashboard/StoreList';
import CategoryList from './components/dashboard/CategoryList';
import PrivateRoute from './components/common/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            {/* Dashboard - Redirect from / to /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Main Routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="stores" element={<StoreList />} />
            <Route path="products" element={<ProductList />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="orders" element={<div>Orders (Under development)</div>} />
            
            {/* 404 - Not Found */}
            <Route path="*" element={
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">404 - Can not find this page</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">The page you are looking for is under development</p>
              </div>
            } />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
