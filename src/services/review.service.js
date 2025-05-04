import axios from '../api/axios';

class ReviewService {
    async getReviewsByProductId(productId) {
        const response = await axios.get(`/Review/product/${productId}`);
        return response.data;
    }
    async getReviewsByUserId(userId) {
        const response = await axios.get(`/Review/user/${userId}`);
        return response.data;
    }
}
export default new ReviewService(); 