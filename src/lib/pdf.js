import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Brand colours ────────────────────────────────────────────────────────────
const GOLD       = [184, 134,  11];   // #B8860B
const GOLD_LIGHT = [210, 180, 140];   // #D2B48C
const DARK       = [ 30,  30,  30];
const MID_GRAY   = [100, 100, 100];
const LIGHT_BG   = [250, 247, 242];
const WHITE      = [255, 255, 255];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const LOGO_URL =
  'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/23de51b1b9990a050321cf95e591c30f.png';

const fmtUSD = (n) =>
  `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)}`;

const fmtGHS = (n) =>
  `GHS ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)}`;

const calcGHS = (usd, storedGhs, orderRate, fallbackRate = 16) => {
  if (storedGhs > 0) {
    if (orderRate && usd > 0) {
      const expected = usd * orderRate;
      if (Math.abs(expected - storedGhs) / expected < 0.05) return storedGhs;
      return expected;
    }
    const ratio = storedGhs / (usd || 1);
    if (ratio > fallbackRate * 1.2 || ratio < fallbackRate * 0.8) return usd * fallbackRate;
    return storedGhs;
  }
  return usd * (orderRate || fallbackRate);
};

// ─────────────────────────────────────────────────────────────────────────────
//  WAYBILL PDF
// ─────────────────────────────────────────────────────────────────────────────

