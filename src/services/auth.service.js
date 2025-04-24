import axios from '../api/axios';

class AuthService {
    async login(email, password) {
        try {
            const response = await axios.post('/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                sessionStorage.setItem('lastActivity', new Date().toISOString());
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await axios.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
        sessionStorage.clear();
    }

    getCurrentUser() {
        const token = localStorage.getItem('token');
        return token ? token : null;
    }

    isAuthenticated() {
        return !!this.getCurrentUser();
    }
}

export default new AuthService(); 