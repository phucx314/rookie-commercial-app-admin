import axios from '../api/axios';
import { toastService } from './index';

class AuthService {
    async login(email, password) {
        try {
            console.log('Attempting login with:', { email });
            const response = await axios.post('/auth/login', { email, password });
            const { token, user, expiration } = response.data;

            if (token) {
                // Lưu token vào localStorage
                localStorage.setItem('token', token);
                
                // Lưu thông tin phiên làm việc
                this.setSessionInfo(user, expiration);
                
                // Hiển thị thông báo thành công
                toastService.success(`Hello, ${user.name || user.email}!`);
            }
            return response.data;
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            if (error.message === 'Network Error') {
                throw new Error('Cannot connect to server. Please check your network connection and try again.');
            }
            throw error;
        }
    }

    setSessionInfo(user, expiration) {
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('expiration', expiration);
        sessionStorage.setItem('lastActivity', new Date().toISOString());
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