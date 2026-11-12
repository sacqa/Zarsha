import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Truck,
  Mail,
  FileText,
  Printer,
  Download,
  Receipt,
  ArrowRight,
  CreditCard,
  MapPin,
  Package,
  Send,
  ExternalLink,
  Clock,
  PartyPopper,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Currency, ImmutableOrderSnapshot, StoreSettings } from '../../types/ecommerce';
import { formatMinorUnits } from '../../utils/commerce-engine';
import { downloadShortInvoicePdf } from '../../utils/invoice-pdf';
import { ShortInvoiceCard } from './ShortInvoiceCard';
import { triggerFestiveConfetti } from '../common/FestiveConfetti';

interface OrderConfirmationPageProps {
  order: ImmutableOrderSnapshot | null;
  allOrders: ImmutableOrderSnapshot[];
  currentCurrency: Currency;
  settings?: Partial<StoreSettings>;
  onContinueShopping: () => void;
  onViewOrderReceipt: (order: ImmutableOrderSnapshot) => void;
  onOpenCustomerAccount: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  allOrders,
  currentCurrency,
  settings,
  onContinueShopping,
  onViewOrderReceipt,
  onOpenCustomerAccount,
}) => {
  const [emailResentAt, setEmailResentAt] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(true);
  const [showShortInvoice, setShowShortInvoice] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  useEffect(() => {
    if (!order) return;
    const timer = window.setTimeout(() => {
      triggerFestiveConfetti('order');
    }, 250);
    return () => window.clearTimeout(timer);
  }, [order?.orderId]);

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4 text-white">
        <h2 className="text-2xl font-bold text-white">No Active Order Selected</h2>
        <p className="text-xs text-[#E3C4DF]">
          Return to ZARIYA Storefront or open My Account to view past order receipts.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onContinueShopping}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] rounded-full text-xs font-extrabold cursor-pointer"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={onOpenCustomerAccount}
            className="px-5 py-2.5 bg-[#340732] border border-[#681962] text-white rounded-full text-xs font-bold cursor-pointer"
          >
            View Order History
          </button>
        </div>
      </div>
    );
  }

  const handleDownloadInvoicePdf = () => {
    downloadShortInvoicePdf(order, currentCurrency, settings);
    setPdfDownloaded(true);
    window.setTimeout(() => setPdfDownloaded(false), 3000);
  };

  const customerOrderHistory = allOrders.filter(
    (o) => o.customer.email.toLowerCase() === order.customer.email.toLowerCase()
  );

  const paymentMethodLabel =
    order.payment.method === 'cash_on_delivery'
      ? 'Cash on Delivery (Pay Courier in PKR)'
      : order.payment.method === 'bank_transfer'
      ? 'Bank Transfer (HBL / Meezan IBFT)'
      : order.payment.method === 'jazzcash_easypaisa'
      ? 'JazzCash / Easypaisa Mobile Wallet'
      : order.payment.method === 'credit_card_gateway'
      ? `${order.payment.cardBrand || 'Card'} ending in •••• ${order.payment.cardLast4 || '4481'}`
      : order.payment.method;

  const billingAddr = order.billingAddress || order.shippingAddress;

  return (
    <>
      <div
        data-testid="order-confirmation-page"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-white print:hidden no-print"
      >
      {/* Hero Confirmation Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="text-white rounded-3xl p-6 sm:p-10 border border-[#FFC700]/45 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{
          background:
            'radial-gradient(circle at 20% 25%, rgba(255, 145, 0, 0.25), transparent 55%), linear-gradient(120deg, #5C0E54 0%, #3E083C 55%, #240323 100%)',
        }}
      >
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-[#240323]/60 border border-[#FFC700]/40 flex items-center justify-center text-[#FFC700] shrink-0"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FFE066]">
              <span>Thank You, {order.customer.fullName}!</span>
              <span>·</span>
              <span>Order Confirmed</span>
            </div>
            <h1
              data-testid="confirmation-order-number"
              className="text-2xl sm:text-3xl font-extrabold tabular-nums text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs sm:text-sm text-[#F3DDF0] max-w-2xl leading-relaxed">
              Your ZARIYA order is confirmed and being prepared at our Gulberg III Lahore Fulfillment Hub. A confirmation receipt has been sent to{' '}
              <strong className="text-white">{order.customer.email}</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="download-invoice-pdf-btn"
            onClick={handleDownloadInvoicePdf}
            className="px-4 py-2.5 rounded-full bg-white text-[#240323] hover:bg-[#FFF5D6] border border-[#FFC700] text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#5C0E54]" />
            <span>{pdfDownloaded ? 'Invoice PDF Downloaded ✓' : 'Download Invoice (PDF)'}</span>
          </button>
          <button
            type="button"
            data-testid="toggle-short-invoice-btn"
            onClick={() => setShowShortInvoice((prev) => !prev)}
            className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-[#FFC700]" />
            <span>{showShortInvoice ? 'Hide Short Invoice' : 'View Short Invoice'}</span>
          </button>
          <button
            type="button"
            data-testid="print-invoice-btn"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={() => triggerFestiveConfetti('order')}
            className="px-3.5 py-2.5 rounded-full bg-[#4E0C47] hover:bg-[#6B1261] text-[#FFE066] border border-[#FFC700]/45 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PartyPopper className="w-4 h-4" />
            <span>Celebrate</span>
          </button>
          <button
            type="button"
            data-testid="confirmation-continue-shopping-btn"
            onClick={onContinueShopping}
            className="cta-shimmer px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {showShortInvoice && (
        <div className="bg-[#340732] rounded-3xl border border-[#FFC700]/40 p-5 sm:p-6 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Short Invoice Preview (A5 Format)</h2>
              <p className="text-[11px] text-[#E3C4DF]">
                Compact white-paper invoice formatted cleanly for PDF download and thermal/A5/A4 printing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadInvoicePdf}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Short Invoice</span>
              </button>
            </div>
          </div>
          <div className="max-w-xl mx-auto">
            <ShortInvoiceCard order={order} currency={currentCurrency} settings={settings} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-6 shadow-md">
            <h2 className="text-base font-bold text-white border-b border-[#5E1659] pb-3">
              Order &amp; Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFC700] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Address</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659] space-y-0.5 text-[#E3C4DF]">
                  <div className="font-bold text-white">{order.customer.fullName}</div>
                  <div>{order.shippingAddress.addressLine1}</div>
                  {order.shippingAddress.addressLine2 && (
                    <div>{order.shippingAddress.addressLine2}</div>
                  )}
                  <div>
                    {order.shippingAddress.city}, {order.shippingAddress.stateOrProvince}{' '}
                    {order.shippingAddress.postalCode}
                  </div>
                  <div className="font-semibold text-white">
                    {order.shippingAddress.countryName}
                  </div>
                  <div className="text-[11px] text-[#D8B6D5] pt-1 tabular-nums">
                    Phone: {order.customer.phone}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFC700] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Billing Address</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659] space-y-0.5 text-[#E3C4DF]">
                  <div className="font-bold text-white">
                    {order.billingAddress?.fullName || order.customer.fullName}
                  </div>
                  <div>{billingAddr.addressLine1}</div>
                  <div>
                    {billingAddr.city}, {billingAddr.postalCode}
                  </div>
                  <div className="font-semibold text-white">{billingAddr.countryName}</div>
                  <div className="text-[11px] text-emerald-300 pt-1 font-medium">
                    ✓ Billing confirmed
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFC700] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment Details</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659] space-y-1 text-[#E3C4DF]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{paymentMethodLabel}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold uppercase">
                      {order.payment.paymentStatus}
                    </span>
                  </div>
                  <div className="text-[11px] tabular-nums text-[#D8B6D5]">
                    Ref: {order.payment.transactionId}
                  </div>
                  <div className="text-xs font-extrabold tabular-nums text-[#FFC700] pt-1">
                    Total Payable: {order.financials.formattedTotal}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFC700] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Courier &amp; Tracking</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659] space-y-1 text-[#E3C4DF]">
                  <div className="font-bold text-white">{order.shipping.service}</div>
                  <div className="text-[11px]">{order.shipping.carrier}</div>
                  <div className="text-[11px] tabular-nums text-[#FFC700] font-bold">
                    Tracking #: {order.shipping.trackingNumber || 'ZAR-TCS-PRIORITY'}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-medium">
                    Est. Delivery: {order.shipping.estimatedDeliveryDays} Business Day(s)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation Card */}
          <div className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#5E1659] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4E0C47] border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Order Confirmation Email Dispatched
                  </h3>
                  <p className="text-[11px] text-[#D8B6D5]">
                    Sent to <strong className="text-white">{order.customer.email}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="px-3 py-1.5 rounded-full border border-[#681962] text-xs font-semibold text-[#E3C4DF] cursor-pointer"
                >
                  {showEmailPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailResentAt(new Date().toISOString())}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{emailResentAt ? 'Resent ✓' : 'Resend'}</span>
                </button>
              </div>
            </div>

            {showEmailPreview && (
              <div className="p-4 rounded-2xl bg-[#240323] border border-[#5E1659] text-xs space-y-2 text-[#E3C4DF]">
                <div>
                  <strong className="text-white">From:</strong> ZARIYA Pakistan &lt;care@zariya.pk&gt;
                </div>
                <div>
                  <strong className="text-white">Subject:</strong> Order #{order.orderNumber} Confirmed — Thank you for shopping ZARIYA!
                </div>
                <p>
                  Dear {order.customer.fullName}, we’ve received your order worth{' '}
                  <strong className="text-[#FFC700]">{order.financials.formattedTotal}</strong> ({paymentMethodLabel}). Need help? WhatsApp us at +92 300 8429100.
                </p>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#5E1659] pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#FFC700]" />
                <h3 className="text-sm font-bold text-white">
                  Your Recent Orders ({customerOrderHistory.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenCustomerAccount}
                className="text-xs font-bold text-[#FFC700] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open My Account</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-[#5E1659]">
              {customerOrderHistory.map((h) => (
                <div
                  key={h.orderId}
                  className="py-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{h.orderNumber}</div>
                    <div className="text-[11px] text-[#D8B6D5]">
                      {new Date(h.orderDate).toLocaleDateString()} · {h.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums text-[#FFC700]">
                      {h.financials.formattedTotal}
                    </span>
                    {h.orderNumber !== order.orderNumber && (
                      <button
                        type="button"
                        onClick={() => onViewOrderReceipt(h)}
                        className="px-2.5 py-1 rounded-full border border-[#681962] text-[11px] font-semibold text-white cursor-pointer"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#340732] rounded-3xl border border-[#7A1870] p-6 space-y-5 shadow-lg">
            <h2
              className="text-lg font-bold text-white border-b border-[#5E1659] pb-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Items Ordered ({order.items.reduce((a, b) => a + b.quantity, 0)})
            </h2>

            <div className="space-y-3 divide-y divide-[#5E1659]">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="pt-3 first:pt-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.productSnapshot.image}
                      alt={item.productName}
                      className="w-14 h-16 rounded-xl object-cover object-top bg-[#4A0D46] border border-[#681962] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-[#D8B6D5] truncate">
                        {item.variantTitle} · Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-[#FFC700] shrink-0">
                    {formatMinorUnits(item.totalPriceMinorUnits, currentCurrency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#5E1659] space-y-2 text-xs">
              <div className="flex justify-between text-[#E3C4DF]">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-white">
                  {formatMinorUnits(order.financials.subtotalMinorUnits, currentCurrency)}
                </span>
              </div>
              {order.financials.discountMinorUnits > 0 && (
                <div className="flex justify-between text-emerald-300 font-semibold">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -{formatMinorUnits(order.financials.discountMinorUnits, currentCurrency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#E3C4DF]">
                <span>Shipping</span>
                <span className="tabular-nums text-white">
                  {order.financials.shippingFeeMinorUnits === 0
                    ? 'FREE'
                    : formatMinorUnits(order.financials.shippingFeeMinorUnits, currentCurrency)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#5E1659] flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total</span>
                <span
                  data-testid="confirmation-total-paid"
                  className="text-xl font-extrabold tabular-nums text-[#FFC700]"
                >
                  {order.financials.formattedTotal}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#5E1659] space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FFC700] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Order Status Timeline</span>
              </div>
              {order.timeline.map((step, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-[#240323] border border-[#5E1659] text-[11px]"
                >
                  <div className="font-bold text-white">{step.status}</div>
                  <div className="text-[#E3C4DF] mt-0.5">{step.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div data-print-scope="page" className="hidden print:block max-w-xl mx-auto">
      <ShortInvoiceCard order={order} currency={currentCurrency} settings={settings} />
    </div>
  </>
  );
};

