import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Tạo mảng các trang hiển thị
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5; // Số trang tối đa hiển thị

        if (totalPages <= maxPagesToShow) {
            // Nếu tổng số trang ít hơn hoặc bằng max, hiển thị tất cả
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Hiển thị một số trang giới hạn và dấu "..."
            let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = startPage + maxPagesToShow - 1;

            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }

            // Trang đầu tiên
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) pages.push('...');
            }

            // Các trang giữa
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Trang cuối cùng
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="pagination">
            <button 
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeftIcon className="pagination-icon" />
            </button>
            
            {getPageNumbers().map((page, index) => (
                page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                    <button
                        key={`page-${page}`}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                )
            ))}
            
            <button 
                className="pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRightIcon className="pagination-icon" />
            </button>
        </div>
    );
};

export default Pagination; 