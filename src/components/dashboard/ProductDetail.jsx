import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { productService, categoryService, storeService, toastService } from '../../services';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [product, setProduct] = useState(null);
    const [category, setCategory] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    useEffect(() => {
        fetchProductDetails();
    }, [id]);
    
    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const productData = await productService.getProductById(id);
            setProduct(productData);
            
            // Fetch category and store info
            if (productData.categoryId) {
                try {
                    const categoryData = await categoryService.getCategoryById(productData.categoryId);
                    setCategory(categoryData);
                } catch (err) {
                    console.error('Unable to load category information:', err);
                }
            }
            
            if (productData.storeId) {
                try {
                    const storeData = await storeService.getStoreById(productData.storeId);
                    setStore(storeData);
                } catch (err) {
                    console.error('Unable to load store information:', err);
                }
            }
        } catch (err) {
            toastService.error('Unable to load product information. Please try again later.');
            console.error('Error loading product information:', err);
            navigate('/products'); // Redirect to product list if error
        } finally {
            setLoading(false);
        }
    };
    
    const handleUpdateProduct = async (updatedData) => {
        try {
            await toastService.promise(
                productService.updateProduct(id, updatedData),
                {
                    pending: 'Updating product...',
                    success: 'Product updated successfully!',
                    error: 'Unable to update product. Please try again.'
                }
            );
            setIsEditModalOpen(false);
            fetchProductDetails(); // Reload product info after update
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };
    
    const handleDeleteProduct = async () => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await toastService.promise(
                    productService.deleteProduct(id),
                    {
                        pending: 'Deleting product...',
                        success: 'Product deleted successfully!',
                        error: 'Unable to delete product. Please try again.'
                    }
                );
                navigate('/products'); // Redirect to product list after delete
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };
    
    const renderRating = () => {
        if (!product.reviews || product.reviews.length === 0) return 'No reviews yet';
        const avgRating = productService.calculateAverageRating(product);
        return (
            <div className="product-detail-rating">
                <span>{avgRating.toFixed(1)}</span>
                <StarIcon className="star-icon" />
                <span className="review-count">({product.reviews.length} reviews)</span>
            </div>
        );
    };
    
    if (loading) return <div className="product-detail-loading">Loading product information...</div>;
    if (!product) return <div className="product-detail-error">Product not found</div>;
    
    return (
        <div className="product-detail-container">
            {/* Header with navigation and actions */}
            <div className="product-detail-header">
                <button onClick={() => navigate('/products')} className="back-button">
                    <ArrowLeftIcon className="back-icon" />
                    <span>Back to list</span>
                </button>
                
                <div className="product-detail-actions">
                    <button 
                        className="edit-product-btn"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <PencilIcon className="action-icon" />
                        <span>Edit</span>
                    </button>
                    <button 
                        className="delete-product-btn"
                        onClick={handleDeleteProduct}
                    >
                        <TrashIcon className="action-icon" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
            
            {/* Main content */}
            <div className="product-detail-content">
                <div className="product-detail-left">
                    <div className="product-detail-image-container">
                        <img 
                            src={product.imageUrl || '/placeholder.png'} 
                            alt={product.name}
                            className="product-detail-image"
                        />
                    </div>
                </div>
                
                <div className="product-detail-right">
                    <h1 className="product-detail-name">{product.name}</h1>
                    
                    <div className="product-detail-meta">
                        {category && (
                            <div className="product-detail-category">
                                <span className="meta-label">Category:</span>
                                <span className="meta-value">{category.name}</span>
                            </div>
                        )}
                        
                        {store && (
                            <div className="product-detail-store">
                                <span className="meta-label">Store:</span>
                                <span className="meta-value">{store.name}</span>
                            </div>
                        )}
                        
                        <div className="product-detail-ratings">
                            <span className="meta-label">Rating:</span>
                            {renderRating()}
                        </div>
                    </div>
                    
                    <div className="product-detail-price">
                        <span className="meta-label">Price:</span>
                        <span className="price-value">{productService.formatPrice(product.price)}</span>
                    </div>
                    
                    <div className="product-detail-stock">
                        <span className="meta-label">In Stock:</span>
                        <span className={`stock-value ${product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {product.stockQuantity} items
                        </span>
                    </div>
                    
                    <div className="product-detail-dates">
                        <div className="product-detail-created">
                            <span className="meta-label">Created: </span>
                            <span className="meta-value">{productService.formatDate(product.createdAt)}</span>
                        </div>
                        <div className="product-detail-updated">
                            <span className="meta-label">Last updated: </span>
                            <span className="meta-value">{productService.formatDate(product.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Description section */}
            <div className="product-detail-description">
                <h2>Product Description</h2>
                <div className="description-content">
                    {product.description || 'No description available for this product.'}
                </div>
            </div>
            
            {/* Reviews section */}
            {product.reviews && product.reviews.length > 0 && (
                <div className="product-detail-reviews">
                    <h2>Product Reviews ({product.reviews.length})</h2>
                    <div className="reviews-list">
                        {product.reviews.map(review => (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <div className="review-user">{review.userName || 'Anonymous User'}</div>
                                    <div className="review-rating">
                                        {review.rating}
                                        <StarIcon className="star-icon" />
                                    </div>
                                </div>
                                <div className="review-date">{productService.formatDate(review.createdAt)}</div>
                                <div className="review-content">{review.comment}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Edit Product</h2>
                        <input
                            type="text"
                            placeholder="Product Name"
                            value={product.name}
                            onChange={(e) => setProduct({ ...product, name: e.target.value })}
                        />
                        <textarea
                            placeholder="Description"
                            value={product.description}
                            onChange={(e) => setProduct({ ...product, description: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={product.price}
                            onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) })}
                        />
                        <input
                            type="number"
                            placeholder="Stock Quantity"
                            value={product.stockQuantity}
                            onChange={(e) => setProduct({ ...product, stockQuantity: parseInt(e.target.value) })}
                        />
                        <input
                            type="text"
                            placeholder="Image URL"
                            value={product.imageUrl}
                            onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button onClick={() => handleUpdateProduct(product)}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail; 