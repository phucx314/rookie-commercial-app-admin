import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Import Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ProductsView from './views/ProductsView';
import ProductDetailView from './views/ProductDetailView';
import StoresView from './views/StoresView';
import CategoriesView from './views/CategoriesView';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginView />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            {/* Dashboard - Redirect from / to /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Main Routes */}
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="stores" element={<StoresView />} />
            <Route path="products" element={<ProductsView />} />
            <Route path="products/:id" element={<ProductDetailView />} />
            <Route path="categories" element={<CategoriesView />} />
            <Route path="orders" element={<div>Orders (Developing)</div>} />
            
            {/* 404 - Not Found */}
            <Route path="*" element={
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">404 - Page not found</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">The page you are looking for does not exist.</p>
              </div>
            } />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="toast-container"
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;
