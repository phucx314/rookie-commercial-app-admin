import axios from '../api/axios';

class OrderService {
    async getAllOrders(params = {}) {
        try {
            const response = await axios.get('/orders', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getOrderById(id) {
        try {
            const response = await axios.get(`/orders/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            const response = await axios.post('/orders', orderData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateOrderStatus(id, status) {
        try {
            const response = await axios.patch(`/orders/${id}/status`, { status });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async deleteOrder(id) {
        try {
            const response = await axios.delete(`/orders/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new OrderService(); 