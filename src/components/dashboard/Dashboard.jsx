import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);

      const calculatedStats = dashboardService.calculateStats(data.products, data.orders);
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

      setTopStores(dashboardService.getTopStores(data.stores, data.orders, data.products));
      setTopProducts(dashboardService.getTopProducts(data.products, data.orders));
      setTopCategories(dashboardService.getTopCategories(data.categories, data.orders, data.products));

      // Lấy dữ liệu cho biểu đồ
      setOrdersByDate(dashboardService.getOrdersByDate(data.orders));
      setRevenueByDate(dashboardService.getRevenueByDate(data.orders));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toastService.error("Cannot load dashboard data. Please try again later.");
    }
  };

  // Lấy dữ liệu và cấu hình biểu đồ từ service
  const combinedChartData = dashboardService.prepareCombinedChartData(ordersByDate, revenueByDate, isDarkMode);
  const combinedChartOptions = dashboardService.prepareCombinedChartOptions(isDarkMode);

  return (
    <div className="dashboard">
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
            <h3>Chart of orders and revenue (last 7 days)</h3>
            <div className="chart-wrapper">
              <Line data={combinedChartData} options={combinedChartOptions} />
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
            <h3>Top 3 Products by Revenue</h3>
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
            <h3>Top 3 Categories by Sold Quantity</h3>
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
    </div>
  );
};

export default Dashboard; 