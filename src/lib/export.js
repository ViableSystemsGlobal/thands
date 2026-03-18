
import adminApiClient from './services/adminApiClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { api } from '@/lib/services/api';

export const exportToCSV = (data, filename) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value?.toString().replace(/"/g, '""') || ''}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

export const exportToPDF = (title, headers, body, filename) => {
  const doc = new jsPDF();
  doc.text(title, 14, 20);
  doc.autoTable({
    head: [headers],
    body: body,
    startY: 25,
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133] }, 
    styles: { fontSize: 8 },
  });
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const getProductTemplateData = () => {
  return [{
    Name: "",
    Description: "",
    Category: "",
    "Product Type": "ready_to_wear",
    "Base Price (GHS)": "",
    "Price USD": "",
    "Weight (kg)": "1",
    "SKU": "",
    "Is Featured": "No",
    "Is Active": "Yes",
    "Image URL": "",
    "Stock Quantity": "",
    "Size S Price Adjustment": "",
    "Size M Price Adjustment": "",
    "Size L Price Adjustment": "",
    "Size XL Price Adjustment": "",
    "Size XXL Price Adjustment": "",
    "Size XXXL Price Adjustment": "",
    "Size XXXXL Price Adjustment": "",
    "Size S Stock": "",
    "Size M Stock": "",
    "Size L Stock": "",
    "Size XL Stock": "",
    "Size XXL Stock": "",
    "Size XXXL Stock": "",
    "Size XXXXL Stock": ""
  }];
};

export const fetchProductsForExport = async (searchQuery = '') => {
  try {
    // Fetch all products in batches (backend limit is 1000 per request)
    const allProducts = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', batchSize.toString());
      queryParams.append('offset', offset.toString());
      queryParams.append('active', 'all'); // Get all products including inactive
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const response = await adminApiClient.get(`/products?${queryParams.toString()}`);
      // Handle different response structures
      const responseData = response.data || response;
      const products = responseData?.products || responseData || [];
      
      if (Array.isArray(products)) {
        allProducts.push(...products);
        // Check if we got fewer products than requested (means we're done)
        if (products.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      } else {
        hasMore = false;
      }
    }
    
    const products = allProducts;
    
    // Transform products to export format
    return products.map(product => {
      // Get all sizes with their prices and stock (handle both sizes and product_sizes)
      const sizes = product.sizes || product.product_sizes || [];
      const sizeMap = {};
      sizes.forEach(size => {
        const sizeName = size.size || size.name;
        if (sizeName) {
          sizeMap[sizeName] = {
            priceAdjustment: size.price_adjustment || size.price || 0,
            stock: size.stock_quantity || size.stock || 0
          };
        }
      });
      
      return {
        ID: product.id,
        Name: product.name || '',
        Description: product.description || '',
        Category: product.category || '',
        "Product Type": product.product_type || 'ready_to_wear',
        "Base Price (GHS)": product.base_price || product.price || '',
        "Price USD": product.price_usd || '',
        "Weight (kg)": product.weight || product.weight_kg || '1',
        "SKU": product.sku || '',
        "Is Featured": (product.is_featured === true || product.is_featured === 'true') ? 'Yes' : 'No',
        "Is Active": product.is_active !== false ? 'Yes' : 'No',
        "Image URL": product.image_url || '',
        "Stock Quantity": product.stock_quantity || '',
        "Size S Price Adjustment": sizeMap['S']?.priceAdjustment || '',
        "Size M Price Adjustment": sizeMap['M']?.priceAdjustment || '',
        "Size L Price Adjustment": sizeMap['L']?.priceAdjustment || '',
        "Size XL Price Adjustment": sizeMap['XL']?.priceAdjustment || '',
        "Size XXL Price Adjustment": sizeMap['XXL']?.priceAdjustment || '',
        "Size XXXL Price Adjustment": sizeMap['XXXL']?.priceAdjustment || '',
        "Size XXXXL Price Adjustment": sizeMap['XXXXL']?.priceAdjustment || '',
        "Size S Stock": sizeMap['S']?.stock || '',
        "Size M Stock": sizeMap['M']?.stock || '',
        "Size L Stock": sizeMap['L']?.stock || '',
        "Size XL Stock": sizeMap['XL']?.stock || '',
        "Size XXL Stock": sizeMap['XXL']?.stock || '',
        "Size XXXL Stock": sizeMap['XXXL']?.stock || '',
        "Size XXXXL Stock": sizeMap['XXXXL']?.stock || '',
        "Created At": product.created_at ? new Date(product.created_at).toLocaleString() : '',
        "Updated At": product.updated_at ? new Date(product.updated_at).toLocaleString() : ''
      };
    });
  } catch (error) {
    console.error('Error fetching products for export:', error);
    throw new Error(error.message || 'Failed to fetch products for export');
  }
};

