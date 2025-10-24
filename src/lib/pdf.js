import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to convert image URL to base64
const getImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

export const generateOrderPDF = async (order) => {
  const doc = new jsPDF();
  
  // Helper function to calculate GHS value using the same logic as OrderDetailsDialog
  const calculateGHSValue = (usdAmount, storedGHSAmount, orderExchangeRate, currentExchangeRate = 16) => {
    if (storedGHSAmount && storedGHSAmount > 0) {
      if (orderExchangeRate && usdAmount) {
        const expectedGHS = usdAmount * orderExchangeRate;
        const storedGHS = storedGHSAmount;
        const difference = Math.abs(expectedGHS - storedGHS);
        const percentageDiff = (difference / expectedGHS) * 100;
        
        if (percentageDiff < 5) {
          return storedGHS;
        } else {
          return expectedGHS;
        }
      } else {
        const currentRatio = storedGHSAmount / usdAmount;
        if (currentRatio > currentExchangeRate * 1.2 || currentRatio < currentExchangeRate * 0.8) {
          return usdAmount * currentExchangeRate;
        } else {
          return storedGHSAmount;
        }
      }
    } else if (usdAmount) {
      const rateToUse = orderExchangeRate || currentExchangeRate;
      return usdAmount * rateToUse;
    }
    return 0;
  };

  // Format price with proper currency symbols and thousand separators
  const formatPrice = (amount, currency = "USD") => {
    const symbol = currency === "GHS" ? "GHS " : "$";
    return `${symbol}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  // Calculate all amounts - use the correct field names
  const orderTotalUSD = Number(order.total_amount) || Number(order.base_total) || 0;
  const orderTotalGHS = calculateGHSValue(
    orderTotalUSD,
    Number(order.total_amount_ghs) || Number(order.base_total_ghs),
    order.exchange_rate
  );

  const subTotalUSD = Number(order.subtotal_amount) || Number(order.base_subtotal) || 0;
  const subTotalGHS = calculateGHSValue(
    subTotalUSD,
    Number(order.subtotal_amount_ghs) || Number(order.base_subtotal_ghs),
    order.exchange_rate
  );

  const shippingUSD = Number(order.shipping_amount) || Number(order.base_shipping) || 0;
  const shippingGHS = calculateGHSValue(
    shippingUSD,
    Number(order.shipping_amount_ghs) || Number(order.base_shipping_ghs),
    order.exchange_rate
  );

  const couponDiscountUSD = Number(order.coupon_discount_amount) || 0;
  const couponDiscountGHS = calculateGHSValue(
    couponDiscountUSD,
    Number(order.coupon_discount_amount_ghs),
    order.exchange_rate
  );

  try {
    // Company logo and header
    console.log('Attempting to load logo...');
    const logoBase64 = await getImageAsBase64("https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/23de51b1b9990a050321cf95e591c30f.png");
    
    let logoAdded = false;
    
    if (logoBase64) {
      try {
        console.log('Logo loaded successfully, adding to PDF...');
        doc.addImage(logoBase64, 'PNG', 20, 15, 50, 25);
        console.log('Logo added to PDF');
        logoAdded = true;
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    } else {
      console.warn('Failed to load logo, using text fallback');
    }

    // Add company name as fallback only if logo failed
    if (!logoAdded) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('TAILORED HANDS', 20, 35);
    }

    // Invoice title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('INVOICE', 190, 30, { align: 'right' });

    // Invoice details box - Fixed positioning to prevent overlap
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    
    // Labels on the left
    doc.text('Invoice Number:', 120, 45);
    doc.text('Date:', 120, 52);
    doc.text('Status:', 120, 59);
    doc.text('Payment:', 120, 66);

    // Values on the right, properly aligned
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(order.order_number || 'N/A', 190, 45, { align: 'right' });
    doc.text(new Date(order.created_at).toLocaleDateString(), 190, 52, { align: 'right' });
    doc.text(order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A', 190, 59, { align: 'right' });
    doc.text(order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'N/A', 190, 66, { align: 'right' });

    // Bill To section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('BILL TO', 20, 80);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const customerName = `${order.shipping_first_name || order.customers?.first_name || ''} ${order.shipping_last_name || order.customers?.last_name || ''}`.trim();
    doc.text(customerName || 'Guest Customer', 20, 92);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    const customerType = order.customer_id ? "Registered Customer" : "Guest Customer";
    doc.text(customerType, 20, 99);

    doc.setTextColor(51, 51, 51);
    if (order.shipping_address) doc.text(order.shipping_address, 20, 106);
    if (order.shipping_city || order.shipping_state || order.shipping_postal_code) {
      doc.text(`${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_postal_code || ''}`.trim(), 20, 113);
    }
    if (order.shipping_country) doc.text(order.shipping_country, 20, 120);
    if (order.shipping_phone) doc.text(order.shipping_phone, 20, 127);
    if (order.shipping_email) doc.text(order.shipping_email, 20, 134);

    // Currency information
    if (order.exchange_rate) {
      doc.setFontSize(9);
      doc.setTextColor(102, 102, 102);
      doc.text(`Exchange Rate: ${order.exchange_rate.toFixed(2)} GHS/USD`, 20, 145);
    }

    // Items table
    const tableData = order.order_items?.map(item => {
      const itemPriceUSD = Number(item.price) || 0;
      const itemPriceGHS = calculateGHSValue(
        itemPriceUSD,
        Number(item.price_ghs),
        order.exchange_rate
      );
      const totalUSD = itemPriceUSD * item.quantity;
      const totalGHS = itemPriceGHS * item.quantity;

      return [
        item.products?.name || item.gift_voucher_types?.name || 'Product',
        item.quantity.toString(),
        `${formatPrice(itemPriceUSD, "USD")} / ${formatPrice(itemPriceGHS, "GHS")}`,
        `${formatPrice(totalUSD, "USD")} / ${formatPrice(totalGHS, "GHS")}`
      ];
    }) || [];

    // Summary rows
    const summaryRows = [
      ['', '', 'Subtotal:', `${formatPrice(subTotalUSD, "USD")} / ${formatPrice(subTotalGHS, "GHS")}`],
      ['', '', 'Shipping:', `${formatPrice(shippingUSD, "USD")} / ${formatPrice(shippingGHS, "GHS")}`]
    ];

    if (couponDiscountUSD > 0) {
      summaryRows.push(['', '', 'Discount:', `- ${formatPrice(couponDiscountUSD, "USD")} / - ${formatPrice(couponDiscountGHS, "GHS")}`]);
    }

    summaryRows.push(['', '', 'TOTAL:', `${formatPrice(orderTotalUSD, "USD")} / ${formatPrice(orderTotalGHS, "GHS")}`]);

    doc.autoTable({
      startY: 160,
      head: [['Item', 'Qty', 'Unit Price (USD / GHS)', 'Total (USD / GHS)']],
      body: tableData,
      foot: summaryRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 51, 51],
        fillColor: [255, 255, 255]
      },
      footStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [51, 51, 51], 
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 65, halign: 'left' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 45, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Payment information section
    const finalY = doc.lastAutoTable.finalY + 20;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Payment Information', 20, finalY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text(`Display Currency: ${order.display_currency || "USD"}`, 20, finalY + 12);
    doc.text(`Payment Currency: ${order.payment_currency || "GHS"}`, 20, finalY + 20);
    doc.text(`Payment Status: ${order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}`, 20, finalY + 28);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    
    // Company information
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('Tailored Hands Fashion', 105, pageHeight - 40, { align: 'center' });
    doc.text('Thank you for your business!', 105, pageHeight - 32, { align: 'center' });
    
    // Generation timestamp
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, pageHeight - 20, { align: 'center' });

    // Decorative line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, pageHeight - 50, 190, pageHeight - 50);

    // Save the PDF
    doc.save(`invoice-${order.order_number}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateConsultationPDF = async (consultation) => {
  const doc = new jsPDF();

  try {
    // Add logo
    const img = new Image();
    img.src = "https://fqnzrffsscrhknfzewxd.supabase.co/storage/v1/object/public/assets/logo.png";
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          doc.addImage(img, 'PNG', 20, 10, 40, 20);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
    });

    // Add header
    doc.setFontSize(20);
    doc.text('CONSULTATION DETAILS', 105, 20, { align: 'center' });
    
    // Add consultation details
    doc.setFontSize(12);
    doc.text('Customer Information', 20, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${consultation.name}`, 20, 55);
    doc.text(`Email: ${consultation.email}`, 20, 62);
    doc.text(`Phone: ${consultation.phone}`, 20, 69);
    doc.text(`Type: ${consultation.type}`, 20, 76);
    doc.text(`Status: ${consultation.status}`, 20, 83);

    let yPos = 100;

    // Add measurements if available
    if (consultation.sizes) {
      doc.setFontSize(12);
      doc.text('Measurements', 20, yPos);
      doc.setFontSize(10);
      yPos += 10;

      const measurements = Object.entries(consultation.sizes);
      measurements.forEach(([key, value]) => {
        doc.text(`${key.replace(/_/g, ' ').toUpperCase()}: ${value}`, 20, yPos);
        yPos += 7;
      });
    }

    // Add appointment details if it's a consultation
    if (consultation.type === 'consultation') {
      yPos += 10;
      doc.setFontSize(12);
      doc.text('Appointment Details', 20, yPos);
      doc.setFontSize(10);
      yPos += 10;
      doc.text(`Preferred Date: ${consultation.preferred_date || 'Not specified'}`, 20, yPos);
      yPos += 7;
      doc.text(`Preferred Time: ${consultation.preferred_time || 'Not specified'}`, 20, yPos);
    }

    // Add additional instructions if available
    if (consultation.additional_instructions) {
      yPos += 20;
      doc.setFontSize(12);
      doc.text('Additional Instructions', 20, yPos);
      doc.setFontSize(10);
      yPos += 10;

      const splitText = doc.splitTextToSize(consultation.additional_instructions, 170);
      doc.text(splitText, 20, yPos);
      yPos += (splitText.length * 7);
    }

    // Add file links section
    yPos += 20;
    doc.setFontSize(12);
    doc.text('Attached Files', 20, yPos);
    doc.setFontSize(10);
    yPos += 10;

    // Add design files
    if (consultation.design_urls?.length) {
      doc.text('Design Files:', 20, yPos);
      yPos += 7;
      consultation.design_urls.forEach((url, index) => {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(`Design File ${index + 1}`, 30, yPos, { url });
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      });
    }

    // Add photo files
    if (consultation.photo_urls?.length) {
      yPos += 5;
      doc.text('Photo Files:', 20, yPos);
      yPos += 7;
      consultation.photo_urls.forEach((url, index) => {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(`Photo File ${index + 1}`, 30, yPos, { url });
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      });
    }

    // Add measurements file
    if (consultation.measurements_url) {
      yPos += 5;
      doc.text('Measurements File:', 20, yPos);
      yPos += 7;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('Download Measurements', 30, yPos, { url: consultation.measurements_url });
      doc.setTextColor(0, 0, 0);
    }

    // Add inspiration file
    if (consultation.inspiration_url) {
      yPos += 12;
      doc.text('Inspiration File:', 20, yPos);
      yPos += 7;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('Download Inspiration', 30, yPos, { url: consultation.inspiration_url });
      doc.setTextColor(0, 0, 0);
    }

    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated on ' + new Date().toLocaleString(), 105, pageHeight - 20, { align: 'center' });

    // Save the PDF
    doc.save(`consultation-${consultation.id}.pdf`);
  } catch (error) {
    console.error('Error generating consultation PDF:', error);
    throw error;
  }
};
