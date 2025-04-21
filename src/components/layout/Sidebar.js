import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  TagIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import './Sidebar.css';
import axios from '../../api/axios';
import ThemeSwitch from '../common/ThemeSwitch';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));

  const menuItems = [
    { path: '/dashboard', name: 'Home', icon: HomeIcon },
    { path: '/categories', name: 'Categories', icon: TagIcon },
    { path: '/products', name: 'Products', icon: ShoppingBagIcon },
    { path: '/stores', name: 'Stores', icon: BuildingStorefrontIcon },
    { path: '/sellers', name: 'Sellers', icon: UsersIcon },
    { path: '/customers', name: 'Customers', icon: UserIcon },
  ];

  const handleLogout = async () => {
    try {
      await axios.post('/Auth/logout');
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear session storage and redirect even if API call fails
      sessionStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="logo">
          <Link to="/dashboard">
            <img src="https://media.istockphoto.com/id/1355944902/vi/vec-to/m%E1%BA%ABu-thi%E1%BA%BFt-k%E1%BA%BF-d%E1%BA%A5u-hi%E1%BB%87u-ch%E1%BB%AF-e-bi%E1%BB%83u-t%C6%B0%E1%BB%A3ng-vector-%C4%91%E1%BA%A7y-m%C3%A0u-s%E1%BA%AFc-hi%E1%BB%87n-%C4%91%E1%BA%A1i.jpg?s=612x612&w=0&k=20&c=WoBP6FdETYS1Mf9M_jIAnko6q9x6hZao2mw1aMCSFYg=" alt="Logo" />
            <span>Ecom Admin</span>
          </Link>
        </div>

        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <Icon className="menu-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="user-section">
          <div className="user-info">
            <div className="user-email">{user?.email}</div>
            <div className="user-role">Administrator</div>
          </div>
          <div className="theme-switch-container">
            <ThemeSwitch />
          </div>
          <button onClick={handleLogout} className="logout-button">
            <ArrowRightOnRectangleIcon className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 