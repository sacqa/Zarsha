import { jsPDF } from 'jspdf';
import { Currency, ImmutableOrderSnapshot, StoreSettings } from '../types/ecommerce';
import { formatMinorUnits } from './commerce-engine';

export interface ShortInvoiceItemLine {
  index: number;
  name: string;
  variantLine: string;
  sku: string;
  quantity: number;
  unitPriceFormatted: string;
  totalFormatted: string;
}

export interface ShortInvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeDomain: string;
  orderDateFormatted: string;
  orderStatusLabel: string;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  transactionRef: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddressLines: string[];
  courierName: string;
  courierService: string;
  trackingNumber: string;
  estimatedDeliveryLabel: string;
  items: ShortInvoiceItemLine[];
  totalItemCount: number;
  subtotalFormatted: string;
  discountMinorUnits: number;
  discountFormatted: string;
  discountCode?: string;
  giftCardAppliedMinorUnits: number;
  giftCardFormatted: string;
  shippingMinorUnits: number;
  shippingFormatted: string;
  taxMinorUnits: number;
  taxFormatted: string;
  dutyMinorUnits: number;
  dutyFormatted: string;
  netTotalFormatted: string;
  notes?: string;
}

/**
 * Normalizes strings into clean WinAnsi / ASCII-safe characters so built-in PDF Helvetica renders
 * without missing-glyph artifacts.
 */
export function toPdfSafeText(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u2022\u00B7]/g, '|')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2713|\u2714/g, 'OK')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveCurrencyForOrder(order: ImmutableOrderSnapshot, currency?: Currency): Currency {
  if (currency && currency.code === order.financials.currencyCode) {
    return currency;
  }
  const code = order.financials.currencyCode || 'PKR';
  if (code === 'PKR') {
    return {
      code: 'PKR',
      symbol: 'Rs. ',
      name: 'Pakistani Rupee',
      exchangeRateToBase: 1,
      decimalPrecision: 0,
      symbolPosition: 'before',
      isBaseCurrency: true,
      isActive: true,
      lastUpdated: order.orderDate,
    };
  }
  return (
    currency || {
      code,
      symbol: `${code} `,
      name: code,
      exchangeRateToBase: order.financials.exchangeRateUsed || 1,
      decimalPrecision: 2,
      symbolPosition: 'before',
      isActive: true,
      lastUpdated: order.orderDate,
    }
  );
}

export function formatInvoicePaymentMethod(method: ImmutableOrderSnapshot['payment']): string {
  switch (method.method) {
    case 'cash_on_delivery':
      return 'Cash on Delivery (COD)';
    case 'bank_transfer':
      return 'Bank Transfer (IBFT)';
    case 'jazzcash_easypaisa':
      return 'JazzCash / Easypaisa';
    case 'credit_card_gateway':
      return `${method.cardBrand || 'Card'} **** ${method.cardLast4 || '4481'}`;
    case 'paypal_express':
      return 'PayPal Express';
    case 'apple_google_pay':
      return 'Apple Pay / Google Pay';
    default:
      return method.method.replace(/_/g, ' ').toUpperCase();
  }
}

