import axios from '../api/axios';
import { toastService } from './toast.service';

class OrderService {
    async getAllOrders() {
        try {
            const response = await axios.get('/order');
            return response.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            toastService.error('Unable to load order list');
            throw error;
        }
    }

    async getOrderById(id) {
        try {
            const response = await axios.get(`/order/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            toastService.error('Unable to load order details');
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            const response = await axios.post('/order', orderData);
            toastService.success('Order created successfully');
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error);
            toastService.error('Error creating order');
            throw error;
        }
    }

    async createInStoreOrder(orderData) {
        try {
            // Gửi trực tiếp dữ liệu orderData, không bọc trong createOrderDto
            const response = await axios.post('/order/in-store', orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating in-store order:', error);
            toastService.error(`Error creating order: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async searchCustomers(searchParams) {
        try {
            // Sử dụng endpoint mới với tham số searchTerm đơn giản hơn
            let searchTerm = '';
            
            if (searchParams.email && searchParams.email.trim() !== '') {
                searchTerm = searchParams.email;
            } else if (searchParams.phoneNumber && searchParams.phoneNumber.trim() !== '') {
                // Tìm kiếm bằng số điện thoại
                const response = await axios.get('/user/search', { 
                    params: { search: searchParams.phoneNumber } 
                });
                return response.data;
            } else if (searchParams.username && searchParams.username.trim() !== '') {
                searchTerm = searchParams.username;
            } else {
                return [];
            }
            
            const response = await axios.get('/order/search-customers-simple', { 
                params: { searchTerm } 
            });
            return response.data;
        } catch (error) {
            console.error('Error searching customers:', error);
            toastService.error('Error searching customers');
            throw error;
        }
    }

    async updateOrder(id, orderData) {
        try {
            const response = await axios.put(`/order/${id}`, orderData);
            toastService.success('Order updated successfully');
            return response.data;
        } catch (error) {
            console.error(`Error updating order ${id}:`, error);
            toastService.error('Error updating order');
            throw error;
        }
    }

    async deleteOrder(id) {
        try {
            await axios.delete(`/order/${id}`);
            toastService.success('Order deleted successfully');
            return true;
        } catch (error) {
            console.error(`Error deleting order ${id}:`, error);
            toastService.error('Error deleting order');
            throw error;
        }
    }

    // Tính toán tổng tiền từ danh sách sản phẩm đã chọn
    calculateTotal(selectedProducts) {
        return selectedProducts.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    }
    
    // In hóa đơn cho đơn hàng
    printBill(orderData) {
        // Kiểm tra xem đơn hàng đã được thanh toán và giao hàng chưa
        if (orderData.status !== 'Delivered' && orderData.paymentStatus !== 'Paid') {
            toastService.error('Only paid and delivered orders can be printed');
            return;
        }
        
        try {
            // Log dữ liệu để debug
            console.log('Printing bill with data:', orderData);
            
            // Tạo nội dung hóa đơn
            const currentDate = new Date().toLocaleString();
            const orderDate = new Date().toLocaleDateString();
            const orderTime = new Date().toLocaleTimeString();
            
            // Tạo một cửa sổ mới để in hóa đơn
            const printWindow = window.open('', '_blank');
            
            // Format tiền tệ
            const formatCurrency = (amount) => {
                return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
            };
            
            // Tạo HTML cho hóa đơn
            let billContent = `
                <html>
                <head>
                    <title>Invoice #${Math.floor(Math.random() * 10000)}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .invoice-header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .invoice-header h1 {
                            margin-bottom: 5px;
                            color: #333;
                        }
                        .invoice-header p {
                            color: #666;
                            margin: 5px 0;
                        }
                        .invoice-info {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 30px;
                        }
                        .customer-info, .order-info {
                            width: 48%;
                        }
                        .invoice-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                        }
                        .invoice-table th, .invoice-table td {
                            border: 1px solid #ddd;
                            padding: 12px;
                            text-align: left;
                        }
                        .invoice-table th {
                            background-color: #f2f2f2;
                        }
                        .total-row {
                            font-weight: bold;
                        }
                        .invoice-footer {
                            margin-top: 50px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                        }
                        .text-right {
                            text-align: right;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                            body {
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                            }
                        }
                        .print-button {
                            background-color: #4CAF50;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            text-align: center;
                            text-decoration: none;
                            display: inline-block;
                            font-size: 16px;
                            margin: 20px 0;
                            cursor: pointer;
                            border-radius: 4px;
                        }
                    </style>
                </head>
                <body>
                    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
                        <button class="print-button" onclick="window.print();">Print Invoice</button>
                    </div>
                    
                    <div class="invoice-header">
                        <h1>INVOICE</h1>
                        <p>Ecom Store System</p>
                        <p>Date: ${currentDate}</p>
                    </div>
                    
                    <div class="invoice-info">
                        <div class="customer-info">
                            <h3>Customer Information</h3>
                            <p><strong>Name:</strong> ${orderData.customerName || (orderData.customer ? orderData.customer.fullName : 'Guest Customer')}</p>
                            <p><strong>Email:</strong> ${orderData.customerEmail || (orderData.customer ? orderData.customer.email : '')}</p>
                            <p><strong>Phone:</strong> ${orderData.customerPhone || (orderData.customer ? orderData.customer.phoneNumber : '')}</p>
                        </div>
                        
                        <div class="order-info">
                            <h3>Order Information</h3>
                            <p><strong>Order Date:</strong> ${orderDate}</p>
                            <p><strong>Order Time:</strong> ${orderTime}</p>
                            <p><strong>Shipping Address:</strong> ${orderData.shippingAddress}</p>
                            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
                        </div>
                    </div>
                    
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Thêm các mục sản phẩm
            if (orderData.orderItems && orderData.orderItems.length > 0) {
                orderData.orderItems.forEach((item, index) => {
                    const subtotal = item.price * item.quantity;
                    // Đảm bảo luôn có tên sản phẩm để hiển thị
                    const productName = item.name || (item.product ? item.product.name : `Product #${index + 1}`);
                    
                    billContent += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${productName}</td>
                            <td>${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.price)}</td>
                            <td class="text-right">${formatCurrency(subtotal)}</td>
                        </tr>
                    `;
                });
            } else {
                // Nếu không có mục nào, hiển thị thông báo
                billContent += `
                    <tr>
                        <td colspan="5" style="text-align: center">No items in this order</td>
                    </tr>
                `;
            }
            
            // Thêm tổng tiền
            billContent += `
                        <tr class="total-row">
                            <td colspan="4" class="text-right">Total Amount:</td>
                            <td class="text-right">${formatCurrency(orderData.totalAmount)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="invoice-footer">
                    <p>Thank you for your purchase!</p>
                    <p>For any questions, please contact our customer service.</p>
                </div>
            </body>
            </html>
            `;
            
            // Ghi nội dung vào cửa sổ mới
            printWindow.document.open();
            printWindow.document.write(billContent);
            printWindow.document.close();
            
            // Tự động in (nếu người dùng muốn)
            // printWindow.print();
            
            return true;
        } catch (error) {
            console.error('Error printing bill:', error);
            toastService.error('Error generating bill');
            return false;
        }
    }
}

export default new OrderService(); 