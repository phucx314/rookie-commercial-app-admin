// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { createInStoreOrder, searchCustomers } from '../api/orderApi';
// import { getProducts, searchProducts } from '../api/productApi';
// import { message, Input, Button, Select, Table, Form, Card, Typography, Space, Radio, Divider, InputNumber, Tabs } from 'antd';
// import { PlusOutlined, SearchOutlined, UserAddOutlined, ShoppingCartOutlined } from '@ant-design/icons';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TabPane } = Tabs;

// const CreateInStoreOrderPage = () => {
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [existingCustomerForm] = Form.useForm();
//   const [newCustomerForm] = Form.useForm();
//   const [activeTab, setActiveTab] = useState('1');

//   // State cho khách hàng
//   const [searchTerm, setSearchTerm] = useState('');
//   const [customers, setCustomers] = useState([]);
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [isNewCustomer, setIsNewCustomer] = useState(false);

//   // State cho sản phẩm
//   const [products, setProducts] = useState([]);
//   const [productSearchTerm, setProductSearchTerm] = useState('');
//   const [selectedProducts, setSelectedProducts] = useState([]);
//   const [totalAmount, setTotalAmount] = useState(0);

//   // State cho đơn hàng
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadInitialProducts();
//   }, []);

//   useEffect(() => {
//     // Tính tổng tiền khi sản phẩm được chọn thay đổi
//     calculateTotal();
//   }, [selectedProducts]);

//   const loadInitialProducts = async () => {
//     try {
//       const data = await getProducts();
//       setProducts(data);
//     } catch (error) {
//       message.error('Không thể tải danh sách sản phẩm');
//     }
//   };

//   const handleSearchCustomers = async () => {
//     if (!searchTerm) return;

//     try {
//       const searchParams = {};
//       if (searchTerm.includes('@')) {
//         searchParams.email = searchTerm;
//       } else {
//         searchParams.username = searchTerm;
//       }

//       const data = await searchCustomers(searchParams);
//       setCustomers(data);
//     } catch (error) {
//       message.error('Lỗi khi tìm kiếm khách hàng');
//     }
//   };

//   const handleSearchProducts = async () => {
//     try {
//       if (!productSearchTerm) {
//         loadInitialProducts();
//         return;
//       }

//       const data = await searchProducts(productSearchTerm);
//       setProducts(data);
//     } catch (error) {
//       message.error('Lỗi khi tìm kiếm sản phẩm');
//     }
//   };

//   const handleSelectCustomer = (customer) => {
//     setSelectedCustomer(customer);
//     setIsNewCustomer(false);
//     setActiveTab('2'); // Chuyển sang tab sản phẩm
//   };

//   const handleAddToCart = (product) => {
//     const existingProduct = selectedProducts.find(p => p.id === product.id);
    
//     if (existingProduct) {
//       // Tăng số lượng nếu sản phẩm đã được chọn
//       const updatedProducts = selectedProducts.map(p => 
//         p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
//       );
//       setSelectedProducts(updatedProducts);
//     } else {
//       // Thêm sản phẩm mới
//       setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
//     }
//   };

//   const handleRemoveProduct = (productId) => {
//     setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
//   };

//   const handleChangeQuantity = (productId, newQuantity) => {
//     if (newQuantity <= 0) {
//       handleRemoveProduct(productId);
//       return;
//     }

//     const updatedProducts = selectedProducts.map(p => 
//       p.id === productId ? { ...p, quantity: newQuantity } : p
//     );
//     setSelectedProducts(updatedProducts);
//   };

//   const calculateTotal = () => {
//     const total = selectedProducts.reduce((sum, item) => {
//       return sum + (item.price * item.quantity);
//     }, 0);
//     setTotalAmount(total);
//     form.setFieldsValue({ totalAmount: total });
//   };

//   const handleSubmitNewCustomer = () => {
//     newCustomerForm.validateFields().then(values => {
//       setIsNewCustomer(true);
//       setSelectedCustomer(null);
//       setActiveTab('2'); // Chuyển sang tab sản phẩm
//     });
//   };

//   const handleCreateOrder = async () => {
//     try {
//       await form.validateFields();
      
//       if (selectedProducts.length === 0) {
//         message.error('Vui lòng chọn ít nhất một sản phẩm');
//         return;
//       }

//       if (!selectedCustomer && !isNewCustomer) {
//         message.error('Vui lòng chọn khách hàng hoặc tạo khách hàng mới');
//         return;
//       }

//       setLoading(true);

//       const orderData = {
//         totalAmount,
//         shippingAddress: form.getFieldValue('shippingAddress'),
//         status: form.getFieldValue('status'),
//         paymentStatus: form.getFieldValue('paymentStatus'),
//         paymentMethod: form.getFieldValue('paymentMethod'),
//         orderItems: selectedProducts.map(p => ({
//           productId: p.id,
//           quantity: p.quantity,
//           price: p.price
//         }))
//       };

