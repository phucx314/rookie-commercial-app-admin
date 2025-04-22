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

    getTopStores(stores, orders, products, limit = 3) {
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

    getTopProducts(products, orders, limit = 3) {
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

    getTopCategories(categories, orders, products, limit = 3) {
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
}

export default new DashboardService(); 