import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  TagIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services';
import ThemeSwitch from '../common/ThemeSwitch';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({
        email: 'admin@example.com',
        role: 'Administrator'
    });
    
    // Lấy thông tin người dùng
    useEffect(() => {
        // Kiểm tra nếu có thông tin user trong sessionStorage
        const sessionUser = sessionStorage.getItem('user');
        
        if (sessionUser) {
            try {
                const userData = JSON.parse(sessionUser);
                if (userData && userData.email) {
                    setUserInfo({
                        email: userData.email,
                        role: userData.role || 'Administrator'
                    });
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            // Nếu không có, kiểm tra xem đã đăng nhập chưa
            const isLoggedIn = authService.isAuthenticated();
            if (!isLoggedIn) {
                // Nếu chưa đăng nhập, chuyển về trang login
                navigate('/login');
            }
        }
    }, [navigate]);
    
    const handleLogout = async () => {
        try {
            authService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Đảm bảo xóa dữ liệu ngay cả khi lỗi
            localStorage.removeItem('token');
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

                <div className="menu">
                    <Link to="/dashboard" className={`menu-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <HomeIcon className="menu-icon" />
                        <span>Dashboard</span>
                    </Link>

                    <Link to="/products" className={`menu-item ${location.pathname === '/products' ? 'active' : ''}`}>
                        <ShoppingBagIcon className="menu-icon" />
                        <span>Products</span>
                    </Link>

                    <Link to="/categories" className={`menu-item ${location.pathname === '/categories' ? 'active' : ''}`}>
                        <TagIcon className="menu-icon" />
                        <span>Categories</span>
                    </Link>

                    <Link to="/stores" className={`menu-item ${location.pathname === '/stores' ? 'active' : ''}`}>
                        <BuildingStorefrontIcon className="menu-icon" />
                        <span>Stores</span>
                    </Link>

                    <Link to="/users" className={`menu-item ${location.pathname === '/users' ? 'active' : ''}`}>
                        <UsersIcon className="menu-icon" />
                        <span>Users</span>
                    </Link>
                    
                    <div className="menu-group">
                        <div className={`menu-item ${location.pathname.includes('/orders') || location.pathname.includes('/create-in-store-order') ? 'active' : ''}`}>
                            <ClipboardDocumentListIcon className="menu-icon" />
                            <span>Orders</span>
                        </div>
                        <div className="submenu">
                            <Link to="/orders" className={`submenu-item ${location.pathname === '/orders' ? 'active' : ''}`}>
                                <span>All Orders</span>
                            </Link>
                            <Link to="/create-in-store-order" className={`submenu-item ${location.pathname === '/create-in-store-order' ? 'active' : ''}`}>
                                <span>Create In-Store Order</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="user-section">
                    <div className="user-info">
                        <div className="user-email">{userInfo.email}</div>
                        <div className="user-role">{userInfo.role}</div>
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