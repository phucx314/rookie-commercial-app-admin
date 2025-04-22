import axios from '../api/axios';

class CategoryService {
    async getAllCategories() {
        try {
            const response = await axios.get('/Category');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getCategoryById(id) {
        try {
            const response = await axios.get(`/Category/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createCategory(categoryData) {
        try {
            const response = await axios.post('/Category', categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(id, categoryData) {
        try {
            const response = await axios.put(`/Category/${id}`, categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const response = await axios.delete(`/Category/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new CategoryService(); 