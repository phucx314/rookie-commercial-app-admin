import axios from '../api/axios';

class ProductService {
    async getAllProducts(params = {}) {
        try {
            const response = await axios.get('/Product', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const response = await axios.get(`/Product/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createProduct(productData) {
        try {
            const response = await axios.post('/Product', productData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateProduct(id, productData) {
        try {
            const response = await axios.put(`/Product/${id}`, productData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const response = await axios.delete(`/Product/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new ProductService(); 