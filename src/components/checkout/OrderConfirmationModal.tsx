import React, { useState } from 'react';
import { CheckCircle2, Download, Printer, X } from 'lucide-react';
import { Currency, ImmutableOrderSnapshot, StoreSettings } from '../../types/ecommerce';
import { downloadShortInvoicePdf } from '../../utils/invoice-pdf';
import { ShortInvoiceCard } from './ShortInvoiceCard';

interface OrderConfirmationModalProps {
  order: ImmutableOrderSnapshot | null;
  currency?: Currency;
  settings?: Partial<StoreSettings>;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  currency,
  settings,
  onClose,
}) => {
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!order) return null;

  const handleDownloadPdf = () => {
    downloadShortInvoicePdf(order, currency, settings);
    setPdfDownloaded(true);
    window.setTimeout(() => setPdfDownloaded(false), 3000);
  };

  return (
    <div
      data-print-scope="modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#140113]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 print:static print:bg-transparent print:p-0 print:block print:overflow-visible"
    >
      <div className="relative bg-[#31062F] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#6E1B67] my-6 text-white print:shadow-none print:border-0 print:bg-white print:max-w-xl print:mx-auto print:my-0 print:rounded-none">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#4E0C47] via-[#7A1870] to-[#4E0C47] border-b border-[#6E1B67] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF9900] text-[#240323] rounded-full shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-[#FFC700] uppercase tracking-widest font-bold">
                Short Invoice Receipt
              </div>
              <h2 className="text-base sm:text-lg font-bold tabular-nums text-white">
                #{order.orderNumber}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#E9CEE6] hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close order confirmation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto bg-[#240323] print:p-0 print:max-h-none print:overflow-visible print:bg-white">
          <ShortInvoiceCard order={order} currency={currency} settings={settings} compact />
        </div>

        <div className="p-4 sm:p-5 border-t border-[#681962] bg-[#240323] flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="modal-download-invoice-pdf-btn"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pdfDownloaded ? 'PDF Downloaded ✓' : 'Download Invoice (PDF)'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#4E0C47] hover:bg-[#6E1663] border border-[#7D2276] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#FFC700]" />
              <span>Print Short Invoice</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
