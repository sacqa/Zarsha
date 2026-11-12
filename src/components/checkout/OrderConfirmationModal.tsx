import React from 'react';
import { CheckCircle2, Truck, Printer, X } from 'lucide-react';
import { ImmutableOrderSnapshot } from '../../types/ecommerce';

interface OrderConfirmationModalProps {
  order: ImmutableOrderSnapshot | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#140113]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#31062F] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#6E1B67] my-8 text-white">
        <div className="p-6 bg-gradient-to-r from-[#4E0C47] via-[#7A1870] to-[#4E0C47] border-b border-[#6E1B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF9900] text-[#240323] rounded-full shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] text-[#FFC700] uppercase tracking-widest font-bold">
                ZARIYA Order Receipt
              </div>
              <h2 className="text-xl font-bold tabular-nums text-white mt-0.5">
                {order.orderNumber}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#E9CEE6] hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close order confirmation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-[#E9CEE6]">
          <div className="p-4 rounded-2xl bg-[#240323] border border-[#681962] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-[#C89EC4] uppercase font-semibold">
                Courier &amp; Delivery Service
              </div>
              <div className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#FFC700]" />
                <span>
                  {order.shipping.carrier} · {order.shipping.service}
                </span>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-[11px] text-[#C89EC4] uppercase font-semibold">
                Tracking Number
              </div>
              <div className="tabular-nums font-bold text-[#FFC700] mt-0.5">
                {order.shipping.trackingNumber || 'ZAR-PK-PRIORITY'}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">
              Outfits Ordered
            </h4>
            <div className="border border-[#681962] bg-[#240323] rounded-2xl divide-y divide-[#4E104B] overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{item.productName}</div>
                    <div className="text-[11px] text-[#C89EC4]">
                      {item.variantTitle} · Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="tabular-nums font-bold text-[#FFC700]">
                    Rs. {Math.round(item.totalPriceMinorUnits / 100).toLocaleString('en-PK')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#4E0C47] border border-[#FFC700]/40 flex justify-between font-bold text-sm text-white">
            <span>Final Amount ({order.payment.method.replace(/_/g, ' ').toUpperCase()}):</span>
            <span className="tabular-nums text-[#FFC700]">
              {order.financials.formattedTotal}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#240323] border border-[#681962]">
            <h4 className="font-bold text-white uppercase tracking-wider mb-1">
              Delivery Recipient
            </h4>
            <p className="text-[#E9CEE6]">
              <strong className="text-white">{order.customer.fullName}</strong> ({order.customer.phone})
              <br />
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.stateOrProvince}{' '}
              {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-[#681962] bg-[#240323] flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#4E0C47] hover:bg-[#6E1663] border border-[#7D2276] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#FFC700]" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#FF9900] hover:bg-[#FFC700] text-[#240323] rounded-full text-xs font-extrabold cursor-pointer transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
