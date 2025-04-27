import axios from '../api/axios';

class DashboardService {
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

    calculateStats(products, orders) {
        return {
            totalProducts: {
                count: products.length,
                quantity: products.reduce((sum, p) => sum + p.stockQuantity, 0)
            },
            totalValue: products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
            totalCustomers: [...new Set(orders.map(o => o.customerId))].length,
            totalRevenue: orders.reduce((sum, order) => {
                const orderTotal = order.orderItems.reduce((itemSum, item) => {
                    return itemSum + item.price * item.quantity;
                }, 0);
                return sum + orderTotal;
            }, 0)
        };
    }

    getTopStores(stores, orders, products, limit = 10) {
        return stores
            .map(store => ({
                ...store,
                revenue: orders
                    .filter(o => o.status === 3 && o.paymentStatus === 1)
                    .reduce((sum, order) => {
                        const storeOrderItems = order.orderItems.filter(
                            item => products.find(p => p.id === item.productId)?.storeId === store.id
                        );
                        const orderTotal = storeOrderItems.reduce((itemSum, item) => {
                            return itemSum + item.price * item.quantity;
                        }, 0);
                        return sum + orderTotal;
                    }, 0)
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    getTopProducts(products, orders, limit = 10) {
        return products
            .map(product => ({
                ...product,
                revenue: orders
                    .flatMap(o => o.orderItems)
                    .filter(item => item.productId === product.id)
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    getTopCategories(categories, orders, products, limit = 10) {
        return categories
            .map(category => ({
                ...category,
                soldQuantity: orders
                    .flatMap(o => o.orderItems)
                    .filter(item => 
                        products.find(p => p.id === item.productId)?.categoryId === category.id
                    )
                    .reduce((sum, item) => sum + item.quantity, 0)
            }))
            .sort((a, b) => b.soldQuantity - a.soldQuantity)
            .slice(0, limit);
    }

    getOrdersByDate(orders, days = 7) {
        // Tạo một mảng ngày trong khoảng thời gian
        const dates = this.generateDateRange(days);
        
        // Nhóm đơn hàng theo ngày
        const ordersByDate = dates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const count = orders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate === dateStr;
            }).length;
            
            return {
                date: dateStr,
                count
            };
        });
        
        return ordersByDate;
    }

    getRevenueByDate(orders, days = 7) {
        // Tạo một mảng ngày trong khoảng thời gian
        const dates = this.generateDateRange(days);
        
        // Tính doanh thu theo ngày
        const revenueByDate = dates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            
            const dailyRevenue = orders
                .filter(order => {
                    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                    return orderDate === dateStr;
                })
                .reduce((total, order) => {
                    const orderTotal = order.orderItems.reduce((sum, item) => {
                        return sum + (item.price * item.quantity);
                    }, 0);
                    return total + orderTotal;
                }, 0);
            
            return {
                date: dateStr,
                revenue: dailyRevenue
            };
        });
        
        return revenueByDate;
    }

    generateDateRange(days) {
        const dates = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0);
            dates.push(date);
        }
        
        return dates;
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
}

export default new DashboardService(); 