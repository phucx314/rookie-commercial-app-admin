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

    async getPaginatedProductsByStore(storeId, pageIndex = 1, pageSize = 10) {
        try {
            const response = await axios.get('/Product/paged', { 
                params: { 
                    pageIndex, 
                    pageSize,
                    storeId
                } 
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products by store:', error);
            throw error;
        }
    }

    async getPaginatedProductsByCategoryAndStore(categoryId, storeId, pageIndex = 1, pageSize = 10) {
        try {
            const response = await axios.get(`/Product/category/${categoryId}/paged`, { 
                params: { 
                    pageIndex, 
                    pageSize,
                    storeId
                } 
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products by category and store:', error);
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
            console.error('Error creating product:', error);
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
        
        // console.log('Formatting date:', dateString);
        
        try {
            // Chuẩn hóa định dạng datetime
            // Đảm bảo chuỗi có thông tin múi giờ (với DateTimeOffset có dạng +00:00, DateTime không có)
            let date;
            
            // Kiểm tra xem dateString có thông tin về múi giờ không (dạng +00:00 hoặc Z)
            if (dateString.includes('+') || dateString.includes('Z')) {
                // Đây là DateTimeOffset, giữ nguyên
                date = new Date(dateString);
            } else {
                // Đây là DateTime không có thông tin múi giờ, coi như UTC
                date = new Date(dateString + 'Z'); // Thêm Z để đánh dấu là UTC
            }
            
            // console.log('Parsed date object:', date.toString());
            
            // Thiết lập múi giờ Việt Nam (UTC+7)
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Ho_Chi_Minh'  // Thiết lập múi giờ Việt Nam (UTC+7)
            };
            
            const formattedDate = date.toLocaleString('vi-VN', options);
            // console.log('Formatted date:', formattedDate);
            return formattedDate;
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString; // Trả về chuỗi gốc nếu có lỗi
        }
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