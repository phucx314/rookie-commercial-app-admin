import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import dashboardService from "../../services/dashboard.service";
import "./Dashboard.css";

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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

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
                  formatCurrency(stat.value)
                ) : (
                  stat.count
                )}
              </div>
              <p className="stat-sublabel">{stat.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rankings */}
      <div className="rankings">
        <div className="ranking-card">
          <h3>Highest Revenue Stores</h3>
          <div className="ranking-list">
            {topStores.map((store, index) => (
              <div key={store.id} className="ranking-item">
                <div className="ranking-position">#{index + 1}</div>
                <div className="ranking-info">
                  <div className="ranking-title">{store.name}</div>
                  <div className="ranking-value">
                    {formatCurrency(store.revenue)}
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
                    {formatCurrency(product.revenue)}
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
  );
};

export default Dashboard; 