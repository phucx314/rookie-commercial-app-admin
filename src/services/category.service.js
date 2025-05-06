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

    async getPaginatedCategories(pageIndex = 1, pageSize = 10, sortBy = null, sortDirection = 'asc') {
        try {
            const params = { 
                pageIndex, 
                pageSize
            };
            
            // Thêm các tham số sắp xếp nếu được cung cấp
            if (sortBy) {
                params.sortBy = sortBy;
                params.sortDirection = sortDirection;
            }
            
            const response = await axios.get('/Category/paged', { params });
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

    // Hàm xử lý dữ liệu phân loại
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

    getParentName(categories, parentId) {
        const parent = categories.find(c => c.id === parentId);
        return parent ? parent.name : '-';
    }

    getSortedCategories(categories, sortConfig) {
        // LƯU Ý: Phương thức này chỉ nên được sử dụng cho sắp xếp client-side khi 
        // không thể sử dụng các API sorting server-side. Ưu tiên sử dụng API sorting
        // để có hiệu suất tốt hơn khi làm việc với lượng data lớn.
        if (!sortConfig.key) return categories;

        return [...categories].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Xử lý các trường hợp đặc biệt
            if (sortConfig.key === 'parentId') {
                const aParent = categories.find(c => c.id === a.parentId);
                const bParent = categories.find(c => c.id === b.parentId);
                aValue = aParent ? aParent.name : '';
                bValue = bParent ? bParent.name : '';
            } else if (sortConfig.key === 'productsCount') {
                aValue = a.products?.length || 0;
                bValue = b.products?.length || 0;
            } else if (sortConfig.key === 'childrenCount') {
                aValue = a.children?.length || 0;
                bValue = b.children?.length || 0;
            } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
                aValue = new Date(aValue || 0).getTime();
                bValue = new Date(bValue || 0).getTime();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    prepareCreateCategoryData(categoryData) {
        const categoryToCreate = { ...categoryData };
        
        // Chuyển đổi parentId từ chuỗi rỗng thành null
        if (categoryToCreate.parentId === '') {
            categoryToCreate.parentId = null;
        }
        
        return categoryToCreate;
    }

    prepareUpdateCategoryData(categoryData) {
        const categoryToUpdate = { ...categoryData };
        
        // Chuyển đổi parentId từ chuỗi rỗng thành null
        if (categoryToUpdate.parentId === '') {
            categoryToUpdate.parentId = null;
        }
        
        return categoryToUpdate;
    }

    async getSortOptions() {
        try {
            const response = await axios.get('/Category/sort-options');
            return response.data;
        } catch (error) {
            console.error('Error fetching sort options:', error);
            // Trả về danh sách mặc định nếu API lỗi
            return [
                { field: 'name', displayName: 'Name' },
                { field: 'description', displayName: 'Description' },
                { field: 'parent', displayName: 'Parent Category' },
                { field: 'childrencount', displayName: 'Subcategories Count' },
                { field: 'productscount', displayName: 'Products Count' },
                { field: 'createdat', displayName: 'Created Date' },
                { field: 'updatedat', displayName: 'Updated Date' }
            ];
        }
    }
}

export default new CategoryService(); 