export const fetchOrdersForExport = async () => {
  try {
    const data = await api.get('/orders?limit=10000');
    const orders = data.orders || data || [];

    return orders.map(order => ({
      'Order Number': order.order_number,
      'Customer Name': order.customers
        ? `${order.customers.first_name} ${order.customers.last_name}`
        : `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim(),
      'Customer Email': order.customers?.email || order.shipping_email,
      'Total Amount': order.total_amount,
      Currency: order.currency,
      Status: order.status,
      'Payment Status': order.payment_status,
      'Items Count': order.order_items?.length || 0,
      'Created At': new Date(order.created_at).toLocaleString(),
      'Updated At': order.updated_at ? new Date(order.updated_at).toLocaleString() : 'N/A'
    }));
  } catch (error) {
    console.error('Error fetching orders for export:', error);
    throw new Error(error.message || 'Failed to fetch orders for export');
  }
};

export const fetchCustomersForExport = async () => {
  try {
    const data = await api.get('/customers?limit=10000');
    const customers = data.customers || data || [];

    return customers.map(customer => ({
      'Customer ID': customer.id,
      'First Name': customer.first_name,
      'Last Name': customer.last_name,
      Email: customer.email,
      Phone: customer.phone,
      Address: customer.address,
      City: customer.city,
      State: customer.state,
      Country: customer.country,
      'Postal Code': customer.postal_code,
      'Total Orders': customer.orders?.length || customer.total_orders || 0,
      'Total Spent': customer.total_spent || 0,
      'Joined Date': new Date(customer.created_at).toLocaleString()
    }));
  } catch (error) {
    console.error('Error fetching customers for export:', error);
    throw new Error(error.message || 'Failed to fetch customers for export');
  }
};

export const fetchConsultationsForExport = async () => {
  // Consultations endpoint not yet implemented in backend - return empty array
  console.warn('fetchConsultationsForExport: consultations endpoint not yet implemented in backend');
  return [];
};

/**
 * Export product images - creates a CSV with product IDs, names, and image URLs
 */
export const exportProductImages = async (searchQuery = '') => {
  try {
    const products = await fetchProductsForExport(searchQuery);
    
    const imageData = products.map(product => ({
      'Product ID': product.ID,
      'Product Name': product.Name,
      'Image URL': product['Image URL'] || '',
      'Full Image URL': product['Image URL'] 
        ? (product['Image URL'].startsWith('http') 
            ? product['Image URL'] 
            : `${window.location.origin}${product['Image URL']}`)
        : ''
    }));
    
    return imageData;
  } catch (error) {
    console.error('Error exporting product images:', error);
    throw new Error(error.message || 'Failed to export product images');
  }
};

/**
 * Download all product images as a ZIP file
 * Note: This requires JSZip library
 */
export const downloadProductImagesAsZip = async (searchQuery = '') => {
  try {
    // Dynamically import JSZip only when this function is called
    let JSZip;
    try {
      const jszipModule = await import('jszip');
      JSZip = jszipModule.default || jszipModule;
    } catch (importError) {
      // If JSZip is not available, fall back to CSV export
      console.warn('JSZip not available, falling back to CSV export', importError);
      const imageData = await exportProductImages(searchQuery);
      exportToCSV(imageData, 'product_images');
      throw new Error('JSZip library is not installed. Image URLs have been exported as CSV instead. Please install jszip: npm install jszip');
    }
    
    const zip = new JSZip();
    
    const products = await fetchProductsForExport(searchQuery);
    let downloadedCount = 0;
    let failedCount = 0;
    
    // Download each image and add to zip
    for (const product of products) {
      const imageUrl = product['Image URL'];
      if (!imageUrl) continue;
      
      try {
        const fullUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `${window.location.origin}${imageUrl}`;
        
        const response = await fetch(fullUrl);
        if (response.ok) {
          const blob = await response.blob();
          const fileName = `${product.ID}_${product.Name.replace(/[^a-z0-9]/gi, '_')}.${blob.type.split('/')[1] || 'webp'}`;
          zip.file(fileName, blob);
          downloadedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to download image for ${product.Name}:`, error);
        failedCount++;
      }
    }
    
    if (downloadedCount === 0) {
      throw new Error('No images were downloaded');
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product_images_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { downloadedCount, failedCount };
  } catch (error) {
    console.error('Error creating image ZIP:', error);
    throw new Error(error.message || 'Failed to download images as ZIP');
  }
};
