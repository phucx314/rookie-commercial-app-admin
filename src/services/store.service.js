import axios from '../api/axios';

class StoreService {
    async getAllStores() {
        try {
            const response = await axios.get('/Store');
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
}

export default new StoreService(); 