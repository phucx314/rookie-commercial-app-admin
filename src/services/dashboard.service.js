import axios from '../api/axios';

class DashboardService {
    // Thêm constants cho date range
    MIN_DATE = new Date('2025-03-01');
    
    async getDashboardData(dateRange) {
        try {
            const params = this.buildDateRangeParams(dateRange);
            
            const [
                statsRes, 
                topStoresRes, 
                topProductsRes, 
                topCategoriesRes,
                ordersByDateRes,
                revenueByDateRes
            ] = await Promise.all([
                axios.get("/Dashboard/stats", { params }),
                axios.get("/Dashboard/top-stores", { params }),
                axios.get("/Dashboard/top-products", { params }),
                axios.get("/Dashboard/top-categories", { params }),
                axios.get("/Dashboard/orders-by-date", { params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                }}),
                axios.get("/Dashboard/revenue-by-date", { params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                }})
            ]);

            return {
                stats: statsRes.data,
                topStores: topStoresRes.data,
                topProducts: topProductsRes.data, 
                topCategories: topCategoriesRes.data,
                ordersByDate: ordersByDateRes.data,
                revenueByDate: revenueByDateRes.data
            };
        } catch (error) {
            console.error("Error in getDashboardData:", error);
            throw error;
        }
    }
    
    buildDateRangeParams(dateRange) {
        if (!dateRange) return {};
        
        return {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        };
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
        
        // Kiểm tra nếu dữ liệu rỗng hoặc không hợp lệ
        if (!ordersByDate || !revenueByDate || !ordersByDate.length || !revenueByDate.length) {
            return {
                labels: [],
                datasets: [
                    {
                        type: 'bar',
                        label: 'Number of Orders',
                        data: [],
                        backgroundColor: colors.barBackgroundColor,
                        borderColor: colors.barBorderColor,
                        borderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Revenue (VND)',
                        data: [],
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