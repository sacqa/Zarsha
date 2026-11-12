import React from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Lock,
  Truck,
  Banknote,
} from 'lucide-react';
import { CartItem, Country, Currency, StoreSettings } from '../../types/ecommerce';
import {
  formatMinorUnits,
  calculateOrderFinancials,
  validateCountryEligibility,
} from '../../utils/commerce-engine';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentCountry: Country;
  currentCurrency: Currency;
  settings: StoreSettings;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onViewFullCart?: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currentCountry,
  currentCurrency,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onViewFullCart,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotalMinorUnits = items.reduce(
    (acc, item) => acc + item.totalPriceMinorUnits,
    0
  );

  const financials = calculateOrderFinancials({
    subtotalMinorUnits,
    country: currentCountry,
    currency: currentCurrency,
    freeShippingThresholdMinorUnits: settings.freeShippingThresholdMinorUnits,
  });

  const eligibility = validateCountryEligibility(currentCountry);
  const thresholdInTargetMinor = Math.round(
    (settings.freeShippingThresholdMinorUnits || 300000) * currentCurrency.exchangeRateToBase
  );
  const remainingForFreeShipping = Math.max(
    0,
    thresholdInTargetMinor - subtotalMinorUnits
  );
  const progressPercent =
    thresholdInTargetMinor > 0
      ? Math.min(100, Math.round((subtotalMinorUnits / thresholdInTargetMinor) * 100))
      : 100;

  return (
    <div
      data-testid="cart-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-[#120112]/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#240323] text-white h-full shadow-2xl flex flex-col justify-between border-l border-[#7A1870]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#661760] flex items-center justify-between bg-[#340732]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FFC700]" />
            <div>
              <h2
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Shopping Bag ({items.reduce((a, b) => a + b.quantity, 0)})
              </h2>
              <p className="text-[11px] text-[#E3C4DF]">
                {currentCountry.flagEmoji} {currentCountry.name} · {currentCurrency.code}
              </p>
            </div>
          </div>
          <button
            data-testid="close-cart-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-full text-[#E3C4DF] hover:text-white hover:bg-[#4E0C47] transition-colors cursor-pointer"
            aria-label="Close shopping bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-[#31062F] border-b border-[#5E1659] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-white">
                <Truck className="w-3.5 h-3.5 text-[#FFC700] shrink-0" />
                {remainingForFreeShipping > 0 ? (
                  <span>
                    Add{' '}
                    <strong className="tabular-nums text-[#FFC700]">
                      {formatMinorUnits(remainingForFreeShipping, currentCurrency)}
                    </strong>{' '}
                    more for <strong className="text-emerald-300">FREE Nationwide Delivery</strong>
                  </span>
                ) : (
                  <span className="text-emerald-300 font-bold">
                    ✓ FREE Nationwide Delivery Unlocked!
                  </span>
                )}
              </span>
              <span className="text-[10px] tabular-nums font-bold text-[#FFC700]">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#4A0D46] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="grow overflow-y-auto p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#E3C4DF] space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#340732] border border-[#681962] flex items-center justify-center text-[#FFC700]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Your shopping bag is empty</p>
              <p className="text-xs text-[#D8B6D5] max-w-xs">
                Discover our embroidered 3-piece lawn suits, festive chiffon formals, and everyday kurtis on Mega Sale.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] rounded-full text-xs font-extrabold cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                data-testid={`drawer-cart-item-${item.productId}`}
                className="flex gap-3.5 p-3.5 rounded-2xl bg-[#340732] border border-[#681962]"
              >
                <img
                  src={item.variant.image || item.product.galleryImages[0]}
                  alt={item.product.name}
                  className="w-16 h-20 rounded-xl object-cover object-top bg-[#4A0D46] border border-[#681962] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-white truncate">
                      {item.product.name}
                    </h3>
                    <button
                      type="button"
                      data-testid={`drawer-remove-item-${item.productId}`}
                      onClick={() => onRemoveItem(item.id)}
                      className="text-[#D8B6D5] hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                      aria-label={`Remove ${item.product.name} from bag`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#E3C4DF] truncate mt-0.5">
                    {item.variant.title}
                  </p>
                  <p className="text-[10px] text-[#D8B6D5] tabular-nums mt-0.5">
                    Unit: {formatMinorUnits(item.unitPriceMinorUnits, currentCurrency)}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center border border-[#681962] rounded-lg bg-[#240323]">
                      <button
                        type="button"
                        data-testid={`drawer-qty-dec-${item.productId}`}
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#E3C4DF] hover:text-white cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span
                        data-testid={`drawer-qty-val-${item.productId}`}
                        className="px-2.5 py-0.5 text-xs tabular-nums font-bold text-white"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        data-testid={`drawer-qty-inc-${item.productId}`}
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#E3C4DF] hover:text-white cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span
                      data-testid={`drawer-item-total-${item.productId}`}
                      className="text-xs font-extrabold tabular-nums text-[#FFC700]"
                    >
                      {formatMinorUnits(item.totalPriceMinorUnits, currentCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#661760] bg-[#31062F] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#E3C4DF]">
                <span>Subtotal</span>
                <span
                  data-testid="drawer-subtotal"
                  className="tabular-nums font-semibold text-white"
                >
                  {formatMinorUnits(financials.subtotalMinorUnits, currentCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-[#E3C4DF]">
                <span>Estimated Delivery ({currentCountry.code})</span>
                <span className="tabular-nums font-semibold text-white">
                  {financials.shippingFeeMinorUnits === 0
                    ? 'FREE'
                    : formatMinorUnits(financials.shippingFeeMinorUnits, currentCurrency)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#5E1659] flex justify-between text-sm font-bold text-white">
                <span>Estimated Total</span>
                <span data-testid="drawer-estimated-total" className="tabular-nums text-[#FFC700]">
                  {financials.formattedTotal}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#240323] border border-[#681962] text-[11px] text-[#E9CEE6] flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#FFC700] shrink-0" />
              <span>
                <strong className="text-white">Cash on Delivery</strong> &amp; promo codes (<strong className="text-[#FFC700]">ZARIYA15</strong>) available at Checkout.
              </span>
            </div>

            {eligibility.isEligible ? (
              <div className="grid grid-cols-2 gap-2.5">
                {onViewFullCart && (
                  <button
                    type="button"
                    data-testid="drawer-view-cart-btn"
                    onClick={onViewFullCart}
                    className="py-3 px-4 rounded-xl bg-[#240323] hover:bg-[#490B45] text-white border border-[#7A1870] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>View Bag</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="drawer-checkout-btn"
                  onClick={onCheckout}
                  className={`${
                    onViewFullCart ? 'col-span-1' : 'col-span-2'
                  } py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer`}
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Delivery unavailable for {currentCountry.name}.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
