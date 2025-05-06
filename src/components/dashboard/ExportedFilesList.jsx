import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DocumentIcon, DocumentTextIcon, TableCellsIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { toastService } from '../../services';
import exportService from '../../services/export.service';
import Modal from '../common/Modal';
import './ExportedFilesList.css';

const ExportedFilesList = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState([]);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'type'
  const [sortDir, setSortDir] = useState('desc'); // 'asc', 'desc'
  
  // Fetch files when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);
  
  const loadFiles = () => {
    const exportedFiles = exportService.getExportedFiles();
    setFiles([...exportedFiles]);
  };
  
  const handleDownload = (file) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toastService.error('File URL not available');
    }
  };
  
  const handleDelete = (fileId) => {
    exportService.removeExportedFile(fileId);
    loadFiles();
    toastService.success('File removed from the list');
  };
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the exported files list?')) {
      exportService.clearExportedFiles();
      loadFiles();
      toastService.success('Exported files list cleared');
    }
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort direction
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortBy(field);
      setSortDir('desc');
    }
  };
  
  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'size':
        // Nếu không có thông tin kích thước, xem như file nhỏ nhất
        const sizeA = a.size ? parseFileSizeToBytes(a.size) : 0;
        const sizeB = b.size ? parseFileSizeToBytes(b.size) : 0;
        comparison = sizeA - sizeB;
        break;
      default:
        comparison = new Date(a.date) - new Date(b.date);
    }
    
    return sortDir === 'asc' ? comparison : -comparison;
  });
  
  // Hàm chuyển đổi định dạng size (ví dụ: "1.5 MB") thành bytes để so sánh
  const parseFileSizeToBytes = (sizeString) => {
    try {
      const parts = sizeString.split(' ');
      if (parts.length !== 2) return 0;
      
      const size = parseFloat(parts[0]);
      const unit = parts[1].toUpperCase();
      
      const units = {
        'BYTES': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
      };
      
      return size * (units[unit] || 1);
    } catch (error) {
      return 0;
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'excel':
        return <TableCellsIcon className="file-icon excel" />;
      case 'pdf':
        return <DocumentTextIcon className="file-icon pdf" />;
      case 'zip':
        return <ArchiveBoxIcon className="file-icon zip" />;
      default:
        return <DocumentIcon className="file-icon" />;
    }
  };
  
  const getSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? '▲' : '▼';
  };
  
  // Modal footer with clear button
  const modalFooter = (
    <>
      <button className="clear-files-button" onClick={handleClear} disabled={files.length === 0}>
        Clear All
      </button>
      <button className="modal-cancel-button" onClick={onClose}>
        Close
      </button>
    </>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exported Files"
      footer={modalFooter}
      className="exported-files-modal"
    >
      <div className="exported-files-content">
        {files.length === 0 ? (
          <div className="no-files-message">
            <p>No exported files yet.</p>
            <p>When you export data, files will appear here for download.</p>
          </div>
        ) : (
          <>
            <p className="files-count">Showing {files.length} recently exported files</p>
            
            <div className="files-table-container">
              <table className="files-table">
                <thead>
                  <tr>
                    <th className="file-type-column">Type</th>
                    <th className="file-name-column" onClick={() => handleSort('name')}>
                      Filename {getSortIndicator('name')}
                    </th>
                    <th className="file-data-column">Contents</th>
                    <th className="file-size-column" onClick={() => handleSort('size')}>
                      Size {getSortIndicator('size')}
                    </th>
                    <th className="file-date-column" onClick={() => handleSort('date')}>
                      Export Date {getSortIndicator('date')}
                    </th>
                    <th className="file-actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiles.map((file) => (
                    <tr key={file.id}>
                      <td className="file-type-column">
                        {getFileIcon(file.type)}
                      </td>
                      <td className="file-name-column">{file.name}</td>
                      <td className="file-data-column">{file.data}</td>
                      <td className="file-size-column">{file.size || 'N/A'}</td>
                      <td className="file-date-column">{formatDate(file.date)}</td>
                      <td className="file-actions-column">
                        <div className="file-actions">
                          <button 
                            className="download-file-button"
                            onClick={() => handleDownload(file)}
                            title="Download"
                          >
                            <ArrowDownTrayIcon />
                          </button>
                          <button 
                            className="delete-file-button"
                            onClick={() => handleDelete(file.id)}
                            title="Remove from list"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="files-note">
              <p>Note: Files will be available until you close or reload the application.</p>
              <p>For best performance, large files (>10MB) should be deleted after download.</p>
              <p>Maximum: 10 recent files are stored in memory.</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ExportedFilesList; 