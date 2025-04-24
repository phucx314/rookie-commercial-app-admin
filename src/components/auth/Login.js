import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { toastService } from '../../services';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', { email: formData.email });
      const response = await axios.post('/Auth/login', formData);
      console.log('Login response:', response.data);
      
      const { token, user, expiration } = response.data;
      
      // Lưu token vào localStorage để giữ người dùng đăng nhập ngay cả khi refresh
      localStorage.setItem('token', token);
      
      // Lưu thông tin phiên làm việc vào sessionStorage
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('expiration', expiration);
      sessionStorage.setItem('lastActivity', new Date().toISOString());
      
      // Hiển thị thông báo thành công
      toastService.success(`Hello, ${user.name || user.email}!`);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      if (err.message === 'Network Error') {
        toastService.error('Cannot connect to server. Please check your network connection and try again.');
      } else {
        toastService.error(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>ECOM ADMIN</h1>
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 