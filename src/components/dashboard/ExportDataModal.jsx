import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon, DocumentIcon, ArchiveBoxIcon, CalendarIcon } from '@heroicons/react/24/outline';
import exportService from '../../services/export.service';
import dashboardService from '../../services/dashboard.service';
import { toastService } from '../../services';
import Modal from '../common/Modal';
import ExportedFilesList from './ExportedFilesList';
import './ExportDataModal.css';

const ExportDataModal = ({ 
  isOpen, 
  onClose, 
  stats = {}, 
  topStores = [], 
  topProducts = [], 
  topCategories = [], 
  ordersByDate = [],
  revenueByDate = [],
  dashboardDateRange
}) => {
  // State for checkboxes
  const [selectedData, setSelectedData] = useState({
    stats: true,
    stores: true,
    products: true,
    categories: true,
    chart: true
  });
  
  // State for export format
  const [exportFormat, setExportFormat] = useState('excel');
  
  // State for files list modal
  const [showFilesList, setShowFilesList] = useState(false);
  
  // State for PDF export mode
  const [pdfExportMode, setPdfExportMode] = useState('separate'); // 'separate' or 'zip'
  
  // State for date range - khởi tạo từ dashboardDateRange khi có
  const [dateRange, setDateRange] = useState(dashboardDateRange || {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Default: last 30 days
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  
  // State để theo dõi đã chỉnh sửa thủ công date range chưa
  const [manuallyEdited, setManuallyEdited] = useState(false);
  
  // Cập nhật dateRange khi dashboardDateRange thay đổi, nhưng chỉ khi chưa chỉnh sửa thủ công
  useEffect(() => {
    if (!manuallyEdited && dashboardDateRange && dashboardDateRange.startDate && dashboardDateRange.endDate) {
      setDateRange(dashboardDateRange);
    }
  }, [dashboardDateRange, manuallyEdited]);
  
  // State for date range errors
  const [dateError, setDateError] = useState('');
  
  // Handle date change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setManuallyEdited(true); // Đánh dấu đã chỉnh sửa thủ công
    setDateError('');
  };
  
  // Validate date range
  const validateDateRange = () => {
    try {
      dashboardService.validateDateRange(dateRange.startDate, dateRange.endDate);
      setDateError('');
      return true;
    } catch (error) {
      setDateError(error.message);
      return false;
    }
  };
  
  // Handle data selection change
  const handleDataSelectionChange = (e) => {
    const { name, checked } = e.target;
    setSelectedData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle format change
  const handleFormatChange = (e) => {
    setExportFormat(e.target.value);
  };
  
  // Handle PDF export mode change
  const handlePdfExportModeChange = (e) => {
    setPdfExportMode(e.target.value);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    setSelectedData({
      stats: true,
      stores: true,
      products: true,
      categories: true,
      chart: true
    });
  };
  
  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedData({
      stats: false,
      stores: false,
      products: false,
      categories: false,
      chart: false
    });
  };
  
  // Filter data based on date range
  const filterDataByDateRange = (data) => {
    // If no data or not filtered by date
    if (!data) return data;
    
    // Filter data based on date range
    return {
      ...data,
      chart: selectedData.chart ? {
        ordersByDate: ordersByDate ? ordersByDate.filter(item => {
          const date = new Date(item.date);
          return date >= new Date(dateRange.startDate) && date <= new Date(dateRange.endDate);
        }) : [],
        revenueByDate: revenueByDate ? revenueByDate.filter(item => {
          const date = new Date(item.date);
          return date >= new Date(dateRange.startDate) && date <= new Date(dateRange.endDate);
        }) : []
      } : null
    };
  };
  
  // Fetch new data based on selected date range
  const fetchDataForExport = async () => {
    try {
      // Tạo date range để gửi lên API - thêm +1 ngày cho endDate để bao gồm toàn bộ ngày hiện tại
      const apiDateRange = {
        startDate: dateRange.startDate,
        // Thêm 1 ngày cho endDate để bao gồm cả ngày được chọn
        endDate: new Date(new Date(dateRange.endDate).setDate(new Date(dateRange.endDate).getDate() + 1))
          .toISOString().split('T')[0]
      };
      
      // Fetch dashboard data with the export date range
      const data = await dashboardService.getDashboardData(apiDateRange);
      
      // Lọc bỏ ngày cuối cùng (ngày +1) từ dữ liệu biểu đồ
      const filteredOrdersByDate = data.ordersByDate ? data.ordersByDate.slice(0, -1) : [];
      const filteredRevenueByDate = data.revenueByDate ? data.revenueByDate.slice(0, -1) : [];
      
      return {
        stats: {
          totalProducts: {
            count: data.stats.productStats.totalCount,
            quantity: data.stats.productStats.totalQuantity,
            label: "Total Products",
            sublabel: "products / quantity",
          },
          totalValue: {
            value: data.stats.totalInventoryValue,
            label: "Total Value",
            sublabel: "inventory value",
          },
          totalCustomers: {
            count: data.stats.totalCustomers,
            label: "Total Customers",
            sublabel: "customers who purchased",
          },
          totalRevenue: {
            value: data.stats.totalRevenue,
            label: "Total Revenue",
            sublabel: "from all stores",
          },
        },
        topStores: data.topStores,
        topProducts: data.topProducts,
        topCategories: data.topCategories,
        ordersByDate: filteredOrdersByDate,
        revenueByDate: filteredRevenueByDate
      };
    } catch (error) {
      console.error('Error fetching data for export:', error);
      toastService.error('Error fetching data for export: ' + error.message);
      throw error;
    }
  };
  
  // Handle export data
  const handleExport = async () => {
    // Check if any data is selected
    const hasSelection = Object.values(selectedData).some(value => value);
    
    if (!hasSelection) {
      toastService.warning('Please select at least one data type to export');
      return;
    }
    
    // Validate date range
    if (!validateDateRange()) {
      toastService.error(dateError);
      return;
    }
    
    try {
      // Fetch data with the selected date range 
      // (important: ensures all data is consistent with the date range)
      const exportData = await fetchDataForExport();
      
      // Prepare data for export based on selected options
      const data = {};
      
      if (selectedData.stats) {
        data['Overview Stats'] = exportService.prepareStatsData(exportData.stats);
      }
      
      if (selectedData.stores) {
        data['Top Stores'] = exportService.prepareTopStoresData(exportData.topStores);
      }
      
      if (selectedData.products) {
        data['Top Products'] = exportService.prepareTopProductsData(exportData.topProducts);
      }
      
      if (selectedData.categories) {
        data['Top Categories'] = exportService.prepareTopCategoriesData(exportData.topCategories);
      }
      
      if (selectedData.chart) {
        data['Sales by Date'] = exportService.prepareChartData(exportData.ordersByDate, exportData.revenueByDate);
      }
      
      if (exportFormat === 'excel') {
        // Export to Excel
        if (Object.keys(data).length > 0) {
          // Add date range to filename
          const dateRangeStr = `${dateRange.startDate}_to_${dateRange.endDate}`;
          const result = exportService.exportToExcel(data, `Dashboard_Report_${dateRangeStr}`);
          if (result) {
            toastService.success('Data exported successfully');
            onClose();
          } else {
            toastService.error('Error exporting data');
          }
        } else {
          toastService.warning('No data to export');
        }
      } else if (exportFormat === 'pdf') {
        // Prepare data for PDFs
        const pdfsToExport = [];
        
        if (selectedData.stats) {
          const statsData = exportService.prepareStatsData(exportData.stats);
          pdfsToExport.push({
            data: statsData, 
            title: 'Dashboard Overview Statistics', 
            fileName: `Dashboard_Stats_${dateRange.startDate}_to_${dateRange.endDate}`
          });
        }
        
        if (selectedData.stores) {
          const storesData = exportService.prepareTopStoresData(exportData.topStores);
          pdfsToExport.push({
            data: storesData, 
            title: 'Top Performing Stores', 
            fileName: `Dashboard_Stores_${dateRange.startDate}_to_${dateRange.endDate}`
          });
        }
        
        if (selectedData.products) {
          const productsData = exportService.prepareTopProductsData(exportData.topProducts);
          pdfsToExport.push({
            data: productsData, 
            title: 'Top Selling Products', 
            fileName: `Dashboard_Products_${dateRange.startDate}_to_${dateRange.endDate}`
          });
        }
        
        if (selectedData.categories) {
          const categoriesData = exportService.prepareTopCategoriesData(exportData.topCategories);
          pdfsToExport.push({
            data: categoriesData, 
            title: 'Top Categories by Sales', 
            fileName: `Dashboard_Categories_${dateRange.startDate}_to_${dateRange.endDate}`
          });
        }
        
        if (selectedData.chart) {
          const chartData = exportService.prepareChartData(exportData.ordersByDate, exportData.revenueByDate);
          pdfsToExport.push({
            data: chartData, 
            title: `Sales and Revenue by Date (${dateRange.startDate} to ${dateRange.endDate})`, 
            fileName: `Dashboard_Chart_Data_${dateRange.startDate}_to_${dateRange.endDate}`
          });
        }
        
        if (pdfsToExport.length > 0) {
          if (pdfExportMode === 'separate') {
            // Export each PDF separately
            let exportedCount = 0;
            for (const pdf of pdfsToExport) {
              const result = exportService.exportToPDF(pdf.data, pdf.title, pdf.fileName);
              if (result) exportedCount++;
            }
            
            if (exportedCount > 0) {
              toastService.success(`Successfully exported ${exportedCount} PDF files`);
              onClose();
            } else {
              toastService.warning('No data was exported');
            }
          } else if (pdfExportMode === 'zip') {
            // Export all PDFs as a ZIP archive
            const zipResult = await exportService.exportMultiplePDFsAsZip(pdfsToExport, `Dashboard_Reports_${dateRange.startDate}_to_${dateRange.endDate}`);
            if (zipResult) {
              toastService.success(`Successfully exported ${pdfsToExport.length} PDF files as ZIP archive`);
              onClose();
            } else {
              toastService.error('Error creating ZIP archive');
            }
          }
        } else {
          toastService.warning('No data to export');
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toastService.error('Error exporting data: ' + error.message);
    }
  };

  // Open files list modal
  const handleOpenFilesList = () => {
    setShowFilesList(true);
  };

  // Close files list modal
  const handleCloseFilesList = () => {
    setShowFilesList(false);
  };

  const modalFooter = (
    <>
      <button className="files-list-button" onClick={handleOpenFilesList}>
        <DocumentIcon />
        Files
      </button>
      <button className="modal-cancel-button" onClick={onClose}>
        Cancel
      </button>
      <button className="modal-confirm-button" onClick={handleExport}>
        <ArrowDownTrayIcon />
        Export Data
      </button>
    </>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Export Dashboard Data"
        footer={modalFooter}
        className="export-modal-container"
      >
        <div className="export-modal-content">
          {/* Date Range Selection */}
          <div className="export-date-range">
            <div className="section-title">
              <h3><CalendarIcon /> Select Date Range:</h3>
            </div>
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label>From:</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  min={dashboardService.MIN_DATE ? dashboardService.MIN_DATE.toISOString().split('T')[0] : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="date-input-group">
                <label>To:</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  min={dashboardService.MIN_DATE ? dashboardService.MIN_DATE.toISOString().split('T')[0] : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            {dateError && <div className="date-error">{dateError}</div>}
            <div className="date-range-note">
              <p>Note: Date range will be applied to all metrics including statistics, rankings, and chart data.</p>
              {!manuallyEdited && dashboardDateRange && dashboardDateRange.startDate && dashboardDateRange.endDate ? (
                <p className="date-range-sync"><span>✓</span> Using date range from dashboard.</p>
              ) : manuallyEdited ? (
                <p className="date-range-custom"><span>📅</span> Using custom date range.</p>
              ) : null}
            </div>
          </div>
          
          <div className="export-data-selection">
            <div className="section-title">
              <h3>Select data to export:</h3>
              <div className="selection-actions">
                <button type="button" onClick={handleSelectAll}>Select All</button>
                <button type="button" onClick={handleDeselectAll}>Deselect All</button>
              </div>
            </div>
            
            <div className="data-checkboxes">
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="stats"
                  name="stats"
                  checked={selectedData.stats}
                  onChange={handleDataSelectionChange}
                />
                <label htmlFor="stats">Overview Statistics</label>
              </div>
              
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="stores"
                  name="stores"
                  checked={selectedData.stores}
                  onChange={handleDataSelectionChange}
                />
                <label htmlFor="stores">Top Stores List</label>
              </div>
              
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="products"
                  name="products"
                  checked={selectedData.products}
                  onChange={handleDataSelectionChange}
                />
                <label htmlFor="products">Top Products List</label>
              </div>
              
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="categories"
                  name="categories"
                  checked={selectedData.categories}
                  onChange={handleDataSelectionChange}
                />
                <label htmlFor="categories">Popular Categories</label>
              </div>
              
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="chart"
                  name="chart"
                  checked={selectedData.chart}
                  onChange={handleDataSelectionChange}
                />
                <label htmlFor="chart">Revenue/Orders Chart Data</label>
              </div>
            </div>
          </div>
          
          <div className="export-format-selection">
            <h3>Select export format:</h3>
            <div className="format-options">
              <div className="format-option">
                <input 
                  type="radio" 
                  id="excel"
                  name="exportFormat"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={handleFormatChange}
                />
                <label htmlFor="excel">
                  <TableCellsIcon />
                  <span>Excel (.xlsx)</span>
                  <p className="format-description">Export all selected data to a single Excel file with multiple sheets</p>
                </label>
              </div>
              
              <div className="format-option">
                <input 
                  type="radio" 
                  id="pdf"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={handleFormatChange}
                />
                <label htmlFor="pdf">
                  <DocumentTextIcon />
                  <span>PDF (.pdf)</span>
                  <p className="format-description">Export data to PDF format with options below</p>
                </label>
              </div>
              
              {/* PDF Export Options - only visible when PDF is selected */}
              {exportFormat === 'pdf' && (
                <div className="pdf-export-options">
                  <h4>PDF Export Options:</h4>
                  <div className="pdf-option">
                    <input
                      type="radio"
                      id="separate"
                      name="pdfExportMode"
                      value="separate"
                      checked={pdfExportMode === 'separate'}
                      onChange={handlePdfExportModeChange}
                    />
                    <label htmlFor="separate">
                      <DocumentTextIcon />
                      <span>Separate PDF Files</span>
                      <p className="format-description">Export each data section to a separate PDF file</p>
                    </label>
                  </div>
                  
                  <div className="pdf-option">
                    <input
                      type="radio"
                      id="zip"
                      name="pdfExportMode"
                      value="zip"
                      checked={pdfExportMode === 'zip'}
                      onChange={handlePdfExportModeChange}
                    />
                    <label htmlFor="zip">
                      <ArchiveBoxIcon />
                      <span>ZIP Archive</span>
                      <p className="format-description">Export all PDFs compressed in a single ZIP file</p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Exported Files List Modal */}
      <ExportedFilesList 
        isOpen={showFilesList} 
        onClose={handleCloseFilesList} 
      />
    </>
  );
};

export default ExportDataModal; 