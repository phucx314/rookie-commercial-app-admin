import axios from '../api/axios';
import { toastService } from './toast.service';

class OrderService {
    async getAllOrders() {
        try {
            const response = await axios.get('/order');
            return response.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            toastService.error('Unable to load order list');
            throw error;
        }
    }

    async getOrderById(id) {
        try {
            const response = await axios.get(`/order/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            toastService.error('Unable to load order details');
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            const response = await axios.post('/order', orderData);
            toastService.success('Order created successfully');
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error);
            toastService.error('Error creating order');
            throw error;
        }
    }

    async createInStoreOrder(orderData) {
        try {
            // Gửi trực tiếp dữ liệu orderData, không bọc trong createOrderDto
            const response = await axios.post('/order/in-store', orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating in-store order:', error);
            toastService.error(`Error creating order: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async searchCustomers(searchParams) {
        try {
            // Sử dụng endpoint mới với tham số searchTerm đơn giản hơn
            let searchTerm = '';
            
            if (searchParams.email && searchParams.email.trim() !== '') {
                searchTerm = searchParams.email;
            } else if (searchParams.phoneNumber && searchParams.phoneNumber.trim() !== '') {
                // Tìm kiếm bằng số điện thoại
                const response = await axios.get('/user/search', { 
                    params: { search: searchParams.phoneNumber } 
                });
                return response.data;
            } else if (searchParams.username && searchParams.username.trim() !== '') {
                searchTerm = searchParams.username;
            } else {
                return [];
            }
            
            const response = await axios.get('/order/search-customers-simple', { 
                params: { searchTerm } 
            });
            return response.data;
        } catch (error) {
            console.error('Error searching customers:', error);
            toastService.error('Error searching customers');
            throw error;
        }
    }

    async updateOrder(id, orderData) {
        try {
            const response = await axios.put(`/order/${id}`, orderData);
            toastService.success('Order updated successfully');
            return response.data;
        } catch (error) {
            console.error(`Error updating order ${id}:`, error);
            toastService.error('Error updating order');
            throw error;
        }
    }

    async deleteOrder(id) {
        try {
            await axios.delete(`/order/${id}`);
            toastService.success('Order deleted successfully');
            return true;
        } catch (error) {
            console.error(`Error deleting order ${id}:`, error);
            toastService.error('Error deleting order');
            throw error;
        }
    }

    // Tính toán tổng tiền từ danh sách sản phẩm đã chọn
    calculateTotal(selectedProducts) {
        return selectedProducts.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    }
}

export default new OrderService(); 