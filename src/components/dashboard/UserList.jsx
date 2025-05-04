import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon
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

  // State cho modal tạo user mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    address: ''
  });
  
  // Thêm state cho chức năng tìm kiếm user
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [selectedExistingUser, setSelectedExistingUser] = useState(null);
  const [userSearchMode, setUserSearchMode] = useState(false); // true = tìm kiếm, false = tạo mới

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
  }, [pagination.pageIndex, pagination.pageSize]);

  // Thêm effect riêng cho sortConfig
  useEffect(() => {
    if (sortConfig.key && users.length > 0) {
      // Sắp xếp dữ liệu hiện tại mà không cần gọi API lại
      const sortedData = getSortedUsers([...users]);
      setUsers(sortedData);
    }
  }, [sortConfig]);

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
      
      // Sử dụng API phân trang từ server
      let url;
      
      if (searchTerm) {
        // Nếu có từ khóa tìm kiếm thì dùng API search có phân trang
        url = `/user/search-paged?pageIndex=${pagination.pageIndex}&pageSize=${pagination.pageSize}&searchTerm=${encodeURIComponent(searchTerm)}`;
      } else {
        // Không có từ khóa tìm kiếm thì dùng API phân trang thông thường
        url = `/user/page?pageIndex=${pagination.pageIndex}&pageSize=${pagination.pageSize}`;
      }
      
      console.log(`Fetching users from: ${url}`);
      const response = await axios.get(url);
      const data = response.data;
      
      if (!data || !data.items) {
        console.error('Invalid response format:', data);
        toastService.error('Định dạng phản hồi không hợp lệ');
        setUsers([]);
        return;
      }
      
      // Cập nhật dữ liệu người dùng và thông tin phân trang
      setUsers(data.items);
      setPagination({
        ...pagination,
        totalCount: data.totalCount,
        totalPages: data.totalPages || Math.ceil(data.totalCount / pagination.pageSize)
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Nếu API phân trang lỗi, fallback về cách cũ
      if (error.response && error.response.status === 400) {
        console.log('Failed to use pagination API, falling back to old method');
        await fetchAllUsers();
      } else {
        toastService.error('Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phương thức fallback lấy tất cả users nếu API phân trang lỗi
  const fetchAllUsers = async () => {
    try {
      let url = '/user';
      if (searchTerm) {
        url = `/user/search?search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await axios.get(url);
      const data = response.data;
      
      // Process the data to ensure isActive field exists
      const processedData = data.map(user => ({
        ...user,
        isActive: user.isActive !== undefined ? user.isActive : true
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
      console.error('Error in fallback fetch:', error);
      toastService.error('Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.');
      setUsers([]);
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

  // Hàm xử lý tạo người dùng mới với role Seller
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (selectedExistingUser) {
        // Trường hợp đổi role của người dùng đã tồn tại
        await toastService.promise(
          axios.patch(`/user/${selectedExistingUser.id}/role`, { 
            role: 'Seller',
            reason: 'Assigned as Seller by Admin'
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          {
            pending: 'Changing user role to Seller...',
            success: 'User role changed to Seller successfully!',
            error: 'Failed to change user role.'
          }
        );
      } else {
        // Tạo người dùng mới
        // Tạo đối tượng gửi đi
        const createUserDto = {
          ...newUser,
          role: 'Seller' // Gán cố định role là Seller
        };
        
        // Gọi API tạo người dùng mới
        await toastService.promise(
          axios.post('/user', createUserDto),
          {
            pending: 'Creating new seller account...',
            success: 'Seller account created successfully!',
            error: 'Failed to create seller account.'
          }
        );
      }
      
      // Đóng modal và reset form
      setIsCreateModalOpen(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        address: ''
      });
      setSelectedExistingUser(null);
      setUserSearchTerm('');
      setUserSearchResults([]);
      setUserSearchMode(false);
      
      // Tải lại danh sách user
      fetchUsers();
    } catch (error) {
      console.error('Error handling user:', error);
      if (error.response && error.response.data) {
        // In chi tiết về lỗi từ server để debug
        console.error('Server error details:', error.response.data);
        // Hiển thị thông báo lỗi chi tiết hơn
        if (error.response.data.message) {
          toastService.error(`Operation failed: ${error.response.data.message}`);
        } else if (typeof error.response.data === 'string') {
          toastService.error(`Operation failed: ${error.response.data}`);
        } else {
          toastService.error('Failed to create or update user. Please check console for details.');
        }
      } else {
        toastService.error(`Operation failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Hàm xử lý thay đổi giá trị form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm tìm kiếm người dùng đã tồn tại
  const handleSearchExistingUser = async () => {
    if (!userSearchTerm) return;
    
    try {
      setIsSearchingUser(true);
      
      // Gọi API tìm kiếm người dùng
      const response = await axios.get(`/user/search?search=${encodeURIComponent(userSearchTerm)}`);
      
      if (response.data && Array.isArray(response.data)) {
        setUserSearchResults(response.data);
      } else {
        setUserSearchResults([]);
        toastService.warning('No users found or invalid response format');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toastService.error('Failed to search for users');
      setUserSearchResults([]);
    } finally {
      setIsSearchingUser(false);
    }
  };
  
  // Hàm chọn người dùng từ kết quả tìm kiếm
  const handleSelectExistingUser = (user) => {
    setSelectedExistingUser(user);
    setUserSearchResults([]);
    setUserSearchTerm('');
  };
  
  // Hàm chuyển đổi giữa chế độ tìm kiếm và tạo mới
  const toggleUserSearchMode = () => {
    setUserSearchMode(!userSearchMode);
    // Reset các state liên quan khi chuyển chế độ
    setUserSearchTerm('');
    setUserSearchResults([]);
    setSelectedExistingUser(null);
    if (!userSearchMode) {
      // Chuyển từ tạo mới sang tìm kiếm, reset form tạo mới
      setNewUser({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        address: ''
      });
    }
  };
  
  // Hủy chọn người dùng đã tồn tại
  const clearSelectedUser = () => {
    setSelectedExistingUser(null);
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-list">
      <div className="user-header">
        <h1>Users</h1>
        <div className="header-actions">
          <button 
            className="create-user-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <UserPlusIcon className="w-5 h-5" />
            Create Seller
          </button>
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

      {/* Modal tạo người dùng mới */}
      {isCreateModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{userSearchMode ? 'Find Existing User' : 'Create Seller Account'}</h2>
            <div className="modal-form-content">
              <div className="toggle-mode-container">
                <button 
                  type="button" 
                  className={`toggle-mode-btn ${!userSearchMode ? 'active' : ''}`}
                  onClick={() => !userSearchMode ? null : toggleUserSearchMode()}
                >
                  Create New
                </button>
                <button 
                  type="button" 
                  className={`toggle-mode-btn ${userSearchMode ? 'active' : ''}`}
                  onClick={() => userSearchMode ? null : toggleUserSearchMode()}
                >
                  Find Existing
                </button>
              </div>
              
              {selectedExistingUser ? (
                <div className="selected-user-container">
                  <div className="selected-user-info">
                    <h3>Selected User</h3>
                    <p><strong>Username:</strong> {selectedExistingUser.username}</p>
                    <p><strong>Email:</strong> {selectedExistingUser.email}</p>
                    <p><strong>Full Name:</strong> {selectedExistingUser.fullName}</p>
                    <p><strong>Current Role:</strong> <span className={`role-badge badge-${selectedExistingUser.role.toLowerCase()}`}>{selectedExistingUser.role}</span></p>
                    <p className="role-change-note">This user's role will be changed to <span className="role-badge badge-seller">Seller</span></p>
                  </div>
                  <button type="button" className="clear-selection-btn" onClick={clearSelectedUser}>
                    Clear Selection
                  </button>
                </div>
              ) : userSearchMode ? (
                <div className="search-user-container">
                  <div className="search-user-input">
                    <input
                      type="text"
                      placeholder="Search by username or email"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="search-user-btn"
                      onClick={handleSearchExistingUser}
                      disabled={isSearchingUser || !userSearchTerm}
                    >
                      {isSearchingUser ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  
                  {userSearchResults.length > 0 && (
                    <div className="search-results">
                      <h3>Search Results</h3>
                      <div className="search-results-list">
                        {userSearchResults.map(user => (
                          <div 
                            key={user.id} 
                            className="search-result-item"
                            onClick={() => handleSelectExistingUser(user)}
                          >
                            <div className="user-info">
                              <div className="user-name">{user.username}</div>
                              <div className="user-email">{user.email}</div>
                            </div>
                            <div className="user-role">
                              <span className={`role-badge badge-${user.role.toLowerCase()}`}>
                                {user.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userSearchResults.length === 0 && userSearchTerm && !isSearchingUser && (
                    <div className="no-results">No users found with that search term</div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreateUser}>
                  <div className="form-group">
                    <label htmlFor="username">Username <span className="required">*</span></label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={newUser.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter username"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password <span className="required">*</span></label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter password"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={newUser.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={newUser.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={newUser.address}
                      onChange={handleInputChange}
                      placeholder="Enter address"
                    />
                  </div>
                </form>
              )}
            </div>
            
            <div className="modal-actions">
              <button type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
              <button 
                type="button" 
                onClick={handleCreateUser}
                disabled={
                  (!userSearchMode && (!newUser.username || !newUser.email || !newUser.password || !newUser.fullName)) || 
                  (userSearchMode && !selectedExistingUser)
                }
              >
                {selectedExistingUser ? 'Change to Seller' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList; 