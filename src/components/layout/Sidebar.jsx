import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../../services';
import ThemeSwitch from '../common/ThemeSwitch';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Store', href: '/stores', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Product', href: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'Category', href: '/categories', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { name: 'Order', href: '/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

const Sidebar = () => {
    const location = useLocation();
    
    const handleLogout = () => {
        authService.logout();
        window.location.href = '/login';
    };

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <div className="flex-1 flex flex-col min-h-0 bg-gray-800 dark:bg-gray-900">
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center justify-between flex-shrink-0 px-4">
                        <img
                            className="h-8 w-auto"
                            src="/logo.svg"
                            alt="Logo"
                        />
                        <ThemeSwitch />
                    </div>
                    <nav className="mt-5 flex-1 px-2 space-y-1">
                        {navigation.map((item) => {
                            const current = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                                        group flex items-center px-2 py-2 text-sm font-medium rounded-md
                                        ${current
                                            ? 'bg-gray-900 text-white dark:bg-gray-800'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }
                                    `}
                                >
                                    <svg
                                        className={`
                                            mr-3 flex-shrink-0 h-6 w-6
                                            ${current
                                                ? 'text-gray-300'
                                                : 'text-gray-400 group-hover:text-gray-300'
                                            }
                                        `}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d={item.icon}
                                        />
                                    </svg>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex bg-gray-700 dark:bg-gray-800 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex-shrink-0 w-full group block"
                    >
                        <div className="flex items-center">
                            <div>
                                <svg
                                    className="text-gray-300 group-hover:text-gray-100 h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-300 group-hover:text-gray-100">
                                    Logout
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 