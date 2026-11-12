import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Tag,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Lock,
  Banknote,
} from 'lucide-react';
import {
  CartItem,
  Country,
  Currency,
  DiscountRule,
  StoreSettings,
} from '../../types/ecommerce';
import {
  formatMinorUnits,
  calculateOrderFinancials,
  calculateDiscountBenefit,
  getAvailableShippingMethods,
  validateCountryEligibility,
} from '../../utils/commerce-engine';

interface ShoppingCartPageProps {
  items: CartItem[];
  currentCountry: Country;
  currentCurrency: Currency;
  settings: StoreSettings;
  discounts: DiscountRule[];
  appliedDiscountCode: string;
  onApplyDiscountCode: (code: string) => void;
  orderNotes: string;
  onChangeOrderNotes: (notes: string) => void;
  selectedShippingMethodId: string;
  onSelectShippingMethod: (methodId: string) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
  onViewProduct: (product: CartItem['product']) => void;
}

export const ShoppingCartPage: React.FC<ShoppingCartPageProps> = ({
  items,
  currentCountry,
  currentCurrency,
  settings,
  discounts,
  appliedDiscountCode,
  onApplyDiscountCode,
  orderNotes,
  onChangeOrderNotes,
  selectedShippingMethodId,
  onSelectShippingMethod,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping,
  onProceedToCheckout,
  onViewProduct,
}) => {
  const [discountInput, setDiscountInput] = useState(appliedDiscountCode || '');
  const [discountFeedback, setDiscountFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const subtotalMinorUnits = items.reduce(
    (acc, item) => acc + item.totalPriceMinorUnits,
    0
  );

  const shippingMethods = getAvailableShippingMethods(
    currentCountry,
    currentCurrency,
    settings
  );
  const activeShippingMethod =
    shippingMethods.find((m) => m.id === selectedShippingMethodId) ||
    shippingMethods[0];

  const matchedDiscountRule = appliedDiscountCode
    ? discounts.find(
        (d) => d.code.trim().toUpperCase() === appliedDiscountCode.trim().toUpperCase()
      ) || null
    : null;

  const financials = calculateOrderFinancials({
    subtotalMinorUnits,
    country: currentCountry,
    currency: currentCurrency,
    freeShippingThresholdMinorUnits: settings.freeShippingThresholdMinorUnits,
    shippingMethodOption: activeShippingMethod,
    discountRule: matchedDiscountRule,
  });

  const eligibility = validateCountryEligibility(currentCountry);
  const thresholdInTargetMinor = Math.round(
    (settings.freeShippingThresholdMinorUnits || 300000) * currentCurrency.exchangeRateToBase
  );
  const remainingForFreeShipping = Math.max(
    0,
    thresholdInTargetMinor - subtotalMinorUnits
  );

  const handleApplyDiscount = (codeToApply?: string) => {
    const rawCode = (codeToApply !== undefined ? codeToApply : discountInput)
      .trim()
      .toUpperCase();
    if (!rawCode) {
      onApplyDiscountCode('');
      setDiscountFeedback(null);
      return;
    }

    const rule = discounts.find((d) => d.code.trim().toUpperCase() === rawCode);
    if (!rule) {
      setDiscountFeedback({
        type: 'error',
        message: `Promo code "${rawCode}" is not valid.`,
      });
      return;
    }

    const benefit = calculateDiscountBenefit(
      subtotalMinorUnits,
      activeShippingMethod.baseFeeMinorUnits,
      rule
    );

    if (!benefit.eligible) {
      setDiscountFeedback({
        type: 'error',
        message:
          benefit.reason ||
          `Code "${rawCode}" requires a minimum order of ${formatMinorUnits(
            rule.minPurchaseMinorUnits,
            currentCurrency
          )}.`,
      });
      return;
    }

    setDiscountInput(rawCode);
    onApplyDiscountCode(rawCode);
    setDiscountFeedback({
      type: 'success',
      message:
        rule.type === 'free_shipping'
          ? `Code "${rawCode}" applied — Free Nationwide Delivery unlocked!`
          : `Code "${rawCode}" applied — You saved ${formatMinorUnits(
              benefit.discountMinorUnits,
              currentCurrency
            )}!`,
    });
  };

  const handleRemoveDiscount = () => {
    setDiscountInput('');
    onApplyDiscountCode('');
    setDiscountFeedback(null);
  };

  const activePromoPills = discounts.filter((d) => d.status === 'active');

  return (
    <div
      data-testid="shopping-cart-page"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white"
    >
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#661760] pb-6">
        <div>
          <button
            type="button"
            data-testid="cart-continue-shopping-top"
            onClick={onContinueShopping}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <span>Your Shopping Bag</span>
            <span className="text-xs sm:text-sm tabular-nums px-3 py-1 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] font-extrabold">
              {items.reduce((acc, i) => acc + i.quantity, 0)} Items
            </span>
          </h1>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="cart-clear-btn"
              onClick={onClearCart}
              className="px-3.5 py-2 rounded-full border border-[#681962] text-xs font-semibold text-[#E3C4DF] hover:text-rose-300 hover:border-rose-400 transition-colors cursor-pointer"
            >
              Clear Bag
            </button>
            <button
              type="button"
              data-testid="cart-checkout-top-btn"
              onClick={onProceedToCheckout}
              disabled={!eligibility.isEligible}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div
          data-testid="empty-cart-state"
          className="my-12 bg-[#340732] rounded-3xl border border-[#681962] p-12 text-center max-w-xl mx-auto space-y-4 shadow-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#4E0C47] border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Your shopping bag is currently empty
          </h2>
          <p className="text-xs text-[#E3C4DF] leading-relaxed">
            Explore ZARIYA’s Mega Fashion Sale — embroidered 3-piece lawn suits, festive organza pret, chiffon formals, and casual kurtis delivered nationwide with Cash on Delivery.
          </p>
          <div className="pt-2">
            <button
              type="button"
              data-testid="empty-cart-shop-btn"
              onClick={onContinueShopping}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Shop Sale Collections</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Delivery Banner */}
            <div className="p-4 rounded-2xl bg-[#340732] border border-[#7A1870] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-white">
                <Truck className="w-4 h-4 text-[#FFC700] shrink-0" />
                {remainingForFreeShipping > 0 && financials.shippingFeeMinorUnits > 0 ? (
                  <span>
                    Add{' '}
                    <strong className="tabular-nums text-[#FFC700]">
                      {formatMinorUnits(remainingForFreeShipping, currentCurrency)}
                    </strong>{' '}
                    more to unlock <strong className="text-emerald-300">FREE Delivery Across Pakistan</strong>!
                  </span>
                ) : (
                  <span className="font-bold text-emerald-300">
                    ✓ Congratulations! Your order qualifies for FREE Nationwide Delivery.
                  </span>
                )}
              </div>
              <span className="text-[11px] tabular-nums text-[#FFC700] font-bold">
                Free Above {formatMinorUnits(thresholdInTargetMinor, currentCurrency)}
              </span>
            </div>

            {/* Line Items */}
            <div className="bg-[#340732] rounded-3xl border border-[#681962] overflow-hidden shadow-md">
              <div className="hidden sm:grid sm:grid-cols-12 px-6 py-3.5 bg-[#450B42] border-b border-[#681962] text-[11px] font-bold uppercase tracking-wider text-[#FFE066]">
                <div className="col-span-6">Outfit &amp; Size</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Line Total</div>
              </div>

              <div className="divide-y divide-[#5E1659]">
                {items.map((item) => {
                  const maxStock = item.product.continueSellingWhenOutOfStock
                    ? 99
                    : Math.max(1, item.variant.stockQuantity);
                  return (
                    <div
                      key={item.id}
                      data-testid={`cart-page-item-${item.productId}`}
                      className="p-5 sm:px-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                    >
                      <div className="sm:col-span-6 flex items-start gap-4">
                        <img
                          src={item.variant.image || item.product.galleryImages[0]}
                          alt={item.product.name}
                          onClick={() => onViewProduct(item.product)}
                          className="w-20 h-24 rounded-xl object-cover object-top bg-[#4A0D46] border border-[#681962] shrink-0 cursor-pointer"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#FFC700]">
                            {item.product.fabric || item.product.brand}
                          </div>
                          <h3
                            onClick={() => onViewProduct(item.product)}
                            className="text-sm font-bold text-white hover:text-[#FFC700] cursor-pointer truncate"
                          >
                            {item.product.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#E3C4DF]">
                            <span className="px-2 py-0.5 rounded-md bg-[#240323] border border-[#681962] font-semibold text-[11px] text-white">
                              {item.variant.title}
                            </span>
                            <span className="text-[11px] tabular-nums text-[#D8B6D5]">
                              SKU: {item.variant.sku}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ready to ship from Lahore</span>
                            </span>
                            <button
                              type="button"
                              data-testid={`cart-page-remove-${item.productId}`}
                              onClick={() => onRemoveItem(item.id)}
                              className="text-[11px] text-rose-300 hover:text-rose-200 font-semibold inline-flex items-center gap-1 ml-2 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2 sm:text-center flex sm:block justify-between items-center text-xs">
                        <span className="sm:hidden text-[#E3C4DF]">Unit Price:</span>
                        <span className="tabular-nums font-semibold text-white">
                          {formatMinorUnits(item.unitPriceMinorUnits, currentCurrency)}
                        </span>
                      </div>

                      <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                        <span className="sm:hidden text-xs text-[#E3C4DF]">Quantity:</span>
                        <div className="inline-flex items-center border border-[#681962] rounded-lg bg-[#240323]">
                          <button
                            type="button"
                            data-testid={`cart-page-qty-dec-${item.productId}`}
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-xs font-bold text-[#E3C4DF] hover:text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            data-testid={`cart-page-qty-val-${item.productId}`}
                            className="px-3 py-1.5 text-xs tabular-nums font-bold text-white"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            data-testid={`cart-page-qty-inc-${item.productId}`}
                            onClick={() =>
                              onUpdateQuantity(
                                item.id,
                                Math.min(maxStock, item.quantity + 1)
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-bold text-[#E3C4DF] hover:text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2 sm:text-right flex sm:block justify-between items-center">
                        <span className="sm:hidden text-xs text-[#E3C4DF]">Total:</span>
                        <span
                          data-testid={`cart-page-line-total-${item.productId}`}
                          className="text-sm font-extrabold tabular-nums text-[#FFC700]"
                        >
                          {formatMinorUnits(item.totalPriceMinorUnits, currentCurrency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Notes & Delivery Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#340732] rounded-2xl border border-[#681962] p-5 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFC700]">
                  <FileText className="w-4 h-4" />
                  <span>Delivery / Gift Instructions</span>
                </label>
                <textarea
                  data-testid="cart-order-notes"
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => onChangeOrderNotes(e.target.value)}
                  placeholder="Call before delivery, landmark near house, or Eid gift card note..."
                  className="w-full p-3 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
                />
              </div>

              <div className="bg-[#340732] rounded-2xl border border-[#681962] p-5 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFC700]">
                  <Truck className="w-4 h-4" />
                  <span>Delivery Service ({currentCountry.name})</span>
                </label>
                <div className="space-y-2">
                  {shippingMethods.map((method) => {
                    const isSelected = activeShippingMethod.id === method.id;
                    const isFree =
                      (method.freeOverThreshold &&
                        subtotalMinorUnits >= thresholdInTargetMinor) ||
                      matchedDiscountRule?.type === 'free_shipping';
                    return (
                      <label
                        key={method.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all text-xs ${
                          isSelected
                            ? 'border-[#FFC700] bg-[#4E0C47] text-white'
                            : 'border-[#681962] bg-[#240323] text-[#E3C4DF] hover:border-[#FFC700]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="cart_shipping_estimate"
                            checked={isSelected}
                            onChange={() => onSelectShippingMethod(method.id)}
                            className="accent-[#FF9900]"
                          />
                          <div className="truncate">
                            <div className="font-bold text-white truncate">
                              {method.name}
                            </div>
                            <div className="text-[10px] text-[#D8B6D5]">
                              {method.estimatedLabel}
                            </div>
                          </div>
                        </div>
                        <span className="tabular-nums font-bold text-[#FFC700] shrink-0">
                          {isFree
                            ? 'FREE'
                            : formatMinorUnits(method.baseFeeMinorUnits, currentCurrency)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Promo & Summary */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-[#340732] rounded-3xl border border-[#7A1870] p-6 space-y-5 shadow-lg">
              <h2
                className="text-lg font-bold text-white border-b border-[#5E1659] pb-3"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Order Summary
              </h2>

              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-[#E9CEE6]">
                  Promo / Sale Code
                </label>
                <div className="flex gap-2">
                  <div className="relative grow">
                    <Tag className="w-3.5 h-3.5 text-[#D8B6D5] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      data-testid="cart-discount-input"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="e.g. ZARIYA15 or SALE30"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs uppercase focus:outline-hidden focus:border-[#FFC700]"
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="cart-apply-discount-btn"
                    onClick={() => handleApplyDiscount()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {appliedDiscountCode && matchedDiscountRule && (
                  <div
                    data-testid="cart-applied-discount-badge"
                    className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300"
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{matchedDiscountRule.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-emerald-300 hover:text-rose-300 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {discountFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] flex items-center gap-1.5 ${
                      discountFeedback.type === 'success'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950/60 text-rose-200 border border-rose-500/40'
                    }`}
                  >
                    {discountFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{discountFeedback.message}</span>
                  </div>
                )}

                {activePromoPills.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D8B6D5] block mb-1.5">
                      Available Sale Codes (Tap to Apply):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePromoPills.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleApplyDiscount(d.code)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            appliedDiscountCode === d.code
                              ? 'bg-[#FFC700] text-[#240323] border-[#FFC700]'
                              : 'bg-[#240323] text-white border-[#681962] hover:border-[#FFC700]'
                          }`}
                        >
                          {d.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#5E1659] text-xs">
                <div className="flex justify-between text-[#E3C4DF]">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-semibold text-white">
                    {formatMinorUnits(financials.subtotalMinorUnits, currentCurrency)}
                  </span>
                </div>

                {financials.discountMinorUnits > 0 && (
                  <div className="flex justify-between text-emerald-300 font-semibold">
                    <span>Promo Discount ({appliedDiscountCode})</span>
                    <span className="tabular-nums">
                      -{formatMinorUnits(financials.discountMinorUnits, currentCurrency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[#E3C4DF]">
                  <span>Delivery Charges</span>
                  <span className="tabular-nums font-semibold text-white">
                    {financials.shippingFeeMinorUnits === 0
                      ? 'FREE'
                      : formatMinorUnits(financials.shippingFeeMinorUnits, currentCurrency)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#5E1659] flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Payable</span>
                  <span
                    data-testid="cart-page-total"
                    className="text-xl font-extrabold tabular-nums text-[#FFC700]"
                  >
                    {financials.formattedTotal}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {eligibility.isEligible ? (
                  <button
                    type="button"
                    data-testid="cart-page-checkout-btn"
                    onClick={onProceedToCheckout}
                    className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Delivery unavailable for {currentCountry.name}.</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#240323] border border-[#681962] text-[11px] text-[#E3C4DF] flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#FFC700] shrink-0" />
                  <span>Cash on Delivery, Bank Transfer (IBFT) &amp; JazzCash/Easypaisa supported.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
