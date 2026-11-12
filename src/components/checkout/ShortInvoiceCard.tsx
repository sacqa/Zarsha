import React from 'react';
import { Currency, ImmutableOrderSnapshot, StoreSettings } from '../../types/ecommerce';
import { buildShortInvoiceData } from '../../utils/invoice-pdf';

interface ShortInvoiceCardProps {
  order: ImmutableOrderSnapshot;
  currency?: Currency;
  settings?: Partial<StoreSettings>;
  compact?: boolean;
}

export const ShortInvoiceCard: React.FC<ShortInvoiceCardProps> = ({
  order,
  currency,
  settings,
  compact = false,
}) => {
  const data = buildShortInvoiceData(order, currency, settings);

  return (
    <div
      className={`bg-white text-[#1F101E] rounded-2xl border border-[#E2D0E1] overflow-hidden shadow-lg print:shadow-none print:border-[#D4BFD3] print:rounded-none ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
      style={{ fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Plum & Gold Top Invoice Header */}
      <div className="bg-[#5C0E54] text-white px-5 py-4 border-b-4 border-[#FFC700] flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold tracking-tight leading-none text-white">
            {data.storeName}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#FFC700] mt-1">
            {data.storeTagline}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-extrabold uppercase tracking-wider text-white">
            Short Invoice
          </div>
          <div className="text-xs font-bold tabular-nums text-[#FFC700] mt-0.5">
            #{data.orderNumber}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Invoice & Payment Meta Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-[#FAF5FA] border border-[#E2D0E1] p-3">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C0E54]">
              Invoice Details
            </div>
            <div className="font-semibold text-[#1F101E] tabular-nums">{data.invoiceNumber}</div>
            <div className="text-[11px] text-[#6B5369]">
              {data.orderDateFormatted} · <span className="font-semibold text-[#5C0E54]">{data.orderStatusLabel}</span>
            </div>
          </div>
          <div className="space-y-0.5 sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C0E54]">
              Payment Summary
            </div>
            <div className="font-semibold text-[#1F101E]">{data.paymentMethodLabel}</div>
            <div className="text-[11px] text-[#6B5369] tabular-nums">
              {data.paymentStatusLabel} · Ref: {data.transactionRef}
            </div>
          </div>
        </div>

        {/* Customer & Delivery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#E2D0E1] p-3 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C0E54]">
              Customer
            </div>
            <div className="font-bold text-[#1F101E]">{data.customerName}</div>
            <div className="text-[11px] text-[#4B3649] tabular-nums">{data.customerPhone}</div>
            <div className="text-[11px] text-[#6B5369] break-all">{data.customerEmail}</div>
          </div>
          <div className="rounded-xl border border-[#E2D0E1] p-3 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C0E54]">
              Deliver To
            </div>
            {data.shippingAddressLines.map((line, i) => (
              <div key={i} className="text-[11px] text-[#4B3649] leading-snug">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Courier Bar */}
        <div className="rounded-lg bg-[#FAF5FA] border border-[#E2D0E1] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-[#240323]">
            Courier: <span className="font-normal text-[#4B3649]">{data.courierName}</span>
          </span>
          <span className="font-bold tabular-nums text-[#B45309]">
            Tracking #: {data.trackingNumber}
          </span>
        </div>

        {/* Items Table */}
        <div className="rounded-xl border border-[#E2D0E1] overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#5C0E54] text-white text-[10px] uppercase tracking-wider">
                <th className="py-2 px-2.5 w-7">#</th>
                <th className="py-2 px-2.5">Item ({data.totalItemCount} pcs)</th>
                <th className="py-2 px-2.5 text-center w-12">Qty</th>
                <th className="py-2 px-2.5 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE3EE]">
              {data.items.map((item) => (
                <tr key={item.index} className="even:bg-[#FCF9FC]">
                  <td className="py-2 px-2.5 text-[11px] font-semibold text-[#6B5369] align-top">
                    {item.index}
                  </td>
                  <td className="py-2 px-2.5 align-top">
                    <div className="font-bold text-[#1F101E] leading-snug">{item.name}</div>
                    <div className="text-[10px] text-[#6B5369]">
                      {item.variantLine}
                      {item.sku ? ` · SKU: ${item.sku}` : ''}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center font-bold text-[#1F101E] tabular-nums align-top">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-[#240323] tabular-nums align-top">
                    {item.totalFormatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
          {data.notes ? (
            <div className="sm:max-w-[46%] rounded-xl bg-[#FAF5FA] border border-[#E2D0E1] p-2.5 text-[11px] text-[#6B5369]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C0E54] mb-0.5">
                Order Note
              </div>
              {data.notes}
            </div>
          ) : (
            <div />
          )}

          <div className="sm:w-64 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-[#6B5369]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#1F101E] tabular-nums">{data.subtotalFormatted}</span>
            </div>
            {data.discountMinorUnits > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount{data.discountCode ? ` (${data.discountCode})` : ''}</span>
                <span className="tabular-nums">{data.discountFormatted}</span>
              </div>
            )}
            {data.giftCardAppliedMinorUnits > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Gift Card</span>
                <span className="tabular-nums">{data.giftCardFormatted}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6B5369]">
              <span>Delivery / Shipping</span>
              <span className="font-semibold text-[#1F101E] tabular-nums">{data.shippingFormatted}</span>
            </div>
            {data.taxMinorUnits > 0 && (
              <div className="flex justify-between text-[#6B5369]">
                <span>Tax</span>
                <span className="font-semibold text-[#1F101E] tabular-nums">{data.taxFormatted}</span>
              </div>
            )}
            <div className="mt-1.5 rounded-xl bg-[#5C0E54] text-white px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Net Total</span>
              <span className="text-sm font-extrabold tabular-nums text-[#FFC700]">
                {data.netTotalFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t-2 border-[#FFC700] text-center space-y-0.5">
          <div className="text-[11px] font-bold text-[#5C0E54]">
            Thank you for shopping with {data.storeName}!
          </div>
          <div className="text-[10px] text-[#6B5369]">
            {data.storeAddress} · WhatsApp: {data.storePhone}
          </div>
          <div className="text-[10px] text-[#6B5369]">
            {data.storeEmail} · {data.storeDomain} · 7-Day Hassle-Free Exchange
          </div>
        </div>
      </div>
    </div>
  );
};
