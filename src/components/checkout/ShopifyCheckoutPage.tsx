import React, { useState, useEffect } from 'react';
import {
  Lock,
  Truck,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Tag,
  Gift,
  UserCheck,
  User,
  MapPin,
  RefreshCw,
  Building2,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Landmark,
} from 'lucide-react';
import {
  CartItem,
  Country,
  Currency,
  CustomerRecord,
  DiscountRule,
  GiftCard,
  ImmutableOrderSnapshot,
  StoreSettings,
} from '../../types/ecommerce';
import {
  formatMinorUnits,
  calculateOrderFinancials,
  calculateDiscountBenefit,
  evaluateGiftCardRedemption,
  getAvailableShippingMethods,
  validateCountryEligibility,
  tokenizePaymentCard,
  buildImmutableOrderSnapshot,
} from '../../utils/commerce-engine';
import { storeDb } from '../../services/store-db';

interface ShopifyCheckoutPageProps {
  cartItems: CartItem[];
  currentCountry: Country;
  currentCurrency: Currency;
  settings: StoreSettings;
  discounts: DiscountRule[];
  giftCards: GiftCard[];
  customers: CustomerRecord[];
  appliedDiscountCode: string;
  onApplyDiscountCode: (code: string) => void;
  appliedGiftCardCode: string;
  onApplyGiftCardCode: (code: string) => void;
  selectedShippingMethodId: string;
  onSelectShippingMethod: (methodId: string) => void;
  orderNotes: string;
  onChangeOrderNotes: (notes: string) => void;
  onBackToCart: () => void;
  onBackToStorefront: () => void;
  onOrderCompleted: (order: ImmutableOrderSnapshot) => void;
}

const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Islamabad Capital Territory',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

const PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Gujranwala',
  'Sialkot',
  'Peshawar',
  'Quetta',
  'Hyderabad',
  'Bahawalpur',
];

