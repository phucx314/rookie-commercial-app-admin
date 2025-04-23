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

    async getPaginatedProducts(pageIndex = 1, pageSize = 10) {
        try {
            const response = await axios.get('/Product/paged', { 
                params: { pageIndex, pageSize } 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getPaginatedProductsByCategory(categoryId, pageIndex = 1, pageSize = 10) {
        try {
            const response = await axios.get(`/Product/category/${categoryId}/paged`, { 
                params: { pageIndex, pageSize } 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async searchProducts(searchTerm, pageIndex = 1, pageSize = 10) {
        try {
            const response = await axios.get('/Product/search', { 
                params: { searchTerm, pageIndex, pageSize } 
            });
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

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    getCategoryName(categories, categoryId) {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : '-';
    }

    getStoreName(stores, storeId) {
        const store = stores.find(s => s.id === storeId);
        return store ? store.name : '-';
    }

    calculateAverageRating(product) {
        if (!product.reviews || product.reviews.length === 0) return 0;
        return product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
    }

    getSortedProducts(products, categories, stores, sortConfig) {
        if (!sortConfig.key) return products;

        return [...products].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === 'categoryId') {
                aValue = this.getCategoryName(categories, a.categoryId);
                bValue = this.getCategoryName(categories, b.categoryId);
            } else if (sortConfig.key === 'storeId') {
                aValue = this.getStoreName(stores, a.storeId);
                bValue = this.getStoreName(stores, b.storeId);
            } else if (sortConfig.key === 'rating') {
                aValue = this.calculateAverageRating(a);
                bValue = this.calculateAverageRating(b);
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
}

export default new ProductService(); 