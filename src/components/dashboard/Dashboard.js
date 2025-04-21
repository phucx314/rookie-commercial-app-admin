import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import "./Dashboard.css";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, storesRes, categoriesRes] =
        await Promise.all([
          axios.get("/Product"),
          axios.get("/Order"),
          axios.get("/Store"),
          axios.get("/Category"),
        ]);

      // console.log("Orders data:", ordersRes.data);

      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setStores(storesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Tính toán các thống kê
  const stats = {
    totalProducts: {
      count: products.length,
      quantity: products.reduce((sum, p) => sum + p.stockQuantity, 0),
      icon: ShoppingBagIcon,
      label: "Total Products",
      sublabel: "products / quantity",
    },
    totalValue: {
      value: products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
      icon: CurrencyDollarIcon,
      label: "Total Value",
      sublabel: "inventory value",
    },
    totalCustomers: {
      count: [...new Set(orders.map((o) => o.customerId))].length,
      icon: UserGroupIcon,
      label: "Total Customers",
      sublabel: "customers who purchased",
    },
    totalRevenue: {
      value: orders.reduce((sum, order) => {
        const orderTotal = order.orderItems.reduce((itemSum, item) => {
          return itemSum + item.price * item.quantity;
        }, 0);
        return sum + orderTotal;
      }, 0),
      icon: BuildingStorefrontIcon,
      label: "Total Revenue",
      sublabel: "from all stores",
    },
  };

  // Tính toán bảng xếp hạng
  const topStores = stores
    .map((store) => ({
      ...store,
      revenue: orders
        .filter((o) => o.status === 3 && o.paymentStatus === 1)
        .reduce((sum, order) => {
          // Chỉ tính các order items có product thuộc về store này
          const storeOrderItems = order.orderItems.filter(
            (item) =>
              products.find((p) => p.id === item.productId)?.storeId ===
              store.id
          );
          const orderTotal = storeOrderItems.reduce((itemSum, item) => {
            return itemSum + item.price * item.quantity;
          }, 0);
          return sum + orderTotal;
        }, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const topProducts = products
    .map((product) => ({
      ...product,
      revenue: orders
        .flatMap((o) => o.orderItems)
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const topCategories = categories
    .map((category) => ({
      ...category,
      soldQuantity: orders
        .flatMap((o) => o.orderItems)
        .filter(
          (item) =>
            products.find((p) => p.id === item.productId)?.categoryId ===
            category.id
        )
        .reduce((sum, item) => sum + item.quantity, 0),
    }))
    .sort((a, b) => b.soldQuantity - a.soldQuantity)
    .slice(0, 3);

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