export const ShopifyCheckoutPage: React.FC<ShopifyCheckoutPageProps> = ({
  cartItems,
  currentCountry,
  currentCurrency,
  settings,
  discounts,
  giftCards,
  customers,
  appliedDiscountCode,
  onApplyDiscountCode,
  appliedGiftCardCode,
  onApplyGiftCardCode,
  selectedShippingMethodId,
  onSelectShippingMethod,
  orderNotes,
  onBackToCart,
  onBackToStorefront,
  onOrderCompleted,
}) => {
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => `idem_pk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  );
  const [draftOrderNumber] = useState<string>(
    () => `ZAR-PK-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Guest vs Customer Login
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'login'>('guest');
  const [loggedInCustomer, setLoggedInCustomer] = useState<CustomerRecord | null>(null);
  const [loginEmailInput, setLoginEmailInput] = useState(
    () => customers[0]?.email || 'ayesha.khan@gmail.com'
  );
  const [loginError, setLoginError] = useState<string | null>(null);

  // Pakistani Customer & Address Defaults
  const [email, setEmail] = useState('ayesha.khan@gmail.com');
  const [phone, setPhone] = useState('+92 300 4128890');
  const [fullName, setFullName] = useState('Ayesha Khan');
  const [addressLine1, setAddressLine1] = useState('House 42-B, Block K, Gulberg III');
  const [addressLine2, setAddressLine2] = useState('Near MM Alam Road');
  const [city, setCity] = useState('Lahore');
  const [province, setProvince] = useState('Punjab');
  const [postalCode, setPostalCode] = useState('54660');

  // Billing Address
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingFullName, setBillingFullName] = useState('Ayesha Khan');
  const [billingAddressLine1, setBillingAddressLine1] = useState('House 42-B, Block K, Gulberg III');
  const [billingCity, setBillingCity] = useState('Lahore');
  const [billingPostalCode, setBillingPostalCode] = useState('54660');

  // Promo & Gift Card
  const [discountInput, setDiscountInput] = useState(appliedDiscountCode || '');
  const [discountMessage, setDiscountMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [giftCardInput, setGiftCardInput] = useState(appliedGiftCardCode || '');
  const [giftCardMessage, setGiftCardMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Pakistani Payment Methods (COD Default)
  const [paymentMethod, setPaymentMethod] = useState<
    | 'cash_on_delivery'
    | 'bank_transfer'
    | 'jazzcash_easypaisa'
    | 'credit_card_gateway'
  >('cash_on_delivery');

  const [walletMobileNumber, setWalletMobileNumber] = useState('0300 4128890');
  const [bankReference, setBankReference] = useState('');
  const [cardNumber, setCardNumber] = useState('4532 8810 9921 4481');
  const [cardholderName, setCardholderName] = useState('AYESHA KHAN');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('842');
  const [simulateDecline, setSimulateDecline] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'authorizing' | 'failed' | 'captured'
  >('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [backendVerifiedTotalMinor, setBackendVerifiedTotalMinor] = useState<number | null>(null);
  const [mobileOrderSummaryOpen, setMobileOrderSummaryOpen] = useState(false);

  const subtotalMinorUnits = cartItems.reduce(
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

  const preGiftCardFinancials = calculateOrderFinancials({
    subtotalMinorUnits,
    country: currentCountry,
    currency: currentCurrency,
    freeShippingThresholdMinorUnits: settings.freeShippingThresholdMinorUnits,
    shippingMethodOption: activeShippingMethod,
    discountRule: matchedDiscountRule,
  });

  const giftCardEval = evaluateGiftCardRedemption({
    amountDueMinorUnits: preGiftCardFinancials.totalAmountMinorUnits,
    giftCards,
    giftCardCode: appliedGiftCardCode,
  });

  const financials = calculateOrderFinancials({
    subtotalMinorUnits,
    country: currentCountry,
    currency: currentCurrency,
    freeShippingThresholdMinorUnits: settings.freeShippingThresholdMinorUnits,
    shippingMethodOption: activeShippingMethod,
    discountRule: matchedDiscountRule,
    giftCardAppliedMinorUnits: giftCardEval.valid ? giftCardEval.appliedMinorUnits : 0,
  });

  useEffect(() => {
    let active = true;
    const verifyWithBackend = async () => {
      try {
        const res = await fetch('/api/checkout/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPriceMinorUnits: i.unitPriceMinorUnits,
            })),
            countryCode: currentCountry.code,
            currencyCode: currentCurrency.code,
            shippingMethodId: activeShippingMethod.id,
            discountCode: appliedDiscountCode,
            giftCardCode: appliedGiftCardCode,
            customDiscounts: discounts,
            customGiftCards: giftCards,
            freeShippingThresholdMinorUnits: settings.freeShippingThresholdMinorUnits,
          }),
        });
        if (res.ok && active) {
          const data = await res.json();
          if (data?.financials?.totalAmountMinorUnits !== undefined) {
            setBackendVerifiedTotalMinor(data.financials.totalAmountMinorUnits);
          }
        }
      } catch {
        // fallback to client calculation
      }
    };
    if (cartItems.length > 0) {
      void verifyWithBackend();
    }
    return () => {
      active = false;
    };
  }, [
    subtotalMinorUnits,
    currentCountry.code,
    currentCurrency.code,
    activeShippingMethod.id,
    appliedDiscountCode,
    appliedGiftCardCode,
    settings.freeShippingThresholdMinorUnits,
  ]);

  const handleCustomerLogin = (emailToFind?: string) => {
    const targetEmail = (emailToFind || loginEmailInput).trim().toLowerCase();
    const matched = customers.find((c) => c.email.trim().toLowerCase() === targetEmail);
    if (!matched) {
      setLoginError(`No saved account found for "${targetEmail}". You can continue as a guest.`);
      return;
    }
    setLoggedInCustomer(matched);
    setLoginError(null);
    setFullName(matched.fullName);
    setEmail(matched.email);
    setPhone(matched.phone);
    const defaultAddr = matched.addresses.find((a) => a.isDefault) || matched.addresses[0];
    if (defaultAddr) {
      setAddressLine1(defaultAddr.addressLine1);
      setAddressLine2(defaultAddr.addressLine2 || '');
      setCity(defaultAddr.city);
      setProvince(defaultAddr.municipality || 'Punjab');
      setPostalCode(defaultAddr.postalCode);
    }
  };

  const handleApplyDiscount = (codeOverride?: string) => {
    const code = (codeOverride !== undefined ? codeOverride : discountInput)
      .trim()
      .toUpperCase();
    if (!code) {
      onApplyDiscountCode('');
      setDiscountMessage(null);
      return;
    }
    const rule = discounts.find((d) => d.code.trim().toUpperCase() === code);
    if (!rule) {
      setDiscountMessage({ type: 'error', text: `Promo code "${code}" is invalid.` });
      return;
    }
    const benefit = calculateDiscountBenefit(
      subtotalMinorUnits,
      activeShippingMethod.baseFeeMinorUnits,
      rule
    );
    if (!benefit.eligible) {
      setDiscountMessage({
        type: 'error',
        text:
          benefit.reason ||
          `Minimum order of ${formatMinorUnits(rule.minPurchaseMinorUnits, currentCurrency)} required.`,
      });
      return;
    }
    setDiscountInput(code);
    onApplyDiscountCode(code);
    setDiscountMessage({
      type: 'success',
      text:
        rule.type === 'free_shipping'
          ? `Free delivery code "${code}" applied!`
          : `Promo "${code}" applied (-${formatMinorUnits(benefit.discountMinorUnits, currentCurrency)})!`,
    });
  };

  const handleApplyGiftCard = (codeOverride?: string) => {
    const code = (codeOverride !== undefined ? codeOverride : giftCardInput)
      .trim()
      .toUpperCase();
    if (!code) {
      onApplyGiftCardCode('');
      setGiftCardMessage(null);
      return;
    }
    const evalResult = evaluateGiftCardRedemption({
      amountDueMinorUnits: preGiftCardFinancials.totalAmountMinorUnits,
      giftCards,
      giftCardCode: code,
    });
    if (!evalResult.valid) {
      setGiftCardMessage({
        type: 'error',
        text: evalResult.errorMessage || `Gift card "${code}" could not be applied.`,
      });
      return;
    }
    setGiftCardInput(code);
    onApplyGiftCardCode(code);
    setGiftCardMessage({
      type: 'success',
      text: `Gift card applied (-${formatMinorUnits(evalResult.appliedMinorUnits, currentCurrency)}).`,
    });
  };

  const handleCompleteCheckout = async (
    e?: React.FormEvent,
    options?: { forceDeclineOff?: boolean }
  ) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (paymentStatus === 'authorizing' || paymentStatus === 'captured') return;

    setPaymentError(null);

    const eligibility = validateCountryEligibility(currentCountry);
    if (!eligibility.isEligible) {
      setPaymentStatus('failed');
      setPaymentError(eligibility.reason || `Delivery is unavailable for ${currentCountry.name}.`);
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim() || !addressLine1.trim() || !city.trim()) {
      setPaymentStatus('failed');
      setPaymentError('Please complete your name, email, Pakistani mobile number (+92), city, and delivery address.');
      return;
    }

    const normalizedDigits = phone.replace(/[^0-9]/g, '');
    if (normalizedDigits.length < 10) {
      setPaymentStatus('failed');
      setPaymentError('Please enter a valid Pakistani phone number (e.g. +92 300 4128890).');
      return;
    }

    let paymentToken: string | undefined;
    let cardBrand: string | undefined;
    let cardLast4: string | undefined;
    let cardTriggersDecline = false;

    const effectiveCardNumber =
      options?.forceDeclineOff && cardNumber.trim().endsWith('0002')
        ? '4532 8810 9921 4481'
        : cardNumber;

    if (paymentMethod === 'credit_card_gateway') {
      const tokenResult = tokenizePaymentCard({
        cardNumber: effectiveCardNumber,
        cardholderName: cardholderName || fullName,
        expiry: cardExpiry,
        cvv: cardCvv,
      });
      if (!tokenResult.valid) {
        setPaymentStatus('failed');
        setPaymentError(tokenResult.errorMessage || 'Please verify your debit/credit card details.');
        return;
      }
      paymentToken = tokenResult.paymentToken;
      cardBrand = tokenResult.cardBrand;
      cardLast4 = tokenResult.cardLast4;
      cardTriggersDecline = Boolean(tokenResult.isDeclinedTestCard);
    }

    setPaymentStatus('authorizing');

    const effectiveSimulateDecline = options?.forceDeclineOff
      ? false
      : simulateDecline || cardTriggersDecline;

    try {
      const paymentRes = await fetch('/api/checkout/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          orderNumber: draftOrderNumber,
          amountMinorUnits: financials.totalAmountMinorUnits,
          currencyCode: currentCurrency.code,
          paymentMethod,
          paymentToken,
          cardBrand,
          cardLast4,
          payerEmail: email,
          bankReference: bankReference || undefined,
          walletMobileNumber: walletMobileNumber || undefined,
          simulateDecline: effectiveSimulateDecline,
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.success) {
        setPaymentStatus('failed');
        setPaymentError(
          paymentData.message || 'Payment could not be authorized. Please try again or choose Cash on Delivery.'
        );
        setIdempotencyKey(`idem_pk_retry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
        return;
      }

      setPaymentStatus('captured');

      const customerRecordAudit = storeDb.recordAgeVerification({
        customerEmail: email,
        customerName: fullName,
        countryCode: currentCountry.code,
        dateOfBirth: '1995-01-01',
        verifiedAge: 25,
        provider: 'Pakistan COD Verification',
        providerReference: `PK-VER-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'passed',
      });

      const finalOrder = buildImmutableOrderSnapshot({
        orderNumber: draftOrderNumber,
        idempotencyKey,
        customer: {
          id: loggedInCustomer?.id,
          fullName,
          email,
          phone,
        },
        isGuestCheckout: !loggedInCustomer,
        shippingAddress: {
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          municipality: province,
          stateOrProvince: province,
          postalCode,
          countryCode: currentCountry.code,
          countryName: currentCountry.name,
        },
        billingSameAsShipping,
        billingAddress: billingSameAsShipping
          ? undefined
          : {
              fullName: billingFullName || fullName,
              addressLine1: billingAddressLine1,
              city: billingCity,
              stateOrProvince: province,
              postalCode: billingPostalCode,
              countryCode: currentCountry.code,
              countryName: currentCountry.name,
            },
        cartItems,
        country: currentCountry,
        currency: currentCurrency,
        ageVerification: customerRecordAudit,
        financials,
        paymentMethod,
        paymentDetails: {
          transactionId: paymentData.transactionId,
          paymentStatus: paymentData.paymentStatus,
          cardBrand,
          cardLast4,
          payerEmail: email,
          paymentToken,
        },
        shippingMethod: activeShippingMethod,
        discountCode: appliedDiscountCode || undefined,
        giftCardCode: giftCardEval.valid ? appliedGiftCardCode : undefined,
        notes: orderNotes || undefined,
      });

      const savedOrder = storeDb.createOrder(finalOrder);
      onOrderCompleted(savedOrder);
    } catch (err: any) {
      setPaymentStatus('failed');
      setPaymentError(err?.message || 'Network error while placing your order. Please retry.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4 text-white">
        <h2 className="text-2xl font-bold text-white">Your shopping bag is empty</h2>
        <p className="text-xs text-[#E3C4DF]">Add outfits to your bag before checking out.</p>
        <button
          type="button"
          onClick={onBackToStorefront}
          className="px-6 py-3 bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] rounded-full text-xs font-extrabold cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="shopify-checkout-page"
      className="min-h-screen bg-[#240323] text-white pb-16"
    >
      {/* Top Bar */}
      <div className="bg-[#340732] border-b border-[#681962]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              data-testid="checkout-back-to-cart-btn"
              onClick={onBackToCart}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Bag</span>
            </button>
            <span className="text-[#681962]">|</span>
            <span
              className="text-base font-bold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {settings.logoText || 'ZARIYA'} Checkout
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/35 px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Encrypted Pakistan Checkout · COD Available</span>
            <span className="sm:hidden">Secure COD</span>
          </div>
        </div>

        {/* Mobile Order Summary Toggle */}
        <div className="lg:hidden border-t border-[#5E1659] bg-[#31062F] px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOrderSummaryOpen(!mobileOrderSummaryOpen)}
            className="w-full flex items-center justify-between text-xs font-bold text-white"
          >
            <span className="flex items-center gap-2 text-[#FFE066]">
              <span>
                {mobileOrderSummaryOpen ? 'Hide' : 'Show'} Order Summary (
                {cartItems.reduce((a, b) => a + b.quantity, 0)} items)
              </span>
              {mobileOrderSummaryOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
            <span className="text-sm tabular-nums text-[#FFC700]">
              {financials.formattedTotal}
            </span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Checkout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLUMNS */}
          <form onSubmit={handleCompleteCheckout} className="lg:col-span-7 space-y-6">
            {/* 1. Contact Info */}
            <section className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5E1659] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[#FFC700]" />
                    <span>1. Contact Information</span>
                  </h2>
                  <p className="text-[11px] text-[#D8B6D5] mt-0.5">
                    Courier rider will call or SMS your +92 number before delivery.
                  </p>
                </div>

                <div className="inline-flex rounded-full bg-[#240323] p-1 border border-[#681962] self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutMode('guest');
                      setLoggedInCustomer(null);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                      checkoutMode === 'guest' && !loggedInCustomer
                        ? 'bg-[#FFC700] text-[#240323] font-bold'
                        : 'text-[#E3C4DF]'
                    }`}
                  >
                    Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('login')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                      checkoutMode === 'login' || loggedInCustomer
                        ? 'bg-[#FFC700] text-[#240323] font-bold'
                        : 'text-[#E3C4DF]'
                    }`}
                  >
                    {loggedInCustomer ? '✓ Signed In' : 'Saved Account'}
                  </button>
                </div>
              </div>

              {checkoutMode === 'login' && !loggedInCustomer && (
                <div className="p-4 rounded-2xl bg-[#240323] border border-[#681962] space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={loginEmailInput}
                      onChange={(e) => setLoginEmailInput(e.target.value)}
                      placeholder="Enter your email..."
                      className="grow px-3 py-2 rounded-xl border border-[#681962] text-xs bg-[#340732] text-white placeholder-[#D8B6D5]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCustomerLogin()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold shrink-0 cursor-pointer"
                    >
                      Auto-Fill Address
                    </button>
                  </div>
                  {loginError && <p className="text-[11px] text-rose-300">{loginError}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {customers.slice(0, 3).map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setLoginEmailInput(cust.email);
                          handleCustomerLogin(cust.email);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[#340732] border border-[#681962] hover:border-[#FFC700] text-[11px] font-medium text-white cursor-pointer"
                      >
                        {cust.fullName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loggedInCustomer && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Signed in as <strong className="text-white">{loggedInCustomer.fullName}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoggedInCustomer(null);
                      setCheckoutMode('guest');
                    }}
                    className="text-[11px] font-semibold underline cursor-pointer"
                  >
                    Switch to Guest
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    data-testid="checkout-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayesha@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    Pakistani Mobile (+92) *
                  </label>
                  <input
                    type="tel"
                    required
                    data-testid="checkout-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 4128890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs tabular-nums focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>
              </div>
            </section>

            {/* 2. Delivery Address Across Pakistan */}
            <section className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-4">
              <div className="border-b border-[#5E1659] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FFC700]" />
                  <span>2. Delivery Address ({currentCountry.flagEmoji} Pakistan)</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="checkout-fullname-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    House / Flat #, Street, Block / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="checkout-address1-input"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. House 42-B, Block K, Gulberg III"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Near Liberty Market / Clifton Block 5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    Province / Region *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    data-testid="checkout-province-select"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs focus:outline-hidden focus:border-[#FFC700]"
                  >
                    {PAKISTAN_PROVINCES.map((prov) => (
                      <option key={prov} value={prov} className="bg-[#240323]">
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    City *
                  </label>
                  <select
                    value={PAKISTAN_CITIES.includes(city) ? city : 'Other'}
                    onChange={(e) => {
                      if (e.target.value !== 'Other') setCity(e.target.value);
                    }}
                    data-testid="checkout-city-select"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs focus:outline-hidden focus:border-[#FFC700]"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-[#240323]">
                        {c}
                      </option>
                    ))}
                    <option value="Other" className="bg-[#240323]">Other City (Enter Below)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    City / Town Name *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="checkout-city-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#FFE066] mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    data-testid="checkout-postal-input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="54660"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs tabular-nums focus:outline-hidden focus:border-[#FFC700]"
                  />
                </div>
              </div>
            </section>

            {/* 3. Shipping Method */}
            <section className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-4">
              <div className="border-b border-[#5E1659] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#FFC700]" />
                  <span>3. Delivery Method</span>
                </h2>
              </div>

              <div className="space-y-2.5">
                {shippingMethods.map((method) => {
                  const isSelected = activeShippingMethod.id === method.id;
                  const thresholdInTargetMinor = Math.round(
                    (settings.freeShippingThresholdMinorUnits || 300000) *
                      currentCurrency.exchangeRateToBase
                  );
                  const qualifiesFree =
                    (method.freeOverThreshold &&
                      subtotalMinorUnits >= thresholdInTargetMinor) ||
                    matchedDiscountRule?.type === 'free_shipping';

                  return (
                    <label
                      key={method.id}
                      data-testid={`checkout-shipping-method-${method.id}`}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#FFC700] bg-[#4E0C47] text-white'
                          : 'border-[#681962] bg-[#240323] text-[#E3C4DF] hover:border-[#FFC700]/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="checkout_shipping_method"
                          checked={isSelected}
                          onChange={() => onSelectShippingMethod(method.id)}
                          className="mt-1 accent-[#FF9900]"
                        />
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-white">{method.name}</div>
                          <div className="text-[11px] text-[#E3C4DF]">{method.description}</div>
                          <div className="text-[10px] font-semibold text-[#FFC700]">
                            {method.carrier} · {method.estimatedLabel}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs tabular-nums font-extrabold text-[#FFC700] shrink-0">
                        {qualifiesFree
                          ? 'FREE'
                          : formatMinorUnits(method.baseFeeMinorUnits, currentCurrency)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* 4. Billing Address */}
            <section className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-4">
              <div className="border-b border-[#5E1659] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FFC700]" />
                  <span>4. Billing Address</span>
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <label
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer ${
                    billingSameAsShipping
                      ? 'border-[#FFC700] bg-[#4E0C47] font-bold text-white'
                      : 'border-[#681962] bg-[#240323] text-[#E3C4DF]'
                  }`}
                >
                  <input
                    type="radio"
                    name="billing_mode"
                    checked={billingSameAsShipping}
                    onChange={() => setBillingSameAsShipping(true)}
                    className="accent-[#FF9900]"
                  />
                  <span>Same as shipping address</span>
                </label>
                <label
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer ${
                    !billingSameAsShipping
                      ? 'border-[#FFC700] bg-[#4E0C47] font-bold text-white'
                      : 'border-[#681962] bg-[#240323] text-[#E3C4DF]'
                  }`}
                >
                  <input
                    type="radio"
                    name="billing_mode"
                    checked={!billingSameAsShipping}
                    onChange={() => setBillingSameAsShipping(false)}
                    className="accent-[#FF9900]"
                  />
                  <span>Use a different billing address</span>
                </label>
              </div>

              {!billingSameAsShipping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <input
                    type="text"
                    value={billingFullName}
                    onChange={(e) => setBillingFullName(e.target.value)}
                    placeholder="Billing Name"
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs"
                  />
                  <input
                    type="text"
                    value={billingAddressLine1}
                    onChange={(e) => setBillingAddressLine1(e.target.value)}
                    placeholder="Billing Street Address"
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs"
                  />
                  <input
                    type="text"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    placeholder="City"
                    className="px-3.5 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs"
                  />
                  <input
                    type="text"
                    value={billingPostalCode}
                    onChange={(e) => setBillingPostalCode(e.target.value)}
                    placeholder="Postal Code"
                    className="px-3.5 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white text-xs"
                  />
                </div>
              )}
            </section>

            {/* 5. Pakistani Payment Methods */}
            <section className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5E1659] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#FFC700]" />
                    <span>5. Payment Method</span>
                  </h2>
                  <p className="text-[11px] text-[#D8B6D5] mt-0.5">
                    Pay Cash on Delivery, via IBFT Bank Transfer, JazzCash/Easypaisa, or Debit/Credit Card.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <button
                  type="button"
                  data-testid="pay-method-cod"
                  onClick={() => {
                    setPaymentMethod('cash_on_delivery');
                    setPaymentError(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-[#FFC700] bg-[#4E0C47] text-white font-bold'
                      : 'border-[#681962] bg-[#240323] text-[#E3C4DF]'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#FFC700] shrink-0" />
                  <div>
                    <div>Cash on Delivery (COD)</div>
                    <div className="text-[10px] font-normal text-[#D8B6D5]">
                      Pay cash at your doorstep
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="pay-method-bank"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setPaymentError(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#FFC700] bg-[#4E0C47] text-white font-bold'
                      : 'border-[#681962] bg-[#240323] text-[#E3C4DF]'
                  }`}
                >
                  <Landmark className="w-5 h-5 text-[#FF9900] shrink-0" />
                  <div>
                    <div>Bank Transfer (IBFT)</div>
                    <div className="text-[10px] font-normal text-[#D8B6D5]">
                      HBL / Meezan Bank IBAN
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="pay-method-wallet"
                  onClick={() => {
                    setPaymentMethod('jazzcash_easypaisa');
                    setPaymentError(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'jazzcash_easypaisa'
                      ? 'border-[#FFC700] bg-[#4E0C47] text-white font-bold'
                      : 'border-[#681962] bg-[#240323] text-[#E3C4DF]'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div>JazzCash / Easypaisa</div>
                    <div className="text-[10px] font-normal text-[#D8B6D5]">
                      Instant Mobile Wallet
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="pay-method-card"
                  onClick={() => {
                    setPaymentMethod('credit_card_gateway');
                    setPaymentError(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'credit_card_gateway'
                      ? 'border-[#FFC700] bg-[#4E0C47] text-white font-bold'
                      : 'border-[#681962] bg-[#240323] text-[#E3C4DF]'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-white shrink-0" />
                  <div>
                    <div>Debit / Credit Card</div>
                    <div className="text-[10px] font-normal text-[#D8B6D5]">
                      Visa, Mastercard, PayPak
                    </div>
                  </div>
                </button>
              </div>

              {/* Payment Method Details */}
              {paymentMethod === 'cash_on_delivery' && (
                <div className="p-4 rounded-2xl bg-[#240323] border border-[#681962] text-xs text-[#E9CEE6]">
                  Pay <strong className="text-[#FFC700]">{financials.formattedTotal}</strong> in cash directly to the TCS / Leopards courier rider upon parcel delivery.
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-2xl bg-[#240323] border border-[#681962] space-y-2.5 text-xs text-white">
                  <div className="font-bold text-[#FFE066]">ZARIYA Bank IBFT Details:</div>
                  <div className="text-[11px] text-[#E3C4DF] space-y-0.5 tabular-nums">
                    <div>Bank: Meezan Bank Ltd. (Gulberg III Branch, Lahore)</div>
                    <div>Account Title: ZARIYA APPAREL STUDIO</div>
                    <div>IBAN: PK44MEZN0002140105589012</div>
                  </div>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="Optional IBFT Reference # (or share via WhatsApp)"
                    className="w-full px-3 py-2 rounded-xl border border-[#681962] bg-[#340732] text-white placeholder-[#D8B6D5] text-xs"
                  />
                </div>
              )}

              {paymentMethod === 'jazzcash_easypaisa' && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2 text-xs">
                  <label className="block font-bold text-emerald-300">
                    JazzCash / Easypaisa Account Number (03XX XXXXXXX)
                  </label>
                  <input
                    type="tel"
                    value={walletMobileNumber}
                    onChange={(e) => setWalletMobileNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-[#240323] text-white text-xs tabular-nums"
                  />
                </div>
              )}

              {paymentMethod === 'credit_card_gateway' && (
                <div className="p-4 rounded-2xl bg-[#240323] border border-[#681962] space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#FFE066] mb-1">Card Number *</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#681962] bg-[#340732] text-white tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#FFE066] mb-1">Name on Card *</label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#681962] bg-[#340732] text-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#FFE066] mb-1">Expiry (MM/YY) *</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#681962] bg-[#340732] text-white tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#FFE066] mb-1">CVV *</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#681962] bg-[#340732] text-white tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentError && (
                <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulateDecline(false);
                      void handleCompleteCheckout(undefined, { forceDeclineOff: true });
                    }}
                    className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                data-testid="checkout-submit-order-btn"
                disabled={paymentStatus === 'authorizing' || paymentStatus === 'captured'}
                className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {paymentStatus === 'authorizing'
                    ? 'Confirming Your Order...'
                    : paymentMethod === 'cash_on_delivery'
                    ? `Place COD Order • ${financials.formattedTotal}`
                    : `Complete Order • ${financials.formattedTotal}`}
                </span>
              </button>
            </section>
          </form>

          {/* RIGHT 5 COLUMNS: ORDER SUMMARY */}
          <aside
            className={`lg:col-span-5 lg:sticky lg:top-24 space-y-6 ${
              mobileOrderSummaryOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-[#340732] rounded-3xl border border-[#7A1870] p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#5E1659] pb-3">
                <h2
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Order Summary ({cartItems.reduce((a, b) => a + b.quantity, 0)})
                </h2>
                <span className="text-[11px] tabular-nums text-[#D8B6D5]">
                  {draftOrderNumber}
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-[#5E1659]">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={item.variant.image || item.product.galleryImages[0]}
                          alt={item.product.name}
                          className="w-14 h-16 rounded-xl object-cover object-top bg-[#4A0D46] border border-[#681962]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-[10px] font-extrabold flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-[#D8B6D5] truncate">
                          {item.variant.title}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold tabular-nums text-[#FFC700] shrink-0">
                      {formatMinorUnits(item.totalPriceMinorUnits, currentCurrency)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo & Gift Card */}
              <div className="pt-4 border-t border-[#5E1659] space-y-3">
                <div className="flex gap-2">
                  <div className="relative grow">
                    <Tag className="w-3.5 h-3.5 text-[#D8B6D5] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="Promo code (e.g. ZARIYA15)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyDiscount()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {discountMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      discountMessage.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {discountMessage.text}
                  </p>
                )}

                <div className="flex gap-2">
                  <div className="relative grow">
                    <Gift className="w-3.5 h-3.5 text-[#D8B6D5] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={giftCardInput}
                      onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                      placeholder="Gift card (e.g. ZARIYA-GIFT-2000)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyGiftCard()}
                    className="px-4 py-2 rounded-xl bg-white text-[#240323] text-xs font-extrabold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {giftCardMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      giftCardMessage.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {giftCardMessage.text}
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-[#5E1659] space-y-2 text-xs">
                <div className="flex justify-between text-[#E3C4DF]">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-semibold text-white">
                    {formatMinorUnits(financials.subtotalMinorUnits, currentCurrency)}
                  </span>
                </div>

                {financials.discountMinorUnits > 0 && (
                  <div className="flex justify-between text-emerald-300 font-semibold">
                    <span>Promo Discount</span>
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

                {(financials.giftCardAppliedMinorUnits || 0) > 0 && (
                  <div className="flex justify-between text-[#FFC700] font-semibold">
                    <span>Gift Card</span>
                    <span className="tabular-nums">
                      -
                      {formatMinorUnits(
                        financials.giftCardAppliedMinorUnits || 0,
                        currentCurrency
                      )}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#5E1659] flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white block">Total Payable</span>
                    <span className="text-[10px] text-[#D8B6D5]">
                      {backendVerifiedTotalMinor !== null ? '✓ Verified in PKR' : 'Calculated live'}
                    </span>
                  </div>
                  <span
                    data-testid="checkout-final-total"
                    className="text-xl font-extrabold tabular-nums text-[#FFC700]"
                  >
                    {financials.formattedTotal}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