//       if (isNewCustomer) {
//         // Sử dụng thông tin khách hàng mới
//         const newCustomerData = await newCustomerForm.validateFields();
//         orderData.customer = newCustomerData;
//       } else {
//         // Sử dụng khách hàng hiện có
//         orderData.customerId = selectedCustomer.id;
//       }

//       const result = await createInStoreOrder(orderData);
      
//       message.success('Tạo đơn hàng thành công!');
//       navigate('/orders');
//     } catch (error) {
//       message.error(`Lỗi khi tạo đơn hàng: ${error.response?.data || error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const customerColumns = [
//     {
//       title: 'Tên đăng nhập',
//       dataIndex: 'username',
//     },
//     {
//       title: 'Email',
//       dataIndex: 'email',
//     },
//     {
//       title: 'Họ tên',
//       dataIndex: 'fullName',
//     },
//     {
//       title: 'Thao tác',
//       key: 'action',
//       render: (_, record) => (
//         <Button type="primary" onClick={() => handleSelectCustomer(record)}>
//           Chọn
//         </Button>
//       ),
//     },
//   ];

//   const productColumns = [
//     {
//       title: 'Tên sản phẩm',
//       dataIndex: 'name',
//     },
//     {
//       title: 'Giá',
//       dataIndex: 'price',
//       render: (price) => `${price.toLocaleString()} đ`,
//     },
//     {
//       title: 'Số lượng tồn',
//       dataIndex: 'stockQuantity',
//     },
//     {
//       title: 'Thao tác',
//       key: 'action',
//       render: (_, record) => (
//         <Button 
//           type="primary" 
//           icon={<PlusOutlined />} 
//           onClick={() => handleAddToCart(record)}
//           disabled={record.stockQuantity <= 0}
//         >
//           Thêm
//         </Button>
//       ),
//     },
//   ];

//   const cartColumns = [
//     {
//       title: 'Tên sản phẩm',
//       dataIndex: 'name',
//     },
//     {
//       title: 'Giá',
//       dataIndex: 'price',
//       render: (price) => `${price.toLocaleString()} đ`,
//     },
//     {
//       title: 'Số lượng',
//       dataIndex: 'quantity',
//       render: (_, record) => (
//         <InputNumber 
//           min={1} 
//           max={record.stockQuantity} 
//           value={record.quantity} 
//           onChange={(value) => handleChangeQuantity(record.id, value)}
//         />
//       ),
//     },
//     {
//       title: 'Thành tiền',
//       key: 'subtotal',
//       render: (_, record) => `${(record.price * record.quantity).toLocaleString()} đ`,
//     },
//     {
//       title: 'Thao tác',
//       key: 'action',
//       render: (_, record) => (
//         <Button type="danger" onClick={() => handleRemoveProduct(record.id)}>
//           Xóa
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Title level={2}>Tạo đơn hàng trực tiếp</Title>

//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <TabPane tab="1. Chọn khách hàng" key="1">
//           <Card title="Tìm kiếm khách hàng hiện có">
//             <Space style={{ marginBottom: '20px' }}>
//               <Input
//                 placeholder="Tìm kiếm theo tên đăng nhập hoặc email"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 style={{ width: 300 }}
//                 prefix={<SearchOutlined />}
//               />
//               <Button type="primary" onClick={handleSearchCustomers}>
//                 Tìm kiếm
//               </Button>
//             </Space>

//             {customers.length > 0 && (
//               <Table
//                 columns={customerColumns}
//                 dataSource={customers}
//                 rowKey="id"
//                 pagination={false}
//                 size="middle"
//               />
//             )}
//           </Card>

//           <Divider>HOẶC</Divider>

//           <Card title="Tạo khách hàng mới">
//             <Form
//               form={newCustomerForm}
//               layout="vertical"
//               onFinish={handleSubmitNewCustomer}
//             >
//               <Form.Item
//                 name="username"
//                 label="Tên đăng nhập"
//                 rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
//               >
//                 <Input prefix={<UserAddOutlined />} />
//               </Form.Item>

//               <Form.Item
//                 name="email"
//                 label="Email"
//                 rules={[
//                   { required: true, message: 'Vui lòng nhập email' },
//                   { type: 'email', message: 'Email không hợp lệ' }
//                 ]}
//               >
//                 <Input />
//               </Form.Item>

//               <Form.Item
//                 name="fullName"
//                 label="Họ tên"
//                 rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
//               >
//                 <Input />
//               </Form.Item>

//               <Form.Item
//                 name="phoneNumber"
//                 label="Số điện thoại"
//               >
//                 <Input />
//               </Form.Item>

