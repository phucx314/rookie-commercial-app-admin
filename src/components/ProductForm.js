// import React, { useState } from 'react';
// import { Form, Button, Alert } from 'react-bootstrap';
// import { createProduct } from '../services/product.service';

// const ProductForm = () => {
//     const [formData, setFormData] = useState({
//         name: '',
//         description: '',
//         price: '',
//         categoryId: '',
//         stock: ''
//     });
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prevState => ({
//             ...prevState,
//             [name]: value
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             const newProduct = await createProduct(formData);
//             setSuccess('Product created successfully!');
//             setError('');
//             setFormData({
//                 name: '',
//                 description: '',
//                 price: '',
//                 categoryId: '',
//                 stock: ''
//             });
//         } catch (err) {
//             setError('Failed to create product. Please try again.');
//             setSuccess('');
//         }
//     };

//     return (
//         <Form onSubmit={handleSubmit}>
//             {error && <Alert variant="danger">{error}</Alert>}
//             {success && <Alert variant="success">{success}</Alert>}
            
//             <Form.Group className="mb-3">
//                 <Form.Label>Product Name</Form.Label>
//                 <Form.Control
//                     type="text"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     required
//                 />
//             </Form.Group>

//             <Form.Group className="mb-3">
//                 <Form.Label>Description</Form.Label>
//                 <Form.Control
//                     as="textarea"
//                     name="description"
//                     value={formData.description}
//                     onChange={handleChange}
//                     required
//                 />
//             </Form.Group>

//             <Form.Group className="mb-3">
//                 <Form.Label>Price</Form.Label>
//                 <Form.Control
//                     type="number"
//                     name="price"
//                     value={formData.price}
//                     onChange={handleChange}
//                     required
//                 />
//             </Form.Group>

//             <Form.Group className="mb-3">
//                 <Form.Label>Category ID</Form.Label>
//                 <Form.Control
//                     type="text"
//                     name="categoryId"
//                     value={formData.categoryId}
//                     onChange={handleChange}
//                     required
//                 />
//             </Form.Group>

//             <Form.Group className="mb-3">
//                 <Form.Label>Stock</Form.Label>
//                 <Form.Control
//                     type="number"
//                     name="stock"
//                     value={formData.stock}
//                     onChange={handleChange}
//                     required
//                 />
//             </Form.Group>

//             <Button variant="primary" type="submit">
//                 Create Product
//             </Button>
//         </Form>
//     );
// };

// export default ProductForm; 