import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dashboardService from "../../services/dashboard.service";
import { toastService } from "../../services";
import { useTheme } from "../../context/ThemeContext";
import ExportDataModal from "./ExportDataModal";
import ExportedFilesList from "./ExportedFilesList";
import "./Dashboard.css";

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [topStores, setTopStores] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [ordersByDate, setOrdersByDate] = useState([]);
  const [revenueByDate, setRevenueByDate] = useState([]);
  const { isDarkMode } = useTheme();

  // Date range states
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [dateError, setDateError] = useState('');
  
  // Export Data Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Files list modal state
  const [showFilesList, setShowFilesList] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Set default date range to last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const defaultDateRange = {
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

      setDateRange(defaultDateRange);
      
      // Tạo date range để gửi lên API - thêm +1 ngày cho endDate để bao gồm toàn bộ ngày hiện tại
      const apiDateRange = {
        startDate: defaultDateRange.startDate,
        // Thêm 1 ngày cho endDate để bao gồm cả ngày được chọn
        endDate: new Date(new Date(defaultDateRange.endDate).setDate(new Date(defaultDateRange.endDate).getDate() + 1))
          .toISOString().split('T')[0]
      };
      
      // Fetch dashboard data with date range
      const data = await dashboardService.getDashboardData(apiDateRange);
      
      // Lọc bỏ ngày cuối cùng (ngày +1) từ dữ liệu biểu đồ
      const filteredOrdersByDate = data.ordersByDate ? data.ordersByDate.slice(0, -1) : [];
      const filteredRevenueByDate = data.revenueByDate ? data.revenueByDate.slice(0, -1) : [];
      
      // Set dashboard data directly from the API response
      setStats({
        totalProducts: {
          count: data.stats.productStats.totalCount,
          quantity: data.stats.productStats.totalQuantity,
          icon: ShoppingBagIcon,
          label: "Total Products",
          sublabel: "products / quantity",
        },
        totalValue: {
          value: data.stats.totalInventoryValue,
          icon: CurrencyDollarIcon,
          label: "Total Value",
          sublabel: "inventory value",
        },
        totalCustomers: {
          count: data.stats.totalCustomers,
          icon: UserGroupIcon,
          label: "Total Customers",
          sublabel: "customers who purchased",
        },
        totalRevenue: {
          value: data.stats.totalRevenue,
          icon: BuildingStorefrontIcon,
          label: "Total Revenue",
          sublabel: "from all stores",
        },
      });
      
      // Set rankings data
      setTopStores(data.topStores);
      setTopProducts(data.topProducts);
      setTopCategories(data.topCategories);
      
      // Set chart data - dùng dữ liệu đã lọc
      setOrdersByDate(filteredOrdersByDate);
      setRevenueByDate(filteredRevenueByDate);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toastService.error("Cannot load dashboard data. Please try again later.");
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setDateError('');
  };

  const handleDateRangeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate date range
      dashboardService.validateDateRange(dateRange.startDate, dateRange.endDate);
      
      // Tạo date range để gửi lên API - thêm +1 ngày cho endDate
      const apiDateRange = {
        startDate: dateRange.startDate,
        // Thêm 1 ngày cho endDate để bao gồm cả ngày được chọn
        endDate: new Date(new Date(dateRange.endDate).setDate(new Date(dateRange.endDate).getDate() + 1))
          .toISOString().split('T')[0]
      };
      
      // Fetch new data with the selected date range
      const data = await dashboardService.getDashboardData(apiDateRange);
      
      // Lọc bỏ ngày cuối cùng (ngày +1) từ dữ liệu biểu đồ
      const filteredOrdersByDate = data.ordersByDate ? data.ordersByDate.slice(0, -1) : [];
      const filteredRevenueByDate = data.revenueByDate ? data.revenueByDate.slice(0, -1) : [];
      
      // Update state with new data
      setStats({
        totalProducts: {
          count: data.stats.productStats.totalCount,
          quantity: data.stats.productStats.totalQuantity,
          icon: ShoppingBagIcon,
          label: "Total Products",
          sublabel: "products / quantity",
        },
        totalValue: {
          value: data.stats.totalInventoryValue,
          icon: CurrencyDollarIcon,
          label: "Total Value",
          sublabel: "inventory value",
        },
        totalCustomers: {
          count: data.stats.totalCustomers,
          icon: UserGroupIcon,
          label: "Total Customers",
          sublabel: "customers who purchased",
        },
        totalRevenue: {
          value: data.stats.totalRevenue,
          icon: BuildingStorefrontIcon,
          label: "Total Revenue",
          sublabel: "from all stores",
        },
      });
      
      // Update rankings
      setTopStores(data.topStores);
      setTopProducts(data.topProducts);
      setTopCategories(data.topCategories);
      
      // Update chart data - dùng dữ liệu đã lọc
      setOrdersByDate(filteredOrdersByDate);
      setRevenueByDate(filteredRevenueByDate);
      
      setDateError('');
    } catch (error) {
      setDateError(error.message);
      toastService.error(error.message);
    }
  };
  
  // Hàm mở modal xuất dữ liệu
  const handleOpenExportModal = () => {
    setShowExportModal(true);
  };
  
  // Hàm đóng modal xuất dữ liệu
  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };
  
  // Hàm mở modal danh sách file
  const handleOpenFilesModal = () => {
    setShowFilesList(true);
  };
  
  // Hàm đóng modal danh sách file
  const handleCloseFilesModal = () => {
    setShowFilesList(false);
  };

  // Lấy dữ liệu và cấu hình biểu đồ từ service
  const combinedChartData = dashboardService.prepareCombinedChartData(ordersByDate, revenueByDate, isDarkMode);
  const combinedChartOptions = dashboardService.prepareCombinedChartOptions(isDarkMode);

  return (
    <div className="dashboard">
      {/* Dashboard header with export button */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <button 
            className="files-list-btn" 
            onClick={handleOpenFilesModal}
            title="View Exported Files"
          >
            <span>Exported Files</span>
          </button>
          <button 
            className="export-data-btn" 
            onClick={handleOpenExportModal}
            title="Export Dashboard Data"
          >
            <ArrowDownTrayIcon />
            <span>Export Data</span>
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        {Object.entries(stats).map(([key, stat]) => (
          <div key={key} className="stat-card">
            <div className="stat-icon">
              <stat.icon />
            </div>
            <div className="stat-content">
              <h3>{stat.label}</h3>
              <div className="stat-value">
                {key === "totalProducts" ? (
                  <>
                    {stat.count} / {stat.quantity}
                  </>
                ) : key.includes("total") && key !== "totalCustomers" ? (
                  dashboardService.formatCurrency(stat.value)
                ) : (
                  stat.count
                )}
              </div>
              <p className="stat-sublabel">{stat.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Content: Chart + Rankings */}
      <div className="dashboard-content">
        {/* Combined Chart */}
        <div className="chart-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Chart of Orders and Revenue</h3>
              <form onSubmit={handleDateRangeSubmit} className="date-range-form">
                <div className="date-range-inputs">
                  <div className="date-input-group">
                    <label>From:</label>
                    <input
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateChange}
                      min={dashboardService.MIN_DATE.toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To:</label>
                    <input
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateChange}
                      min={dashboardService.MIN_DATE.toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <button type="submit" className="apply-date-range">Apply</button>
                </div>
                {dateError && <div className="date-error">{dateError}</div>}
              </form>
            </div>
            <div className="chart-wrapper">
              <Line data={combinedChartData} options={combinedChartOptions} />
            </div>
            <div className="chart-footer">
              <button 
                className="view-orders-btn" 
                onClick={() => {
                  // Chuẩn bị tham số lọc theo khoảng thời gian đã chọn
                  const filterParams = dashboardService.prepareOrdersFilterParams(dateRange);
                  // Điều hướng đến trang orders với params
                  navigate(`/orders${filterParams ? '?' + filterParams : ''}`);
                }}
              >
                Detailed Order List
              </button>
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div className="rankings-section">
          <div className="ranking-card">
            <h3>Highest Revenue Stores</h3>
            <div className="ranking-list">
              {topStores.map((store, index) => (
                <div key={store.id} className="ranking-item">
                  <div className="ranking-position">#{index + 1}</div>
                  <div className="ranking-info">
                    <div className="ranking-title">{store.name}</div>
                    <div className="ranking-value">
                      {dashboardService.formatCurrency(store.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ranking-card">
            <h3>Top Products by Revenue</h3>
            <div className="ranking-list">
              {topProducts.map((product, index) => (
                <div key={product.id} className="ranking-item">
                  <div className="ranking-position">#{index + 1}</div>
                  <div className="ranking-info">
                    <div className="ranking-title">{product.name}</div>
                    <div className="ranking-value">
                      {dashboardService.formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ranking-card">
            <h3>Top Categories by Sold Quantity</h3>
            <div className="ranking-list">
              {topCategories.map((category, index) => (
                <div key={category.id} className="ranking-item">
                  <div className="ranking-position">#{index + 1}</div>
                  <div className="ranking-info">
                    <div className="ranking-title">{category.name}</div>
                    <div className="ranking-value">
                      {category.soldQuantity} sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Data Modal */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={handleCloseExportModal}
        stats={stats}
        topStores={topStores}
        topProducts={topProducts}
        topCategories={topCategories}
        ordersByDate={ordersByDate}
        revenueByDate={revenueByDate}
        dashboardDateRange={dateRange}
      />
      
      {/* Exported Files List Modal */}
      <ExportedFilesList
        isOpen={showFilesList}
        onClose={handleCloseFilesModal}
      />
    </div>
  );
};

export default Dashboard; 