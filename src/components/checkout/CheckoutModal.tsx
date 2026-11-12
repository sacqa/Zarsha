import React from 'react';
import { ImmutableOrderSnapshot, CartItem, Country, Currency, StoreSettings } from '../../types/ecommerce';
import { ShopifyCheckoutPage } from './ShopifyCheckoutPage';
import { storeDb } from '../../services/store-db';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentCountry: Country;
  currentCurrency: Currency;
  settings: StoreSettings;
  onOrderCompleted: (order: ImmutableOrderSnapshot) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentCountry,
  currentCurrency,
  settings,
  onOrderCompleted,
}) => {
  const [discountCode, setDiscountCode] = React.useState('');
  const [giftCardCode, setGiftCardCode] = React.useState('');
  const [shippingMethodId, setShippingMethodId] = React.useState('pk_standard');
  const [notes, setNotes] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#240323]">
      <ShopifyCheckoutPage
        cartItems={cartItems}
        currentCountry={currentCountry}
        currentCurrency={currentCurrency}
        settings={settings}
        discounts={storeDb.getDiscounts()}
        giftCards={storeDb.getGiftCards()}
        customers={storeDb.getCustomers()}
        appliedDiscountCode={discountCode}
        onApplyDiscountCode={setDiscountCode}
        appliedGiftCardCode={giftCardCode}
        onApplyGiftCardCode={setGiftCardCode}
        selectedShippingMethodId={shippingMethodId}
        onSelectShippingMethod={setShippingMethodId}
        orderNotes={notes}
        onChangeOrderNotes={setNotes}
        onBackToCart={onClose}
        onBackToStorefront={onClose}
        onOrderCompleted={onOrderCompleted}
      />
    </div>
  );
};
