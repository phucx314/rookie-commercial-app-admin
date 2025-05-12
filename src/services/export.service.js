import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';

class ExportService {
  constructor() {
    // Lưu trữ danh sách file đã xuất
    this.exportedFiles = [];
  }

  /**
   * Lấy danh sách file đã xuất
   * @returns {Array} - Danh sách các file đã xuất
   */
  getExportedFiles() {
    return this.exportedFiles;
  }

  /**
   * Xóa một file khỏi danh sách
   * @param {String} fileId - ID của file cần xóa
   */
  removeExportedFile(fileId) {
    // Tìm file cần xóa
    const fileToRemove = this.exportedFiles.find(file => file.id === fileId);
    
    // Nếu file tồn tại và có URL, giải phóng URL để tránh rò rỉ bộ nhớ
    if (fileToRemove && fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    // Lọc file khỏi danh sách
    this.exportedFiles = this.exportedFiles.filter(file => file.id !== fileId);
  }

  /**
   * Xóa tất cả file khỏi danh sách
   */
  clearExportedFiles() {
    // Giải phóng tất cả URLs trước khi xóa danh sách
    this.exportedFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    
    this.exportedFiles = [];
  }

  /**
   * Thêm file vào danh sách đã xuất
   * @param {Object} fileInfo - Thông tin về file
   */
  addExportedFile(fileInfo) {
    // Kiểm tra kích thước danh sách
    if (this.exportedFiles.length >= 10) {
      // Lấy file cũ nhất để xóa
      const oldestFile = this.exportedFiles[0];
      
      // Giải phóng URL trước khi xóa
      if (oldestFile && oldestFile.url) {
        URL.revokeObjectURL(oldestFile.url);
      }
      
      // Xóa file cũ nhất
      this.exportedFiles.shift();
    }
    
    // Thêm metadata về file size nếu có thể (cho Blob)
    if (fileInfo.url && typeof fileInfo.url === 'string' && !fileInfo.size && fileInfo.blob) {
      fileInfo.size = this.formatFileSize(fileInfo.blob.size);
    }
    
    this.exportedFiles.push(fileInfo);
  }
  
  /**
   * Format kích thước file dễ đọc
   * @param {Number} bytes - Kích thước file tính bằng bytes
   * @returns {String} - Kích thước đã được format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Xuất dữ liệu ra file Excel
   * @param {Object} data - Dữ liệu cần xuất (có thể chứa nhiều sheet)
   * @param {String} fileName - Tên file xuất ra
   */
  exportToExcel(data, fileName = 'dashboard_data') {
    // Kiểm tra xem data có phải là một mảng hay không
    if (!data || Object.keys(data).length === 0) {
      console.error('No data to export');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      // Xử lý từng sheet data
      Object.entries(data).forEach(([sheetName, sheetData]) => {
        if (!sheetData || sheetData.length === 0) return;
        
        // Tạo worksheet
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        
        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      // Xuất file Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Tạo tên file với timestamp để tránh trùng lặp
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const fileNameWithTimestamp = `${fileName}_${timestamp}.xlsx`;
      
      // Lưu file
      saveAs(blob, fileNameWithTimestamp);

      // Tạo URL cho Blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Tính kích thước file
      const fileSize = this.formatFileSize(blob.size);
      
      // Thêm vào danh sách file đã xuất
      this.addExportedFile({
        id: timestamp,
        name: fileNameWithTimestamp,
        type: 'excel',
        date: new Date(),
        url: blobUrl,
        size: fileSize,
        blob: blob, // Lưu tham chiếu tới blob để có thể tính size
        data: Object.keys(data).join(', ')
      });
      
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return false;
    }
  }

  /**
   * Xuất dữ liệu thành file PDF
   * @param {Array} data - Dữ liệu cho file PDF
   * @param {String} title - Tiêu đề của file PDF
   * @param {String} fileName - Tên file
   */
  exportToPDF(data, title, fileName = 'dashboard_data') {
    if (!data || !data.length) {
      console.error('No data to export');
      return;
    }

    try {
      // Khởi tạo tài liệu PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Xử lý tiêu đề và dữ liệu để đảm bảo hiển thị đúng tiếng Việt
      // bằng cách chuyển đổi dữ liệu thành bảng HTML và sau đó xuất
      
      // Tạo tên file với timestamp để tránh trùng lặp
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const fileNameWithTimestamp = `${fileName}_${timestamp}.pdf`;
      
      // Thiết lập trang PDF
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      
      // Thêm tiêu đề
      doc.setFontSize(16);
      doc.text(title, pageWidth / 2, 15, { align: 'center' });
      
      // Thêm ngày giờ xuất báo cáo
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });
      
      // Giải pháp thay thế: Tạo bảng sử dụng autoTable nhưng với xử lý đặc biệt cho tiếng Việt
      // Chuẩn bị header
      const columns = Object.keys(data[0]).map(key => ({
        header: key,
        dataKey: key
      }));
      
      // Chuẩn bị dữ liệu - Chuyển đổi tất cả giá trị thành chuỗi ASCII đơn giản
      // Điều này đánh đổi khả năng hiển thị dấu tiếng Việt để đảm bảo nội dung có thể đọc được
      const processedData = data.map(row => {
        const newRow = {};
        Object.keys(row).forEach(key => {
          // Nếu là chuỗi, xử lý thay thế một số ký tự tiếng Việt phổ biến
          if (typeof row[key] === 'string') {
            let value = row[key];
            // Thay thế một số ký tự tiếng Việt phổ biến
            const vietnameseMap = {
              'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
              'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
              'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
              'đ': 'd',
              'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
              'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
              'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
              'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
              'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
              'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
              'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
              'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
              'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
            };
            
            // Áp dụng thay thế
            for (const [vietnamese, ascii] of Object.entries(vietnameseMap)) {
              value = value.replace(new RegExp(vietnamese, 'g'), ascii);
            }
            
            newRow[key] = value;
          } else {
            newRow[key] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
          }
        });
        return newRow;
      });
      
      // Sử dụng autoTable với dữ liệu đã xử lý
      autoTable(doc, {
        columns: columns,
        body: processedData,
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });
      
      // Tạo blob từ dữ liệu PDF
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Tính kích thước file
      const fileSize = this.formatFileSize(pdfBlob.size);
      
      // Thêm vào danh sách file đã xuất trước khi tải xuống
      this.addExportedFile({
        id: timestamp,
        name: fileNameWithTimestamp,
        type: 'pdf',
        date: new Date(),
        url: pdfUrl,
        size: fileSize,
        blob: pdfBlob, // Lưu tham chiếu tới blob để có thể tính size
        data: title
      });
      
      // Tạo và kích hoạt liên kết tải xuống
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = fileNameWithTimestamp;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Làm sạch đối tượng sau khi sử dụng
      setTimeout(() => {
        document.body.removeChild(downloadLink);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return false;
    }
  }

  /**
   * Chuẩn bị dữ liệu thống kê để xuất
   * @param {Object} stats - Dữ liệu thống kê từ Dashboard
   * @returns {Array} - Mảng dữ liệu để xuất
   */
  prepareStatsData(stats) {
    if (!stats) return [];
    
    return Object.entries(stats).map(([key, stat]) => {
      let value;
      if (key === 'totalProducts') {
        value = `${stat.count} products / ${stat.quantity} quantity`;
      } else if (key.includes('total') && key !== 'totalCustomers') {
        value = stat.value.toLocaleString('vi-VN') + ' VND';
      } else {
        value = stat.count;
      }
      
      return {
        MetricName: stat.label,
        Value: value,
        Note: stat.sublabel
      };
    });
  }

  /**
   * Chuẩn bị dữ liệu về cửa hàng hàng đầu
   * @param {Array} topStores - Dữ liệu cửa hàng từ Dashboard
   * @returns {Array} - Mảng dữ liệu để xuất
   */
  prepareTopStoresData(topStores) {
    if (!topStores || !topStores.length) return [];
    
    return topStores.map((store, index) => ({
      Rank: index + 1,
      StoreID: store.id || 'N/A',
      StoreName: store.name || 'Unnamed Store',
      Revenue: (store.revenue ? store.revenue.toLocaleString('vi-VN') : '0') + ' VND'
    }));
  }

  /**
   * Chuẩn bị dữ liệu về sản phẩm hàng đầu
   * @param {Array} topProducts - Dữ liệu sản phẩm từ Dashboard
   * @returns {Array} - Mảng dữ liệu để xuất
   */
  prepareTopProductsData(topProducts) {
    if (!topProducts || !topProducts.length) return [];
    
    return topProducts.map((product, index) => ({
      Rank: index + 1,
      ProductID: product.id || 'N/A',
      ProductName: product.name || 'Unnamed Product',
      Revenue: (product.revenue ? product.revenue.toLocaleString('vi-VN') : '0') + ' VND'
    }));
  }

  /**
   * Chuẩn bị dữ liệu về danh mục hàng đầu
   * @param {Array} topCategories - Dữ liệu danh mục từ Dashboard
   * @returns {Array} - Mảng dữ liệu để xuất
   */
  prepareTopCategoriesData(topCategories) {
    if (!topCategories || !topCategories.length) return [];
    
    return topCategories.map((category, index) => ({
      Rank: index + 1,
      CategoryID: category.id || 'N/A',
      CategoryName: category.name || 'Unnamed Category',
      SoldQuantity: category.soldQuantity || 0
    }));
  }

  /**
   * Chuẩn bị dữ liệu biểu đồ
   * @param {Array} ordersByDate - Dữ liệu đơn hàng theo ngày
   * @param {Array} revenueByDate - Dữ liệu doanh thu theo ngày
   * @returns {Array} - Mảng dữ liệu để xuất
   */
  prepareChartData(ordersByDate, revenueByDate) {
    if (!ordersByDate || !revenueByDate || !ordersByDate.length || !revenueByDate.length) return [];
    
    // Tạo map từ dữ liệu doanh thu để tìm kiếm nhanh
    const revenueMap = {};
    revenueByDate.forEach(item => {
      revenueMap[item.date] = item.revenue;
    });
    
    // Kết hợp dữ liệu từ 2 mảng
    const combinedData = ordersByDate.map(orderData => {
      const date = new Date(orderData.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      const revenue = revenueMap[orderData.date] || 0;
      
      return {
        Date: formattedDate,
        OrderCount: orderData.count,
        Revenue: revenue.toLocaleString('vi-VN') + ' VND'
      };
    });
    
    return combinedData;
  }

  /**
   * Nén nhiều file thành một file ZIP
   * @param {Array} blobs - Mảng các đối tượng {name, blob}
   * @param {String} zipFileName - Tên file zip
   * @returns {Promise} - Promise trả về kết quả
   */
  async exportAsZip(blobs, zipFileName = 'exported_data') {
    if (!blobs || blobs.length === 0) {
      console.error('No data to export as ZIP');
      return false;
    }

    try {
      // Tạo đối tượng JSZip
      const zip = new JSZip();
      
      // Thêm từng file vào ZIP
      blobs.forEach(item => {
        if (item.blob && item.name) {
          zip.file(item.name, item.blob);
        }
      });
      
      // Tạo timestamp để tránh trùng lặp
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const zipFileNameWithTimestamp = `${zipFileName}_${timestamp}.zip`;
      
      // Tạo ZIP và lưu
      const zipContent = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Mức độ nén trung bình (1-9)
        }
      });
      
      // Lưu file ZIP
      saveAs(zipContent, zipFileNameWithTimestamp);
      
      // Tạo URL cho Blob
      const zipUrl = URL.createObjectURL(zipContent);
      
      // Tính kích thước file
      const fileSize = this.formatFileSize(zipContent.size);
      
      // Thêm vào danh sách file đã xuất
      this.addExportedFile({
        id: timestamp,
        name: zipFileNameWithTimestamp,
        type: 'zip',
        date: new Date(),
        url: zipUrl,
        size: fileSize,
        blob: zipContent,
        data: `${blobs.length} files`,
      });
      
      return true;
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      return false;
    }
  }
  
  /**
   * Xuất nhiều file PDF thành một file ZIP
   * @param {Array} dataArray - Mảng các đối tượng {data, title, fileName}
   * @param {String} zipFileName - Tên file zip
   * @returns {Promise} - Promise trả về kết quả
   */
  async exportMultiplePDFsAsZip(dataArray, zipFileName = 'dashboard_pdfs') {
    if (!dataArray || !dataArray.length) {
      console.error('No data to export');
      return false;
    }
    
    try {
      const pdfFiles = [];
      
      // Tạo các file PDF
      for (const item of dataArray) {
        if (!item.data || !item.data.length) continue;
        
        // Tạo PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Thiết lập trang PDF
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFont('helvetica', 'normal');
        
        // Thêm tiêu đề
        doc.setFontSize(16);
        doc.text(item.title, pageWidth / 2, 15, { align: 'center' });
        
        // Thêm ngày giờ xuất báo cáo
        doc.setFontSize(10);
        doc.text(`Exported on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });
        
        // Chuẩn bị header
        const columns = Object.keys(item.data[0]).map(key => ({
          header: key,
          dataKey: key
        }));
        
        // Chuẩn bị dữ liệu - Chuyển đổi tiếng Việt
        const processedData = item.data.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            // Nếu là chuỗi, xử lý thay thế một số ký tự tiếng Việt phổ biến
            if (typeof row[key] === 'string') {
              let value = row[key];
              // Thay thế một số ký tự tiếng Việt phổ biến
              const vietnameseMap = {
                'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
                'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
                'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
                'đ': 'd',
                'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
                'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
                'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
                'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
                'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
                'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
                'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
                'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
                'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
              };
              
              // Áp dụng thay thế
              for (const [vietnamese, ascii] of Object.entries(vietnameseMap)) {
                value = value.replace(new RegExp(vietnamese, 'g'), ascii);
              }
              
              newRow[key] = value;
            } else {
              newRow[key] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
            }
          });
          return newRow;
        });
        
        // Sử dụng autoTable với dữ liệu đã xử lý
        autoTable(doc, {
          columns: columns,
          body: processedData,
          startY: 30,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            font: 'helvetica'
          },
          headStyles: {
            fillColor: [66, 66, 66],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          }
        });
        
        // Tạo tên file PDF
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
        const fileName = `${item.fileName || 'report'}_${timestamp}.pdf`;
        
        // Lấy blob PDF
        const pdfBlob = doc.output('blob');
        
        // Thêm vào danh sách file để nén
        pdfFiles.push({
          name: fileName,
          blob: pdfBlob
        });
      }
      
      // Nén tất cả file PDF vào một ZIP
      if (pdfFiles.length > 0) {
        return await this.exportAsZip(pdfFiles, zipFileName);
      }
      
      return false;
    } catch (error) {
      console.error('Error exporting multiple PDFs as ZIP:', error);
      return false;
    }
  }
}

export default new ExportService(); 