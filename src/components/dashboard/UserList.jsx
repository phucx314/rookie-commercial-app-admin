import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { toastService } from '../../services';
import axios from '../../api/axios';
import './UserList.css';

const UserList = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ 
    key: searchParams.get('sortBy') || null, 
    direction: searchParams.get('sortDir') || 'asc' 
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Pagination states
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('pageSize')) || 10,
    totalCount: 0,
    totalPages: 0
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (pagination.pageIndex !== 1) {
      params.set('page', pagination.pageIndex);
    }
    
    if (pagination.pageSize !== 10) {
      params.set('pageSize', pagination.pageSize);
    }
    
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    
    if (sortConfig.key) {
      params.set('sortBy', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }
    
    // Update URL without causing a navigation/reload
    setSearchParams(params);
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, sortConfig, setSearchParams]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [pagination.pageIndex, pagination.pageSize, sortConfig]);

  // Check URL params on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
    
    const pageFromUrl = searchParams.get('page');
    const pageSizeFromUrl = searchParams.get('pageSize');
    if (pageFromUrl || pageSizeFromUrl) {
      setPagination(prev => ({
        ...prev,
        pageIndex: pageFromUrl ? parseInt(pageFromUrl) : prev.pageIndex,
        pageSize: pageSizeFromUrl ? parseInt(pageSizeFromUrl) : prev.pageSize
      }));
    }
    
    const sortByFromUrl = searchParams.get('sortBy');
    const sortDirFromUrl = searchParams.get('sortDir');
    if (sortByFromUrl) {
      setSortConfig({
        key: sortByFromUrl,
        direction: sortDirFromUrl || 'asc'
      });
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Tạo URL với tham số tìm kiếm nếu có
      let url = '/user';
      if (searchTerm) {
        url = `/user/search?search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await axios.get(url);
      const data = response.data;
      
      // Process the data to ensure isActive field exists (default to true if missing)
      const processedData = data.map(user => ({
        ...user,
        isActive: user.isActive !== undefined ? user.isActive : true // Default to active if not provided
      }));
      
      // Apply sorting
      const sortedData = getSortedUsers(processedData);
      
      // Apply pagination
      const totalCount = sortedData.length;
      const totalPages = Math.ceil(totalCount / pagination.pageSize);
      
      const startIndex = (pagination.pageIndex - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedItems = sortedData.slice(startIndex, endIndex);
      
      setUsers(paginatedItems);
      setPagination({
        ...pagination,
        totalCount,
        totalPages
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toastService.error('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Searching users with term: "${searchTerm}"`);
    
    // Reset to page 1 when searching
    setPagination({
      ...pagination,
      pageIndex: 1
    });
    
    fetchUsers();
  };

  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      pageIndex: newPage
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedUsers = (userData) => {
    if (!sortConfig.key) return userData;
    
    return [...userData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUpIcon className="sort-icon" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="sort-icon active" />
      : <ChevronDownIcon className="sort-icon active" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleUserStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      await toastService.promise(
        axios.patch(`/user/${id}/isactive`, { isActive: newStatus }),
        {
          pending: `${newStatus ? 'Activating' : 'Deactivating'} user...`,
          success: `User ${newStatus ? 'activated' : 'deactivated'} successfully!`,
          error: `Failed to ${newStatus ? 'activate' : 'deactivate'} user.`
        }
      );
      
      // Update local state
      setUsers(users.map(user => 
        user.id === id 
          ? { ...user, isActive: newStatus } 
          : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await toastService.promise(
          axios.delete(`/user/${id}`),
          {
            pending: 'Deleting user...',
            success: 'User deleted successfully!',
            error: 'Failed to delete user.'
          }
        );
        
        // Refresh user list
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'badge-admin';
      case 'Seller':
        return 'badge-seller';
      case 'Customer':
      default:
        return 'badge-customer';
    }
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-list">
      <div className="user-header">
        <h1>Users</h1>
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-form-inline">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button-inside">
                <MagnifyingGlassIcon className="search-icon" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('username')} className="sortable">
                Username {renderSortIcon('username')}
              </th>
              <th onClick={() => handleSort('email')} className="sortable">
                Email {renderSortIcon('email')}
              </th>
              <th onClick={() => handleSort('fullName')} className="sortable">
                Full Name {renderSortIcon('fullName')}
              </th>
              <th onClick={() => handleSort('role')} className="sortable">
                Role {renderSortIcon('role')}
              </th>
              <th onClick={() => handleSort('isActive')} className="sortable">
                Status {renderSortIcon('isActive')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.fullName}</td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="user-actions">
                    <button
                      className={`status-toggle-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.isActive ? (
                        <XCircleIcon />
                      ) : (
                        <CheckCircleIcon />
                      )}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={pagination.pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
      
      <div className="pagination-info">
        Showing {users.length} of {pagination.totalCount} users
        | Page {pagination.pageIndex} of {pagination.totalPages || 1}
        <div className="page-size-selector">
          <label htmlFor="user-page-size-select">Items/page:</label>
          <select 
            id="user-page-size-select"
            value={pagination.pageSize}
            onChange={(e) => {
              setPagination({
                ...pagination,
                pageSize: parseInt(e.target.value),
                pageIndex: 1 // Reset to page 1 when changing items per page
              });
            }}
            className="page-size-select"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserList; 