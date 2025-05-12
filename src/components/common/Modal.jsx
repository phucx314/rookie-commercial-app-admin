import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import './Modal.css';

/**
 * Modal component chung có thể tái sử dụng trong toàn bộ ứng dụng
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Trạng thái hiển thị của modal
 * @param {function} props.onClose - Hàm để đóng modal
 * @param {string} props.title - Tiêu đề của modal
 * @param {React.ReactNode} props.children - Nội dung của modal
 * @param {React.ReactNode} props.footer - Footer custom của modal (nếu không cung cấp sẽ dùng nút đóng mặc định)
 * @param {string} props.maxWidth - Chiều rộng tối đa của modal (mặc định: 600px)
 * @param {string} props.className - Class CSS bổ sung cho container
 * @returns {React.ReactElement|null}
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth,
  className = ''
}) => {
  // Xử lý đóng modal khi nhấn ESC
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    // Ngăn scroll trên body khi modal đang mở
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Khôi phục scroll khi unmount
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Xử lý click vào overlay để đóng modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Ngăn chặn sự kiện lan truyền từ container
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  // Nếu modal không mở, không hiển thị gì
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className={`modal-container ${className}`} 
        onClick={handleContainerClick}
        style={{ maxWidth: maxWidth || '600px' }}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={onClose}>
            <XMarkIcon />
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal; 