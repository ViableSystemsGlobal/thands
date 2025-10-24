
import { supabase } from "@/lib/supabase";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    "Is Featured": "No",
    "Small Size Price": "",
    "Medium Size Price": "",
    "Large Size Price": "",
    "Image URL": ""
  }];
};

export const fetchProductsForExport = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_sizes (*)
    `);
  
  if (error) throw error;
  
  return data.map(product => ({
    ID: product.id,
    Name: product.name,
    Description: product.description,
    Category: product.category,
    'Is Featured': product.is_featured ? 'Yes' : 'No',
    'Small Size Price': product.product_sizes?.find(s => s.size === 'S')?.price || 'N/A',
    'Medium Size Price': product.product_sizes?.find(s => s.size === 'M')?.price || 'N/A',
    'Large Size Price': product.product_sizes?.find(s => s.size === 'L')?.price || 'N/A',
    'Created At': new Date(product.created_at).toLocaleString(),
    'Updated At': product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'
  }));
};

export const fetchOrdersForExport = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      order_items (
        *,
        products (*)
      )
    `);
  
  if (error) throw error;
  
  return data.map(order => ({
    'Order Number': order.order_number,
    'Customer Name': `${order.customers?.first_name} ${order.customers?.last_name}`,
    'Customer Email': order.customers?.email,
    'Total Amount': order.total_amount,
    Currency: order.currency,
    Status: order.status,
    'Payment Status': order.payment_status,
    'Items Count': order.order_items?.length || 0,
    'Created At': new Date(order.created_at).toLocaleString(),
    'Updated At': order.updated_at ? new Date(order.updated_at).toLocaleString() : 'N/A'
  }));
};

export const fetchCustomersForExport = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      orders (*)
    `);
  
  if (error) throw error;
  
  return data.map(customer => ({
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
    'Total Orders': customer.orders?.length || 0,
    'Total Spent': customer.orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
    'Joined Date': new Date(customer.created_at).toLocaleString()
  }));
};

export const fetchConsultationsForExport = async () => {
  const { data, error } = await supabase
    .from('consultations')
    .select('*');
  
  if (error) throw error;
  
  return data.map(consultation => ({
    'Name': consultation.name,
    'Email': consultation.email,
    'Phone': consultation.phone,
    'Type': consultation.type,
    'Status': consultation.status,
    'Preferred Date': consultation.preferred_date,
    'Preferred Time': consultation.preferred_time,
    'Created At': new Date(consultation.created_at).toLocaleString()
  }));
};
