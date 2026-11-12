import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  Truck,
  ExternalLink,
  Trash2,
  Heart,
  MapPin,
} from 'lucide-react';
import { ImmutableOrderSnapshot, StoreSettings, UserRole } from '../../types/ecommerce';
import { storeDb } from '../../services/store-db';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ImmutableOrderSnapshot[];
  settings: StoreSettings;
  currentRole: UserRole;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onRoleChanged: (role: UserRole) => void;
  onViewOrder: (order: ImmutableOrderSnapshot) => void;
  onOrdersUpdated?: () => void;
}

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  currentRole,
  wishlistCount = 0,
  onOpenWishlist,
  onRoleChanged,
  onViewOrder,
  onOrdersUpdated,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const customers = storeDb.getCustomers();
  const primaryCustomer = customers[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#120112]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#240323] text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#7A1870] my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#5C0E54] via-[#450B42] to-[#340732] border-b border-[#7A1870] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#240323]/60 border border-[#FFC700]/40 text-[#FFC700] rounded-2xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#FFE066] uppercase tracking-wider font-semibold">
                My ZARIYA Account &amp; Orders
              </div>
              <h2
                className="text-lg font-bold text-white mt-0.5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {primaryCustomer?.fullName || 'Ayesha Khan'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#E3C4DF] hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close my account"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-[#E9CEE6]">
          {/* Quick Profile & Wishlist Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#340732] border border-[#681962] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <MapPin className="w-4 h-4 text-[#FFC700]" />
                <span>Saved Pakistan Address</span>
              </div>
              <div className="text-[11px] text-[#E3C4DF]">
                {primaryCustomer?.addresses?.[0]
                  ? `${primaryCustomer.addresses[0].addressLine1}, ${primaryCustomer.addresses[0].city} (${primaryCustomer.phone})`
                  : 'Gulberg III, Lahore · +92 300 4128890'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#3E083C] border border-[#FFC700]/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-[#FFE066]">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Saved Wishlist ({wishlistCount})</span>
                </div>
                <div className="text-[11px] text-[#E3C4DF]">
                  View your saved Pakistani outfits
                </div>
              </div>
              {onOpenWishlist && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWishlist();
                  }}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-[11px] font-extrabold cursor-pointer"
                >
                  Open Wishlist
                </button>
              )}
            </div>
          </div>

          {/* Order History */}
          <div>
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FFC700]" />
              <span>Order History &amp; Receipts ({orders.length})</span>
            </h3>

            {orders.length === 0 ? (
              <p className="text-[#D8B6D5] italic">No orders placed yet.</p>
            ) : (
              <div className="border border-[#681962] bg-[#340732] rounded-2xl divide-y divide-[#5E1659] overflow-hidden">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold tabular-nums text-white">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[#E3C4DF] text-[11px] mt-0.5 flex items-center gap-2">
                        <span>{new Date(ord.orderDate).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>
                          {ord.shippingAddress.city}, {ord.shippingAddress.countryName}
                        </span>
                        <span>·</span>
                        <span className="tabular-nums font-bold text-[#FFC700]">
                          {ord.financials.formattedTotal}
                        </span>
                      </div>
                      {ord.shipping.trackingNumber && (
                        <div className="text-[11px] text-[#FFE066] mt-1 flex items-center gap-1 tabular-nums">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Tracking: {ord.shipping.trackingNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onViewOrder(ord);
                        }}
                        className="px-3 py-1.5 bg-[#240323] border border-[#681962] rounded-full text-xs font-semibold text-white hover:border-[#FFC700] flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Receipt</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteId === ord.orderId ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              storeDb.deleteOrder(ord.orderId, true);
                              setConfirmDeleteId(null);
                              onOrdersUpdated?.();
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 text-white rounded-full text-xs font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 bg-[#4E0C47] text-white rounded-full text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(ord.orderId)}
                          title={`Delete order ${ord.orderNumber}`}
                          className="p-1.5 bg-[#240323] border border-rose-500/40 text-rose-300 hover:bg-rose-950/60 rounded-full transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Context Switcher for Store Testing */}
          <div className="p-4 rounded-2xl bg-[#340732] border border-[#681962] flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-white">Account Access Role:</div>
              <div className="text-[#D8B6D5] text-[11px]">
                Switch view permissions for demo/operations testing.
              </div>
            </div>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                storeDb.setCurrentUserRole(newRole);
                onRoleChanged(newRole);
              }}
              className="text-xs bg-[#240323] border border-[#681962] text-white rounded-xl px-3 py-1.5 font-medium"
            >
              <option value="super_admin">Super Admin</option>
              <option value="order_manager">Order Manager</option>
              <option value="customer">Standard Customer</option>
            </select>
          </div>
        </div>

        <div className="p-5 border-t border-[#661760] bg-[#31062F] text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] rounded-full text-xs font-extrabold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
