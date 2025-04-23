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

    async getStoreById(id) {
        try {
            const response = await axios.get(`/Store/${id}`);
            return response.data;
        } catch (error) {
            throw error;
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
}

export default new StoreService(); 