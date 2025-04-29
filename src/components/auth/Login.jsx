import React from 'react';
import LoginForm from './LoginForm/LoginForm';
import { useLogin } from '../../hooks/useLogin';
import './Login.css';

const Login = () => {
  const { formData, loading, handleChange, handleSubmit } = useLogin();

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>ECOM ADMIN</h1>
        <h2>Login</h2>
        <LoginForm 
          formData={formData}
          loading={loading}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default Login; 