export function buildShortInvoiceData(
  order: ImmutableOrderSnapshot,
  currency?: Currency,
  settings?: Partial<StoreSettings>
): ShortInvoiceData {
  const effectiveCurrency = resolveCurrencyForOrder(order, currency);
  const fmt = (minor: number) => formatMinorUnits(minor, effectiveCurrency);

  const parsedDate = new Date(order.orderDate);
  const orderDateFormatted = Number.isNaN(parsedDate.getTime())
    ? order.orderDate
    : parsedDate.toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const shippingAddressLines = [
    order.shippingAddress.addressLine1,
    order.shippingAddress.addressLine2,
    `${order.shippingAddress.city}, ${order.shippingAddress.stateOrProvince}${
      order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''
    }`,
    order.shippingAddress.countryName,
  ].filter((line): line is string => Boolean(line && line.trim()));

  const items: ShortInvoiceItemLine[] = order.items.map((item, idx) => ({
    index: idx + 1,
    name: item.productName,
    variantLine: item.variantTitle || 'Standard',
    sku: item.sku,
    quantity: item.quantity,
    unitPriceFormatted: fmt(item.unitPriceMinorUnits),
    totalFormatted: fmt(item.totalPriceMinorUnits),
  }));

  const giftCardAppliedMinorUnits = order.financials.giftCardAppliedMinorUnits || 0;

  return {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    storeName: settings?.storeName || 'ZARIYA',
    storeTagline: settings?.tagline || "Pakistan's Festive Women's Fashion House",
    storeAddress: settings?.supportAddress || '42-B MM Alam Road, Gulberg III, Lahore, Pakistan',
    storePhone: settings?.whatsappNumber || settings?.contactPhone || '+92 300 8429100',
    storeEmail: settings?.contactEmail || 'care@zariya.pk',
    storeDomain: settings?.primaryDomain || 'zariya.pk',
    orderDateFormatted,
    orderStatusLabel: order.status.replace(/_/g, ' ').toUpperCase(),
    paymentMethodLabel: formatInvoicePaymentMethod(order.payment),
    paymentStatusLabel: order.payment.paymentStatus.replace(/_/g, ' ').toUpperCase(),
    transactionRef: order.payment.transactionId || '-',
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    customerEmail: order.customer.email,
    shippingAddressLines,
    courierName: order.shipping.carrier || 'TCS / Leopards Nationwide Express',
    courierService: order.shipping.service || 'Standard Courier',
    trackingNumber: order.shipping.trackingNumber || 'ZAR-TCS-PRIORITY',
    estimatedDeliveryLabel: `${order.shipping.estimatedDeliveryDays || 3} Business Day(s)`,
    items,
    totalItemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalFormatted: fmt(order.financials.subtotalMinorUnits),
    discountMinorUnits: order.financials.discountMinorUnits,
    discountFormatted: `-${fmt(order.financials.discountMinorUnits)}`,
    discountCode: order.discountCode,
    giftCardAppliedMinorUnits,
    giftCardFormatted: `-${fmt(giftCardAppliedMinorUnits)}`,
    shippingMinorUnits: order.financials.shippingFeeMinorUnits,
    shippingFormatted:
      order.financials.shippingFeeMinorUnits === 0
        ? 'FREE'
        : fmt(order.financials.shippingFeeMinorUnits),
    taxMinorUnits: order.financials.taxMinorUnits,
    taxFormatted: fmt(order.financials.taxMinorUnits),
    dutyMinorUnits: order.financials.dutyMinorUnits,
    dutyFormatted: fmt(order.financials.dutyMinorUnits),
    netTotalFormatted: order.financials.formattedTotal || fmt(order.financials.totalAmountMinorUnits),
    notes: order.notes,
  };
}

export function getShortInvoiceFilename(orderNumber: string): string {
  const safeOrder = orderNumber.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `ZARIYA-Short-Invoice-${safeOrder}.pdf`;
}

/**
 * Generates a crisp, compact single-page A5 portrait Short Invoice PDF using jsPDF.
 * Automatically adds continuation pages only if an order contains a large number of items.
 */