export const generateWaybillPDF = async (order, senderInfo = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW     = doc.internal.pageSize.width;   // 210
  const PH     = doc.internal.pageSize.height;  // 297
  const M      = 14;                             // margin
  const CW     = PW - M * 2;                    // content width

  const sender = {
    name:    senderInfo.name    || 'TailoredHands',
    address: senderInfo.address || '',
    city:    senderInfo.city    || 'Accra',
    state:   senderInfo.state   || 'Greater Accra',
    country: senderInfo.country || 'Ghana',
    zip:     senderInfo.zip     || '',
  };

  const receiver = {
    name:    `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim() || 'Customer',
    address: order.shipping_address    || '',
    city:    order.shipping_city       || '',
    state:   order.shipping_state      || '',
    country: order.shipping_country    || '',
    zip:     order.shipping_postal_code || '',
    phone:   order.shipping_phone      || '',
    email:   order.shipping_email      || '',
  };

  const awb         = order.tracking_number || 'N/A';
  const serviceCode = order.shipping_service || 'P';
  const serviceMap  = {
    P: 'DHL Express Worldwide',
    D: 'DHL Express Document',
    N: 'DHL Domestic Express',
    EXPRESS_WORLDWIDE: 'DHL Express Worldwide',
  };
  const serviceName = serviceMap[serviceCode] || `DHL ${serviceCode}`;
  const issueDate   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isIntl      = receiver.country && receiver.country !== (senderInfo.country_code || 'GH');

  // ── Gold header band ───────────────────────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, PW, 42, 'F');

  const logo = await getImageAsBase64(LOGO_URL);
  if (logo) { try { doc.addImage(logo, 'PNG', M, 8, 38, 22); } catch (_) { /* skip */ } }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('AIR WAYBILL', PW - M, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TailoredHands International Shipping Document', PW - M, 30, { align: 'right' });

  // ── AWB reference box ──────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.rect(M, 48, CW, 24, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text('AWB / TRACKING NUMBER', M + 4, 55);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(awb, M + 4, 66);

  // Right side of AWB box
  const rCol = PW - M - 52;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text('ORDER',    rCol, 54);
  doc.text('DATE',     rCol, 61);
  doc.text('SERVICE',  rCol, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(order.order_number || 'N/A', PW - M - 2, 54, { align: 'right' });
  doc.text(issueDate,                   PW - M - 2, 61, { align: 'right' });
  doc.text(serviceName,                 PW - M - 2, 68, { align: 'right' });

  // ── FROM / TO panels ───────────────────────────────────────────────────────
  const y1   = 78;
  const colW = (CW - 4) / 2;
  const x2   = M + colW + 4;
  const panH = 46;

  // FROM header
  doc.setFillColor(...GOLD);
  doc.rect(M, y1, colW, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('FROM (SHIPPER)', M + 4, y1 + 5.5);

  // FROM body
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.4);
  doc.rect(M, y1 + 8, colW, panH, 'FD');

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(sender.name, M + 4, y1 + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MID_GRAY);
  let sy = y1 + 22;
  [sender.address, [sender.city, sender.state].filter(Boolean).join(', '), sender.country, sender.zip ? `Postal: ${sender.zip}` : null]
    .filter(Boolean)
    .forEach(line => { doc.text(line, M + 4, sy); sy += 6; });

  // TO header
  doc.setFillColor(...DARK);
  doc.rect(x2, y1, colW, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('TO (CONSIGNEE)', x2 + 4, y1 + 5.5);

  // TO body
  doc.setFillColor(...WHITE);
  doc.setDrawColor(180, 180, 180);
  doc.rect(x2, y1 + 8, colW, panH, 'FD');

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(receiver.name, x2 + 4, y1 + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MID_GRAY);
  let ry = y1 + 22;
  [
    receiver.address?.substring(0, 38),
    [receiver.city, receiver.state].filter(Boolean).join(', '),
    receiver.country,
    receiver.zip     ? `Postal: ${receiver.zip}`  : null,
    receiver.phone   ? `Tel: ${receiver.phone}`   : null,
    receiver.email   ? receiver.email             : null,
  ]
    .filter(Boolean)
    .forEach(line => { doc.text(line, x2 + 4, ry); ry += 6; });

  // ── Shipment details strip ─────────────────────────────────────────────────
  const y2 = y1 + panH + 14;

  doc.setFillColor(...GOLD);
  doc.rect(M, y2, CW, 8, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SHIPMENT DETAILS', M + 4, y2 + 5.5);

  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.4);
  doc.rect(M, y2 + 8, CW, 22, 'FD');

  const details = [
    { label: 'PIECES',  value: '1' },
    { label: 'CARRIER', value: 'DHL Express' },
    { label: 'SERVICE', value: serviceCode },
    { label: 'TYPE',    value: isIntl ? 'International' : 'Domestic' },
  ];
  details.forEach((d, i) => {
    const cx = M + 4 + i * (CW / 4);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_GRAY);
    doc.text(d.label, cx, y2 + 15);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(d.value, cx, y2 + 24);
  });

  // ── Contents table ─────────────────────────────────────────────────────────
  const y3 = y2 + 36;

  doc.setFillColor(...GOLD);
  doc.rect(M, y3, CW, 8, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('CONTENTS DESCRIPTION', M + 4, y3 + 5.5);

  const contentRows = (order.items || order.order_items)?.map((item, i) => [
    String(i + 1),
    item.product_name || item.products?.name || 'Item',
    String(item.quantity || 1),
    'Clothing / Apparel',
    'N/A',
  ]) || [['1', 'Clothing and Apparel', '1', 'Clothing / Apparel', 'N/A']];

  autoTable(doc, {
    startY: y3 + 8,
    head: [['#', 'Description', 'Qty', 'Category', 'HS Code']],
    body: contentRows,
    theme: 'grid',
    headStyles: {
      fillColor: [...GOLD_LIGHT],
      textColor: [...DARK],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8, textColor: [...DARK], fillColor: [...WHITE] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 50 },
      4: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: M, right: M },
  });

  // ── Declaration + signature ────────────────────────────────────────────────
  const y4 = doc.lastAutoTable.finalY + 6;

  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...GOLD_LIGHT);
  doc.rect(M, y4, CW, 30, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('SHIPPER\'S DECLARATION', M + 4, y4 + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  const decl = 'I hereby certify that the particulars on the face hereof are correct and that insofar as any part of the consignment contains restricted articles, such part is properly described by name and is in proper condition for carriage by air according to applicable Dangerous Goods Regulations.';
  const declLines = doc.splitTextToSize(decl, CW - 8);
  doc.text(declLines, M + 4, y4 + 14);

  // Signature lines
  const sigY = y4 + 26;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(M + 4,       sigY, M + 70,       sigY);
  doc.line(M + 80,      sigY, M + 146,      sigY);

  doc.setFontSize(7);
  doc.setTextColor(...MID_GRAY);
  doc.text('Shipper Signature',   M + 4,  sigY + 3.5);
  doc.text('Date',                M + 80, sigY + 3.5);

  // ── Gold footer ────────────────────────────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, PH - 18, PW, 18, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...WHITE);
  doc.text('TailoredHands Fashion | www.tailoredhands.com', M, PH - 9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, PW - M, PH - 9, { align: 'right' });

  doc.save(`waybill-${awb}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
//  INVOICE PDF  (enhanced)
// ─────────────────────────────────────────────────────────────────────────────

export const generateOrderPDF = async (order) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;
  const M  = 14;
  const CW = PW - M * 2;

  const rate = order.exchange_rate || 16;

  const totalUSD = Number(order.base_total    || order.total_amount    || 0);
  const totalGHS = calcGHS(totalUSD, Number(order.base_total_ghs    || order.total_amount_ghs    || 0), rate);
  const subUSD   = Number(order.base_subtotal || order.subtotal_amount || 0);
  const subGHS   = calcGHS(subUSD,   Number(order.base_subtotal_ghs || order.subtotal_amount_ghs || 0), rate);
  const shipUSD  = Number(order.base_shipping || order.shipping_amount  || 0);
  const shipGHS  = calcGHS(shipUSD,  Number(order.base_shipping_ghs || order.shipping_amount_ghs || 0), rate);
  const discUSD  = Number(order.coupon_discount_amount || 0);
  const discGHS  = calcGHS(discUSD,  Number(order.coupon_discount_amount_ghs || 0), rate);

  const customerName = `${order.shipping_first_name || order.customers?.first_name || ''} ${order.shipping_last_name || order.customers?.last_name || ''}`.trim() || 'Guest Customer';

  try {
    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, PW, 42, 'F');

    const logo = await getImageAsBase64(LOGO_URL);
    let logoAdded = false;
    if (logo) {
      try { doc.addImage(logo, 'PNG', M, 8, 38, 22); logoAdded = true; } catch (_) { /* skip */ }
    }
    if (!logoAdded) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text('TAILORED HANDS', M, 24);
    }

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('INVOICE', PW - M, 24, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TailoredHands Fashion', PW - M, 32, { align: 'right' });

    // ── Invoice meta box ──────────────────────────────────────────────────────
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.rect(M, 48, CW, 26, 'FD');

    const metaLeft  = M + 4;
    const metaRight = PW - M - 4;
    const metaCols  = [
      ['Invoice No',     order.order_number || 'N/A'],
      ['Date',           new Date(order.created_at).toLocaleDateString()],
      ['Order Status',   (order.status || 'N/A').charAt(0).toUpperCase() + (order.status || '').slice(1)],
      ['Payment',        (order.payment_status || 'N/A').charAt(0).toUpperCase() + (order.payment_status || '').slice(1)],
    ];

    metaCols.forEach((col, i) => {
      const y = 55 + i * 6;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MID_GRAY);
      doc.text(col[0] + ':', metaLeft, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(col[1], metaRight, y, { align: 'right' });
    });

    // ── Bill To ───────────────────────────────────────────────────────────────
    const y1 = 82;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD[0] ? GOLD : [184, 134, 11]);
    // Use setTextColor with array spread
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('BILL TO', M, y1);

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(M, y1 + 2, M + 30, y1 + 2);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(customerName, M, y1 + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MID_GRAY);
    doc.text(order.customer_id ? 'Registered Customer' : 'Guest Customer', M, y1 + 17);

    doc.setTextColor(...DARK);
    let by = y1 + 24;
    [
      order.shipping_address,
      order.shipping_city || order.shipping_state
        ? `${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_postal_code || ''}`.trim()
        : null,
      order.shipping_country,
      order.shipping_phone,
      order.shipping_email,
    ]
      .filter(Boolean)
      .forEach(line => { doc.setFontSize(9); doc.text(line, M, by); by += 6; });

    // Exchange rate
    if (order.exchange_rate) {
      doc.setFontSize(8);
      doc.setTextColor(...MID_GRAY);
      doc.text(`Exchange Rate: ${order.exchange_rate.toFixed(2)} GHS / USD`, M, by + 2);
      by += 8;
    }

    // Tracking info (right column)
    if (order.tracking_number) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.text('SHIPPING INFO', PW - M - 60, y1);
      doc.setDrawColor(...GOLD);
      doc.line(PW - M - 60, y1 + 2, PW - M - 4, y1 + 2);

      const shipInfo = [
        ['Carrier',   order.shipping_carrier || 'DHL'],
        ['Service',   order.shipping_service || ''],
        ['Tracking',  order.tracking_number],
        ['Status',    (order.status || '').charAt(0).toUpperCase() + (order.status || '').slice(1)],
      ].filter(r => r[1]);

      shipInfo.forEach((row, i) => {
        const sy2 = y1 + 10 + i * 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...MID_GRAY);
        doc.text(row[0] + ':', PW - M - 60, sy2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(row[1], PW - M - 4, sy2, { align: 'right' });
      });
    }

    // ── Items table ───────────────────────────────────────────────────────────
    const tableStartY = Math.max(by + 6, 145);

    const tableRows = (order.items || order.order_items || []).map(item => {
      const iUSD = Number(item.price) || 0;
      const iGHS = calcGHS(iUSD, Number(item.price_ghs), rate);
      return [
        item.product_name || item.products?.name || 'Product',
        item.size || '—',
        String(item.quantity || 1),
        fmtUSD(iUSD),
        fmtGHS(iGHS),
        fmtUSD(iUSD * (item.quantity || 1)),
        fmtGHS(iGHS * (item.quantity || 1)),
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [['Item', 'Size', 'Qty', 'Unit (USD)', 'Unit (GHS)', 'Total (USD)', 'Total (GHS)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [...DARK],
        textColor: [...WHITE],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [...DARK],
        fillColor: [...WHITE],
      },
      alternateRowStyles: { fillColor: [...LIGHT_BG] },
      columnStyles: {
        0: { cellWidth: 52, halign: 'left'   },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 22, halign: 'right'  },
        4: { cellWidth: 24, halign: 'right'  },
        5: { cellWidth: 22, halign: 'right'  },
        6: { cellWidth: 24, halign: 'right'  },
      },
      margin: { left: M, right: M },
    });

    // ── Summary section ───────────────────────────────────────────────────────
    const summaryY = doc.lastAutoTable.finalY + 4;
    const sumW     = 100;
    const sumX     = PW - M - sumW;

    // Summary rows
    const summaryRows = [
      ['Subtotal',  fmtUSD(subUSD),  fmtGHS(subGHS)],
      ['Shipping',  fmtUSD(shipUSD), fmtGHS(shipGHS)],
    ];
    if (discUSD > 0) summaryRows.push(['Discount', `– ${fmtUSD(discUSD)}`, `– ${fmtGHS(discGHS)}`]);

    autoTable(doc, {
      startY: summaryY,
      head: [['', 'USD', 'GHS']],
      body: summaryRows,
      foot: [['TOTAL', fmtUSD(totalUSD), fmtGHS(totalGHS)]],
      theme: 'grid',
      tableWidth: sumW,
      margin: { left: sumX },
      headStyles: {
        fillColor: [...GOLD_LIGHT],
        textColor: [...DARK],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'right',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [...DARK],
        fillColor: [...WHITE],
        halign: 'right',
      },
      footStyles: {
        fillColor: [...GOLD],
        textColor: [...WHITE],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'right',
      },
    });

    // ── Payment info ──────────────────────────────────────────────────────────
    const payY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('PAYMENT INFORMATION', M, payY);
    doc.setDrawColor(...GOLD);
    doc.line(M, payY + 2, M + 58, payY + 2);

    const payRows = [
      ['Display Currency', order.display_currency || 'USD'],
      ['Payment Currency', order.payment_currency || 'GHS'],
      ['Payment Status',   (order.payment_status || 'N/A').charAt(0).toUpperCase() + (order.payment_status || '').slice(1)],
    ];
    payRows.forEach((row, i) => {
      const py = payY + 10 + i * 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MID_GRAY);
      doc.text(row[0] + ':', M, py);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(row[1], M + 55, py);
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.setFillColor(...GOLD);
    doc.rect(0, PH - 18, PW, 18, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('Thank you for your business!', PW / 2, PH - 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('TailoredHands Fashion | www.tailoredhands.com', M, PH - 7);
    doc.text(`Generated: ${new Date().toLocaleString()}`, PW - M, PH - 7, { align: 'right' });

    doc.save(`invoice-${order.order_number}.pdf`);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONSULTATION PDF  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export const generateConsultationPDF = async (consultation) => {
  const doc = new jsPDF();

  try {
    const img = new Image();
    img.src = LOGO_URL;
    await new Promise((resolve, reject) => {
      img.onload = () => { try { doc.addImage(img, 'PNG', 20, 10, 40, 20); resolve(); } catch (e) { reject(e); } };
      img.onerror = reject;
    });

    doc.setFontSize(20);
    doc.text('CONSULTATION DETAILS', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Customer Information', 20, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${consultation.name}`,     20, 55);
    doc.text(`Email: ${consultation.email}`,   20, 62);
    doc.text(`Phone: ${consultation.phone}`,   20, 69);
    doc.text(`Type: ${consultation.type}`,     20, 76);
    doc.text(`Status: ${consultation.status}`, 20, 83);

    let yPos = 100;

    if (consultation.sizes) {
      doc.setFontSize(12);
      doc.text('Measurements', 20, yPos);
      doc.setFontSize(10);
      yPos += 10;
      Object.entries(consultation.sizes).forEach(([key, value]) => {
        doc.text(`${key.replace(/_/g, ' ').toUpperCase()}: ${value}`, 20, yPos);
        yPos += 7;
      });
    }

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

    if (consultation.additional_instructions) {
      yPos += 20;
      doc.setFontSize(12);
      doc.text('Additional Instructions', 20, yPos);
      doc.setFontSize(10);
      yPos += 10;
      const splitText = doc.splitTextToSize(consultation.additional_instructions, 170);
      doc.text(splitText, 20, yPos);
      yPos += splitText.length * 7;
    }

    yPos += 20;
    doc.setFontSize(12);
    doc.text('Attached Files', 20, yPos);
    doc.setFontSize(10);
    yPos += 10;

    if (consultation.design_urls?.length) {
      doc.text('Design Files:', 20, yPos);
      yPos += 7;
      consultation.design_urls.forEach((url, i) => {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(`Design File ${i + 1}`, 30, yPos, { url });
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      });
    }

    if (consultation.photo_urls?.length) {
      yPos += 5;
      doc.text('Photo Files:', 20, yPos);
      yPos += 7;
      consultation.photo_urls.forEach((url, i) => {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(`Photo File ${i + 1}`, 30, yPos, { url });
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      });
    }

    if (consultation.measurements_url) {
      yPos += 5;
      doc.text('Measurements File:', 20, yPos);
      yPos += 7;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('Download Measurements', 30, yPos, { url: consultation.measurements_url });
      doc.setTextColor(0, 0, 0);
    }

    if (consultation.inspiration_url) {
      yPos += 12;
      doc.text('Inspiration File:', 20, yPos);
      yPos += 7;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('Download Inspiration', 30, yPos, { url: consultation.inspiration_url });
      doc.setTextColor(0, 0, 0);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated on ' + new Date().toLocaleString(), 105, pageHeight - 20, { align: 'center' });

    doc.save(`consultation-${consultation.id}.pdf`);
  } catch (error) {
    console.error('Error generating consultation PDF:', error);
    throw error;
  }
};