//               <Form.Item
//                 name="address"
//                 label="Địa chỉ"
//               >
//                 <Input.TextArea rows={3} />
//               </Form.Item>

//               <Form.Item>
//                 <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
//                   Tạo khách hàng mới và tiếp tục
//                 </Button>
//               </Form.Item>
//             </Form>
//           </Card>
//         </TabPane>

//         <TabPane tab="2. Chọn sản phẩm" key="2">
//           <Card title="Tìm kiếm sản phẩm">
//             <Space style={{ marginBottom: '20px' }}>
//               <Input
//                 placeholder="Tìm kiếm sản phẩm theo tên"
//                 value={productSearchTerm}
//                 onChange={(e) => setProductSearchTerm(e.target.value)}
//                 style={{ width: 300 }}
//                 prefix={<SearchOutlined />}
//               />
//               <Button type="primary" onClick={handleSearchProducts}>
//                 Tìm kiếm
//               </Button>
//             </Space>

//             <Table
//               columns={productColumns}
//               dataSource={products}
//               rowKey="id"
//               pagination={false}
//               size="middle"
//             />
//           </Card>

//           <Divider />

//           <Card title="Giỏ hàng">
//             <Table
//               columns={cartColumns}
//               dataSource={selectedProducts}
//               rowKey="id"
//               pagination={false}
//               size="middle"
//               summary={() => (
//                 <Table.Summary.Row>
//                   <Table.Summary.Cell colSpan={3}><strong>Tổng cộng</strong></Table.Summary.Cell>
//                   <Table.Summary.Cell><strong>{totalAmount.toLocaleString()} đ</strong></Table.Summary.Cell>
//                   <Table.Summary.Cell></Table.Summary.Cell>
//                 </Table.Summary.Row>
//               )}
//             />

//             {selectedProducts.length > 0 && (
//               <div style={{ marginTop: '20px', textAlign: 'right' }}>
//                 <Button type="primary" onClick={() => setActiveTab('3')}>
//                   Tiếp tục
//                 </Button>
//               </div>
//             )}
//           </Card>
//         </TabPane>

//         <TabPane tab="3. Xác nhận đơn hàng" key="3">
//           <Card title="Thông tin đơn hàng">
//             <Form
//               form={form}
//               layout="vertical"
//               initialValues={{
//                 status: 'Delivered',
//                 paymentStatus: 'Paid',
//                 paymentMethod: 'CashOnDelivery',
//                 totalAmount: totalAmount
//               }}
//             >
//               <Form.Item
//                 name="shippingAddress"
//                 label="Địa chỉ giao hàng"
//                 rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
//               >
//                 <Input.TextArea rows={3} />
//               </Form.Item>

//               <Form.Item
//                 name="status"
//                 label="Trạng thái đơn hàng"
//                 rules={[{ required: true }]}
//               >
//                 <Radio.Group>
//                   <Radio value="Processing">Đang xử lý</Radio>
//                   <Radio value="Shipped">Đang giao hàng</Radio>
//                   <Radio value="Delivered">Đã giao hàng</Radio>
//                 </Radio.Group>
//               </Form.Item>

//               <Form.Item
//                 name="paymentStatus"
//                 label="Trạng thái thanh toán"
//                 rules={[{ required: true }]}
//               >
//                 <Radio.Group>
//                   <Radio value="Pending">Chưa thanh toán</Radio>
//                   <Radio value="Paid">Đã thanh toán</Radio>
//                 </Radio.Group>
//               </Form.Item>

//               <Form.Item
//                 name="paymentMethod"
//                 label="Phương thức thanh toán"
//                 rules={[{ required: true }]}
//               >
//                 <Radio.Group>
//                   <Radio value="CashOnDelivery">Tiền mặt</Radio>
//                   <Radio value="CreditCard">Thẻ tín dụng</Radio>
//                   <Radio value="BankTransfer">Chuyển khoản</Radio>
//                   <Radio value="EWallet">Ví điện tử</Radio>
//                 </Radio.Group>
//               </Form.Item>

//               <Form.Item
//                 name="totalAmount"
//                 label="Tổng tiền"
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                   disabled
//                 />
//               </Form.Item>

//               <Divider />

//               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <Button onClick={() => setActiveTab('2')}>
//                   Quay lại
//                 </Button>
//                 <Button 
//                   type="primary" 
//                   onClick={handleCreateOrder} 
//                   loading={loading}
//                   icon={<ShoppingCartOutlined />}
//                 >
//                   Tạo đơn hàng
//                 </Button>
//               </div>
//             </Form>
//           </Card>
//         </TabPane>
//       </Tabs>
//     </div>
//   );
// };

// export default CreateInStoreOrderPage; 