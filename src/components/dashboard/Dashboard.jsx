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
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    products: [],
    orders: [],
    stores: [],
    categories: []
  });
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
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);

      // Set default date range to last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const defaultDateRange = {
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

      setDateRange(defaultDateRange);

      // Cập nhật tất cả dữ liệu với date range mặc định
      updateDashboardData(data, defaultDateRange);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toastService.error("Cannot load dashboard data. Please try again later.");
    }
  };

  const updateDashboardData = (data, dateRangeObj) => {
    try {
      const { startDate, endDate } = dateRangeObj;
      dashboardService.validateDateRange(startDate, endDate);
      
      // Cập nhật thống kê tổng quan
      const calculatedStats = dashboardService.calculateStats(data.products, data.orders, dateRangeObj);
      setStats({
        totalProducts: {
          ...calculatedStats.totalProducts,
          icon: ShoppingBagIcon,
          label: "Total Products",
          sublabel: "products / quantity",
        },
        totalValue: {
          value: calculatedStats.totalValue,
          icon: CurrencyDollarIcon,
          label: "Total Value",
          sublabel: "inventory value",
        },
        totalCustomers: {
          count: calculatedStats.totalCustomers,
          icon: UserGroupIcon,
          label: "Total Customers",
          sublabel: "customers who purchased",
        },
        totalRevenue: {
          value: calculatedStats.totalRevenue,
          icon: BuildingStorefrontIcon,
          label: "Total Revenue",
          sublabel: "from all stores",
        },
      });

      // Cập nhật các top ranking
      setTopStores(dashboardService.getTopStores(data.stores, data.orders, data.products, 10, dateRangeObj));
      setTopProducts(dashboardService.getTopProducts(data.products, data.orders, 10, dateRangeObj));
      setTopCategories(dashboardService.getTopCategories(data.categories, data.orders, data.products, 10, dateRangeObj));

      // Cập nhật dữ liệu biểu đồ
      setOrdersByDate(dashboardService.getOrdersByDateRange(data.orders, startDate, endDate));
      setRevenueByDate(dashboardService.getRevenueByDateRange(data.orders, startDate, endDate));
      
      setDateError('');
    } catch (error) {
      setDateError(error.message);
      toastService.error(error.message);
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

  const handleDateRangeSubmit = (e) => {
    e.preventDefault();
    // Cập nhật tất cả dữ liệu dashboard với date range mới
    updateDashboardData(dashboardData, dateRange);
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
        dashboardData={dashboardData}
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