export function createShortInvoicePdfDoc(
  order: ImmutableOrderSnapshot,
  currency?: Currency,
  settings?: Partial<StoreSettings>
): jsPDF {
  const data = buildShortInvoiceData(order, currency, settings);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148mm x 210mm compact boutique short invoice
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 148
  const pageHeight = doc.internal.pageSize.getHeight(); // 210
  const margin = 9;
  const contentWidth = pageWidth - margin * 2; // 130
  const rightEdge = pageWidth - margin;

  // Palette (clean white paper + ZARIYA royal plum & saffron gold accents)
  const plum: [number, number, number] = [92, 14, 84]; // #5C0E54
  const plumDark: [number, number, number] = [36, 3, 35]; // #240323
  const gold: [number, number, number] = [255, 199, 0]; // #FFC700
  const saffron: [number, number, number] = [217, 119, 6];
  const tintBg: [number, number, number] = [250, 245, 250];
  const zebraBg: [number, number, number] = [252, 249, 252];
  const borderGray: [number, number, number] = [226, 210, 225];
  const textDark: [number, number, number] = [31, 16, 30];
  const textMuted: [number, number, number] = [107, 83, 105];

  // 1. Header Banner (Plum + Gold underline)
  doc.setFillColor(...plum);
  doc.rect(0, 0, pageWidth, 21, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, 21, pageWidth, 1.1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(toPdfSafeText(data.storeName), margin, 10);

  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(toPdfSafeText(data.storeTagline).toUpperCase(), margin, 15.2);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('SHORT INVOICE', rightEdge, 9.5, { align: 'right' });

  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`#${toPdfSafeText(data.orderNumber)}`, rightEdge, 15.2, { align: 'right' });

  let y = 26.5;

  // 2. Compact Invoice & Payment Meta Strip
  doc.setFillColor(...tintBg);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, contentWidth, 15.5, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...plum);
  doc.text('INVOICE DETAILS', margin + 3, y + 4.3);
  doc.text('PAYMENT SUMMARY', margin + contentWidth / 2 + 2, y + 4.3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...textDark);
  doc.text(`Invoice: ${toPdfSafeText(data.invoiceNumber)}`, margin + 3, y + 8.7);
  doc.text(
    `Date: ${toPdfSafeText(data.orderDateFormatted)} | ${toPdfSafeText(data.orderStatusLabel)}`,
    margin + 3,
    y + 12.7
  );

  doc.text(`Method: ${toPdfSafeText(data.paymentMethodLabel)}`, margin + contentWidth / 2 + 2, y + 8.7);
  doc.text(
    `Status: ${toPdfSafeText(data.paymentStatusLabel)} | Ref: ${toPdfSafeText(data.transactionRef).slice(0, 18)}`,
    margin + contentWidth / 2 + 2,
    y + 12.7
  );

  y += 19;

  // 3. Customer & Delivery Address (2 columns)
  const colWidth = (contentWidth - 4) / 2;
  const shipLinesWrapped = doc.splitTextToSize(
    toPdfSafeText(data.shippingAddressLines.join(', ')),
    colWidth - 5
  ) as string[];
  const addressBoxHeight = Math.max(20, 10 + shipLinesWrapped.length * 3.5);

  // Left card: Customer
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, colWidth, addressBoxHeight, 1.8, 1.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...plum);
  doc.text('BILL TO / CUSTOMER', margin + 2.8, y + 4.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...textDark);
  doc.text(toPdfSafeText(data.customerName), margin + 2.8, y + 8.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.1);
  doc.setTextColor(...textMuted);
  doc.text(`Phone: ${toPdfSafeText(data.customerPhone)}`, margin + 2.8, y + 12.8);
  const emailWrapped = doc.splitTextToSize(
    toPdfSafeText(data.customerEmail),
    colWidth - 5.5
  ) as string[];
  doc.text(emailWrapped.slice(0, 2), margin + 2.8, y + 16.5);

  // Right card: Ship To
  const rightColX = margin + colWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(rightColX, y, colWidth, addressBoxHeight, 1.8, 1.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...plum);
  doc.text('DELIVER TO', rightColX + 2.8, y + 4.4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...textDark);
  doc.text(shipLinesWrapped.slice(0, 4), rightColX + 2.8, y + 8.8);

  y += addressBoxHeight + 3;

  // 4. Courier & Tracking Bar
  doc.setFillColor(...tintBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, 7.2, 1.4, 1.4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.9);
  doc.setTextColor(...plumDark);
  doc.text(
    `Courier: ${toPdfSafeText(data.courierName)}`,
    margin + 2.8,
    y + 4.7
  );
  doc.setTextColor(...saffron);
  doc.text(
    `Tracking #: ${toPdfSafeText(data.trackingNumber)}`,
    rightEdge - 2.8,
    y + 4.7,
    { align: 'right' }
  );

  y += 10.5;

  // 5. Items Table Header
  const drawTableHeader = (startY: number) => {
    doc.setFillColor(...plum);
    doc.roundedRect(margin, startY, contentWidth, 6.8, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 2.5, startY + 4.5);
    doc.text(`ITEM (${data.totalItemCount} PCS)`, margin + 9, startY + 4.5);
    doc.text('QTY', margin + 92, startY + 4.5, { align: 'center' });
    doc.text('AMOUNT', rightEdge - 2.5, startY + 4.5, { align: 'right' });
    return startY + 7.2;
  };

  y = drawTableHeader(y);

  // Items rows
  const bottomReserved = 49; // Reserve space for totals + footer on final page
  data.items.forEach((item, idx) => {
    const nameLines = doc.splitTextToSize(toPdfSafeText(item.name), 75) as string[];
    const clippedNameLines = nameLines.slice(0, 2);
    const variantStr = toPdfSafeText(`${item.variantLine}${item.sku ? ` | SKU: ${item.sku}` : ''}`);
    const rowHeight = Math.max(10.2, 5.2 + clippedNameLines.length * 3.5 + 3.4);

    if (y + rowHeight > pageHeight - bottomReserved) {
      doc.addPage();
      y = 12;
      y = drawTableHeader(y);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(...zebraBg);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.18);
    doc.line(margin, y + rowHeight, rightEdge, y + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...textMuted);
    doc.text(String(item.index), margin + 2.5, y + 4.6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...textDark);
    doc.text(clippedNameLines, margin + 9, y + 4.6);

    const subY = y + 4.6 + (clippedNameLines.length - 1) * 3.5 + 3.6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(...textMuted);
    doc.text(variantStr.slice(0, 56), margin + 9, subY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...textDark);
    doc.text(String(item.quantity), margin + 92, y + 4.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...plumDark);
    doc.text(toPdfSafeText(item.totalFormatted), rightEdge - 2.5, y + 4.8, { align: 'right' });

    y += rowHeight;
  });

  y += 4;

  // Ensure totals + footer fit comfortably on current page
  if (y + 38 > pageHeight - 10) {
    doc.addPage();
    y = 14;
  }

  // 6. Totals Summary (Right-aligned) + Optional Order Note (Left)
  const summaryWidth = 64;
  const summaryX = rightEdge - summaryWidth;

  if (data.notes && data.notes.trim()) {
    const noteBoxW = contentWidth - summaryWidth - 5;
    const noteLines = doc.splitTextToSize(toPdfSafeText(data.notes), noteBoxW - 4) as string[];
    doc.setFillColor(...tintBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(margin, y, noteBoxW, Math.min(24, 9 + noteLines.length * 3.4), 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...plum);
    doc.text('CUSTOMER NOTE', margin + 2.5, y + 4.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...textMuted);
    doc.text(noteLines.slice(0, 4), margin + 2.5, y + 8.2);
  }

  const summaryRows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: 'Subtotal', value: data.subtotalFormatted },
  ];
  if (data.discountMinorUnits > 0) {
    summaryRows.push({
      label: data.discountCode ? `Discount (${data.discountCode})` : 'Discount',
      value: data.discountFormatted,
    });
  }
  if (data.giftCardAppliedMinorUnits > 0) {
    summaryRows.push({ label: 'Gift Card', value: data.giftCardFormatted });
  }
  summaryRows.push({ label: 'Delivery / Shipping', value: data.shippingFormatted });
  if (data.taxMinorUnits > 0) {
    summaryRows.push({ label: 'Tax', value: data.taxFormatted });
  }
  if (data.dutyMinorUnits > 0) {
    summaryRows.push({ label: 'Duties', value: data.dutyFormatted });
  }

  let sy = y;
  summaryRows.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(toPdfSafeText(row.label), summaryX + 2, sy + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(toPdfSafeText(row.value), rightEdge - 2, sy + 3.5, { align: 'right' });
    sy += 4.8;
  });

  sy += 1.2;
  doc.setFillColor(...plum);
  doc.roundedRect(summaryX, sy, summaryWidth, 8.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(255, 255, 255);
  doc.text('NET TOTAL', summaryX + 3, sy + 5.6);
  doc.setTextColor(...gold);
  doc.setFontSize(9.4);
  doc.text(toPdfSafeText(data.netTotalFormatted), rightEdge - 3, sy + 5.6, { align: 'right' });

  // 7. Compact Footer
  const footerY = pageHeight - 16;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.45);
  doc.line(margin, footerY - 2.5, rightEdge, footerY - 2.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...plum);
  doc.text(`Thank you for shopping with ${toPdfSafeText(data.storeName)}!`, pageWidth / 2, footerY + 1.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(...textMuted);
  doc.text(
    toPdfSafeText(`${data.storeAddress} | WhatsApp: ${data.storePhone}`),
    pageWidth / 2,
    footerY + 5.5,
    { align: 'center' }
  );
  doc.text(
    toPdfSafeText(`${data.storeEmail} | ${data.storeDomain} | 7-Day Hassle-Free Exchange`),
    pageWidth / 2,
    footerY + 9.2,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generates and triggers immediate client-side PDF download without popups (`window.open` avoided for iFrame safety).
 */
export function downloadShortInvoicePdf(
  order: ImmutableOrderSnapshot,
  currency?: Currency,
  settings?: Partial<StoreSettings>
): string {
  const filename = getShortInvoiceFilename(order.orderNumber);
  const doc = createShortInvoicePdfDoc(order, currency, settings);

  try {
    doc.save(filename);
  } catch {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return filename;
}
