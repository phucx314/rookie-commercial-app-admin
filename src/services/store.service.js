import axios from '../api/axios';

class StoreService {
    async getAllStores(params = {}) {
        try {
            const response = await axios.get('/Store', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getPaginatedStores(pageIndex = 1, pageSize = 12, status = 'all', searchTerm = '', sortBy = 'Name', sortDirection = 'asc') {
        try {
            // Đảm bảo các tham số không bao giờ null hoặc undefined và đúng casing (PascalCase) cho .NET
            const params = { 
                PageIndex: pageIndex || 1, 
                PageSize: pageSize || 12, 
                status: status || 'all',
                search: searchTerm || '',
                SortBy: sortBy || 'Name',
                SortDirection: sortDirection || 'asc'
            };
            
            console.log('Gọi API với tham số:', params);
            
            const response = await axios.get('/Store/paged', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching paginated stores:', error);
            throw error;
        }
    }

    async searchStores(searchTerm = '', pageIndex = 1, pageSize = 12, status = 'all', sortBy = 'Name', sortDirection = 'asc') {
        try {
            // Đảm bảo các tham số không bao giờ null hoặc undefined
            return await this.getPaginatedStores(
                pageIndex || 1, 
                pageSize || 12, 
                status || 'all', 
                searchTerm || '',
                sortBy || 'Name',
                sortDirection || 'asc'
            );
        } catch (error) {
            console.error('Error searching stores:', error);
            throw error;
        }
    }

    async getStoreById(id) {
        try {
            const response = await axios.get(`/Store/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getSellerInfo(sellerId) {
        try {
            const response = await axios.get(`/User/${sellerId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching seller info:', error);
            return null;
        }
    }

    async createStore(storeData) {
        try {
            const response = await axios.post('/Store', storeData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateStore(id, storeData) {
        try {
            const response = await axios.put(`/Store/${id}`, storeData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async deleteStore(id) {
        try {
            const response = await axios.delete(`/Store/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Các hàm xử lý dữ liệu
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getSortedStores(stores, sortConfig) {
        if (!sortConfig.key) return stores;

        return [...stores].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Hàm tạo shipping address mặc định dựa trên thông tin store
    createDefaultShippingAddress(store) {
        if (!store) return 'At store';
        
        // Nếu có địa chỉ cửa hàng, sử dụng nó
        if (store.address) {
            return `At store ${store.name}: ${store.address}`;
        }
        
        // Nếu không có địa chỉ, chỉ dùng tên cửa hàng
        return `At store ${store.name}`;
    }

    // Hàm mới thêm vào
    async getStoreStats(storeId) {
        try {
            const response = await axios.get(`/Store/${storeId}/stats`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching stats for store ${storeId}:`, error);
            // Trả về giá trị mặc định nếu API lỗi
            return { totalProducts: 0, totalOrders: 0, totalRevenue: 0 };
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Hàm lấy danh sách người dùng có vai trò Seller
    async getSellersList() {
        try {
            // Tạo đối tượng SearchUserDto với tham số role=Seller
            const searchParams = {
                searchTerm: '',
                pageIndex: 1,
                pageSize: 100,
                role: 'Seller'  // Chỉ định cụ thể role là Seller
            };
            
            // Gọi API search-paged với tham số role=Seller
            const response = await axios.get('/User/search-paged', { 
                params: searchParams
            });
            
            // Lọc để chỉ lấy những user có role là Seller
            const sellersList = response.data.items.filter(user => 
                user.role === 'Seller' && user.isActive
            );
            
            console.log('Fetched sellers list:', sellersList);
            return sellersList;
        } catch (error) {
            console.error('Error fetching sellers list:', error);
            // Trả về mảng rỗng nếu lỗi
            return [];
        }
    }
}

export default new StoreService(); 