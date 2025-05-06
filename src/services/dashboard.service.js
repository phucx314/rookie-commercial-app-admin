import axios from '../api/axios';

class DashboardService {
    // Thêm constants cho date range
    MIN_DATE = new Date('2025-03-01');
    
    async getDashboardData() {
        try {
            const [productsRes, ordersRes, storesRes, categoriesRes] = await Promise.all([
                axios.get("/Product"),
                axios.get("/Order"), 
                axios.get("/Store"),
                axios.get("/Category")
            ]);

            return {
                products: productsRes.data,
                orders: ordersRes.data,
                stores: storesRes.data,
                categories: categoriesRes.data
            };
        } catch (error) {
            throw error;
        }
    }

    calculateStats(products, orders, dateRange) {
        // Lọc đơn hàng theo date range nếu có
        let filteredOrders = orders;
        
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            try {
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    filteredOrders = orders.filter(order => {
                        try {
                            if (!order.createdAt) return false;
                            const orderDate = new Date(order.createdAt);
                            if (isNaN(orderDate.getTime())) return false;
                            return orderDate >= start && orderDate <= end;
                        } catch (err) {
                            return false;
                        }
                    });
                }
            } catch (error) {
                console.error('Error filtering orders by date range:', error);
            }
        }
        
        // Lọc đơn hàng đã hoàn thành và đã thanh toán
        const completedOrders = filteredOrders.filter(o => o.status === 3 && o.paymentStatus === 1);
        
        return {
            totalProducts: {
                count: products.length,
                quantity: products.reduce((sum, p) => sum + p.stockQuantity, 0)
            },
            totalValue: products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
            totalCustomers: [...new Set(filteredOrders.map(o => o.customerId))].length,
            totalRevenue: completedOrders.reduce((sum, order) => {
                if (!order.orderItems || !Array.isArray(order.orderItems)) {
                    return sum;
                }
                const orderTotal = order.orderItems.reduce((itemSum, item) => {
                    const price = Number(item.price) || 0;
                    const quantity = Number(item.quantity) || 0;
                    return itemSum + price * quantity;
                }, 0);
                return sum + orderTotal;
            }, 0)
        };
    }

    getTopStores(stores, orders, products, limit = 10, dateRange) {
        // Lọc đơn hàng theo date range nếu có
        let filteredOrders = orders;
        
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            try {
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    filteredOrders = orders.filter(order => {
                        try {
                            if (!order.createdAt) return false;
                            const orderDate = new Date(order.createdAt);
                            if (isNaN(orderDate.getTime())) return false;
                            return orderDate >= start && orderDate <= end;
                        } catch (err) {
                            return false;
                        }
                    });
                }
            } catch (error) {
                console.error('Error filtering orders by date range:', error);
            }
        }
        
        return stores
            .map(store => ({
                ...store,
                revenue: filteredOrders
                    .filter(o => o.status === 3 && o.paymentStatus === 1)
                    .reduce((sum, order) => {
                        if (!order.orderItems || !Array.isArray(order.orderItems)) {
                            return sum;
                        }
                        
                        const storeOrderItems = order.orderItems.filter(
                            item => products.find(p => p.id === item.productId)?.storeId === store.id
                        );
                        
                        const orderTotal = storeOrderItems.reduce((itemSum, item) => {
                            const price = Number(item.price) || 0;
                            const quantity = Number(item.quantity) || 0;
                            return itemSum + price * quantity;
                        }, 0);
                        
                        return sum + orderTotal;
                    }, 0)
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    getTopProducts(products, orders, limit = 10, dateRange) {
        // Lọc đơn hàng theo date range nếu có
        let filteredOrders = orders;
        
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            try {
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    filteredOrders = orders.filter(order => {
                        try {
                            if (!order.createdAt) return false;
                            const orderDate = new Date(order.createdAt);
                            if (isNaN(orderDate.getTime())) return false;
                            return orderDate >= start && orderDate <= end;
                        } catch (err) {
                            return false;
                        }
                    });
                }
            } catch (error) {
                console.error('Error filtering orders by date range:', error);
            }
        }
        
        // Lọc đơn hàng đã hoàn thành và đã thanh toán
        const completedOrders = filteredOrders.filter(o => o.status === 3 && o.paymentStatus === 1);
        
        return products
            .map(product => ({
                ...product,
                revenue: completedOrders
                    .flatMap(o => o.orderItems || [])
                    .filter(item => item.productId === product.id)
                    .reduce((sum, item) => {
                        const price = Number(item.price) || 0;
                        const quantity = Number(item.quantity) || 0;
                        return sum + price * quantity;
                    }, 0)
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    getTopCategories(categories, orders, products, limit = 10, dateRange) {
        // Lọc đơn hàng theo date range nếu có
        let filteredOrders = orders;
        
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            try {
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    filteredOrders = orders.filter(order => {
                        try {
                            if (!order.createdAt) return false;
                            const orderDate = new Date(order.createdAt);
                            if (isNaN(orderDate.getTime())) return false;
                            return orderDate >= start && orderDate <= end;
                        } catch (err) {
                            return false;
                        }
                    });
                }
            } catch (error) {
                console.error('Error filtering orders by date range:', error);
            }
        }
        
        // Lọc đơn hàng đã hoàn thành và đã thanh toán
        const completedOrders = filteredOrders.filter(o => o.status === 3 && o.paymentStatus === 1);
        
        return categories
            .map(category => ({
                ...category,
                soldQuantity: completedOrders
                    .flatMap(o => o.orderItems || [])
                    .filter(item => 
                        products.find(p => p.id === item.productId)?.categoryId === category.id
                    )
                    .reduce((sum, item) => {
                        const quantity = Number(item.quantity) || 0;
                        return sum + quantity;
                    }, 0)
            }))
            .sort((a, b) => b.soldQuantity - a.soldQuantity)
            .slice(0, limit);
    }

    getOrdersByDateRange(orders, startDate, endDate) {
        if (!orders || !orders.length) return [];
        
        try {
            // Đảm bảo startDate và endDate là đối tượng Date hợp lệ
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.error('Invalid date range provided');
                return [];
            }
            
            // Tạo mảng các ngày trong khoảng
            const dates = this.generateDateRange(start, end);
            
            // Nhóm đơn hàng theo ngày
            const ordersByDate = dates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const count = orders.filter(order => {
                    try {
                        // Kiểm tra ngày hợp lệ
                        const orderCreatedAt = order.createdAt;
                        if (!orderCreatedAt) return false;
                        
                        const orderDate = new Date(orderCreatedAt);
                        if (isNaN(orderDate.getTime())) return false;
                        
                        return orderDate.toISOString().split('T')[0] === dateStr;
                    } catch (err) {
                        console.warn('Error processing order date:', err);
                        return false;
                    }
                }).length;
                
                return {
                    date: dateStr,
                    count
                };
            });
            
            return ordersByDate;
        } catch (error) {
            console.error('Error in getOrdersByDateRange:', error);
            return [];
        }
    }

    getRevenueByDateRange(orders, startDate, endDate) {
        if (!orders || !orders.length) return [];
        
        try {
            // Đảm bảo startDate và endDate là đối tượng Date hợp lệ
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.error('Invalid date range provided');
                return [];
            }
            
            // Lọc đơn hàng đã hoàn thành và đã thanh toán
            const completedOrders = orders.filter(o => o.status === 3 && o.paymentStatus === 1);
            
            // Tạo mảng các ngày trong khoảng
            const dates = this.generateDateRange(start, end);
            
            // Tính doanh thu theo ngày
            const revenueByDate = dates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                
                const dailyRevenue = completedOrders
                    .filter(order => {
                        try {
                            // Kiểm tra ngày hợp lệ
                            const orderCreatedAt = order.createdAt;
                            if (!orderCreatedAt) return false;
                            
                            const orderDate = new Date(orderCreatedAt);
                            if (isNaN(orderDate.getTime())) return false;
                            
                            return orderDate.toISOString().split('T')[0] === dateStr;
                        } catch (err) {
                            console.warn('Error processing order date:', err);
                            return false;
                        }
                    })
                    .reduce((total, order) => {
                        if (!order.orderItems || !Array.isArray(order.orderItems)) {
                            return total;
                        }
                        
                        const orderTotal = order.orderItems.reduce((sum, item) => {
                            const price = Number(item.price) || 0;
                            const quantity = Number(item.quantity) || 0;
                            return sum + (price * quantity);
                        }, 0);
                        
                        return total + orderTotal;
                    }, 0);
                
                return {
                    date: dateStr,
                    revenue: dailyRevenue
                };
            });
            
            return revenueByDate;
        } catch (error) {
            console.error('Error in getRevenueByDateRange:', error);
            return [];
        }
    }

    generateDateRange(startDate, endDate) {
        const dates = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        
        // Kiểm tra startDate không được trước MIN_DATE
        if (start < this.MIN_DATE) {
            throw new Error('Start date cannot be before April 1st, 2025');
        }
        
        // Kiểm tra endDate không được sau today
        if (end > today) {
            throw new Error('End date cannot be after today');
        }
        
        // Kiểm tra startDate phải trước hoặc bằng endDate
        if (start > end) {
            throw new Error('Start date must be before or equal to end date');
        }
        
        return true;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "VND",
        }).format(value);
    }

    getChartColors(isDarkMode) {
        return {
            textColor: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            barBackgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.5)',
            barBorderColor: isDarkMode ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
            lineBackgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            lineBorderColor: isDarkMode ? 'rgb(16, 185, 129)' : 'rgb(5, 150, 105)'
        };
    }

    prepareCombinedChartData(ordersByDate, revenueByDate, isDarkMode) {
        const colors = this.getChartColors(isDarkMode);
        
        // Tạo nhãn chung cho trục x từ dữ liệu ngày
        const labels = ordersByDate.map(item => {
            const date = new Date(item.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        return {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Number of Orders',
                    data: ordersByDate.map(item => item.count),
                    backgroundColor: colors.barBackgroundColor,
                    borderColor: colors.barBorderColor,
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Revenue (VND)',
                    data: revenueByDate.map(item => item.revenue),
                    backgroundColor: colors.lineBackgroundColor,
                    borderColor: colors.lineBorderColor,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1',
                },
            ],
        };
    }

    prepareCombinedChartOptions(isDarkMode) {
        const colors = this.getChartColors(isDarkMode);
        const formatCurrency = this.formatCurrency;

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.textColor,
                        font: {
                            size: 12,
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw;
                            
                            // Kiểm tra xem đây là dữ liệu doanh thu hay đơn hàng
                            if (context.dataset.yAxisID === 'y1') {
                                return `${label}: ${formatCurrency(value)}`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: colors.gridColor,
                    },
                    ticks: {
                        color: colors.textColor,
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: {
                        color: colors.gridColor,
                    },
                    ticks: {
                        color: colors.textColor,
                    },
                    title: {
                        display: true,
                        text: 'Number of Orders',
                        color: colors.textColor
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: colors.textColor,
                        callback: function(value) {
                            // Rút gọn giá trị doanh thu cho dễ đọc
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'tr';
                            }
                            return value;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Revenue (VND)',
                        color: colors.textColor
                    },
                    beginAtZero: true
                }
            },
        };
    }

    // Phương thức mới để chuẩn bị tham số URL cho trang Orders
    prepareOrdersFilterParams(dateRange) {
        // Kiểm tra xem dateRange có hợp lệ không
        if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
            return '';
        }

        try {
            // Xác thực range
            this.validateDateRange(dateRange.startDate, dateRange.endDate);
            
            // Tạo chuỗi tham số
            const params = new URLSearchParams();
            params.set('fromDate', dateRange.startDate);
            params.set('toDate', dateRange.endDate);
            params.set('sortBy', 'createdAt');
            params.set('sortDir', 'desc');
            
            return params.toString();
        } catch (error) {
            console.error('Error preparing orders filter params:', error);
            return '';
        }
    }
}

export default new DashboardService(); 