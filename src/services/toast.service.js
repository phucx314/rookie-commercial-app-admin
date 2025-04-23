import { toast } from 'react-toastify';

/**
 * Service quản lý các thông báo toast cho toàn bộ ứng dụng
 */
class ToastService {
  /**
   * Hiển thị thông báo thành công
   * @param {string} message - Nội dung thông báo
   * @param {object} options - Tùy chọn cấu hình cho toast
   */
  success(message, options = {}) {
    return toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Hiển thị thông báo lỗi
   * @param {string} message - Nội dung thông báo
   * @param {object} options - Tùy chọn cấu hình cho toast
   */
  error(message, options = {}) {
    return toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Hiển thị thông báo cảnh báo
   * @param {string} message - Nội dung thông báo
   * @param {object} options - Tùy chọn cấu hình cho toast
   */
  warning(message, options = {}) {
    return toast.warning(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Hiển thị thông báo thông tin
   * @param {string} message - Nội dung thông báo
   * @param {object} options - Tùy chọn cấu hình cho toast
   */
  info(message, options = {}) {
    return toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Hiển thị thông báo tải dữ liệu đang xử lý
   * @param {string} message - Nội dung thông báo
   * @param {Promise} promise - Promise cần xử lý
   * @param {object} options - Tùy chọn cấu hình cho toast
   */
  promise(promise, { pending, success, error } = {}, options = {}) {
    return toast.promise(promise, {
      pending: pending || 'Processing...',
      success: success || 'Success!',
      error: error || 'An error occurred!'
    }, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Đóng tất cả thông báo
   */
  dismiss() {
    toast.dismiss();
  }
}

export const toastService = new ToastService(); 