import {
  Country,
  Currency,
  Product,
  ProductVariant,
  CartItem,
  ImmutableOrderSnapshot,
  AgeVerificationRecord,
  CollectionCondition,
  DiscountRule,
  GiftCard,
  CustomerRecord,
  ShippingMethodOption,
  StoreSettings,
} from '../types/ecommerce';

/**
 * Resolves the unit price in target currency/country minor units (integer x100).
 */
export function resolveProductPrice(
  product: Product,
  targetCountryCode: string,
  targetCurrency: Currency,
  baseCurrencyRate = 1.0,
  variant?: ProductVariant
): number {
  const variantRatio =
    variant &&
    variant.priceMinorUnits > 0 &&
    product.basePriceMinorUnits > 0 &&
    variant.priceMinorUnits !== product.basePriceMinorUnits
      ? variant.priceMinorUnits / product.basePriceMinorUnits
      : 1;

  if (product.countrySpecificPrices && product.countrySpecificPrices[targetCountryCode] !== undefined) {
    return Math.round(product.countrySpecificPrices[targetCountryCode] * variantRatio);
  }

  if (product.currencySpecificPrices && product.currencySpecificPrices[targetCurrency.code] !== undefined) {
    return Math.round(product.currencySpecificPrices[targetCurrency.code] * variantRatio);
  }

  const effectiveBase =
    variant && variant.priceMinorUnits > 0 ? variant.priceMinorUnits : product.basePriceMinorUnits;
  const converted = (effectiveBase * targetCurrency.exchangeRateToBase) / baseCurrencyRate;
  return Math.round(converted);
}

/**
 * Formats minor units (major * 100) into localized currency string.
 * PKR displays cleanly as "Rs. 1,999".
 */
export function formatMinorUnits(minorUnits: number, currency: Currency): string {
  const majorUnits = minorUnits / 100;

  if (currency.code === 'PKR') {
    const rounded = Math.round(majorUnits);
    return `Rs. ${rounded.toLocaleString('en-PK')}`;
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimalPrecision,
      maximumFractionDigits: currency.decimalPrecision,
    }).format(majorUnits);

    return `${formatted} ${currency.code}`;
  } catch {
    const fixed = majorUnits.toFixed(currency.decimalPrecision);
    return currency.symbolPosition === 'before'
      ? `${currency.symbol}${fixed} ${currency.code}`
      : `${fixed} ${currency.symbol} ${currency.code}`;
  }
}

/**
 * Returns available shipping methods for the destination country & store settings
 */
export function getAvailableShippingMethods(
  country: Country,
  currency: Currency,
  settings?: Partial<StoreSettings>
): ShippingMethodOption[] {
  const rate = currency.exchangeRateToBase || 1;
  const standardBase = Math.round((settings?.standardShippingFeeMinorUnits ?? 20000) * rate); // Rs. 200
  const expressBase = Math.round((settings?.expressShippingFeeMinorUnits ?? 35000) * rate); // Rs. 350
  const sameDayBase = Math.round(40000 * rate); // Rs. 400

  if (country.code === 'PK') {
    return [
      {
        id: 'pk_standard',
        name: 'Standard Nationwide Courier (TCS / Leopards)',
        carrier: settings?.defaultShippingCarrier || 'TCS / Leopards Nationwide Express (COD Available)',
        description: 'Reliable doorstep delivery across all provinces of Pakistan. Free on orders above Rs. 3,000.',
        estimatedDays: settings?.shippingEstimatedDays ?? 3,
        estimatedLabel: '2–4 Business Days',
        baseFeeMinorUnits: standardBase,
        freeOverThreshold: true,
      },
      {
        id: 'pk_express',
        name: 'Priority Air Express (Lahore, Karachi, Islamabad)',
        carrier: 'TCS Red Box Express Air',
        description: 'Next-day priority dispatch for major Pakistani metro cities.',
        estimatedDays: 1,
        estimatedLabel: '1–2 Business Days',
        baseFeeMinorUnits: expressBase,
        freeOverThreshold: false,
      },
      {
        id: 'pk_same_day',
        name: 'Lahore Same-Day Boutique Rider',
        carrier: 'ZARIYA Gulberg Atelier Fleet',
        description: 'Same-day stitched & unstitched parcel handover within Lahore city limits.',
        estimatedDays: 1,
        estimatedLabel: 'Same Day (3–5 Hours)',
        baseFeeMinorUnits: sameDayBase,
        freeOverThreshold: false,
      },
    ];
  }

  return [
    {
      id: 'intl_priority',
      name: `${country.name} International Fashion Express`,
      carrier: 'DHL Express Worldwide Tracked',
      description: `Tracked air express shipping from Lahore Atelier to ${country.name}.`,
      estimatedDays: 5,
      estimatedLabel: '4–6 Business Days',
      baseFeeMinorUnits: Math.round(650000 * rate),
      freeOverThreshold: false,
    },
    {
      id: 'intl_expedited',
      name: `${country.name} Priority Couture Courier`,
      carrier: 'FedEx International Priority',
      description: 'Garment-protected international air courier with full tracking.',
      estimatedDays: 3,
      estimatedLabel: '2–4 Business Days',
      baseFeeMinorUnits: Math.round(950000 * rate),
      freeOverThreshold: false,
    },
  ];
}

/**
 * Calculates unit profit (minor units) and profit margin percentage.
 */
export function calculateProfitAndMargin(
  priceMinorUnits: number,
  costMinorUnits: number
): { profitMinorUnits: number; marginPercent: number } {
  const profitMinorUnits = priceMinorUnits - costMinorUnits;
  if (priceMinorUnits <= 0) {
    return { profitMinorUnits, marginPercent: 0 };
  }
  const marginPercent = Math.round(((profitMinorUnits / priceMinorUnits) * 100) * 10) / 10;
  return { profitMinorUnits, marginPercent };
}

/**
 * Evaluates whether a product matches all automated collection rules.
 */
export function evaluateAutomatedCollection(
  product: Product,
  conditions: CollectionCondition[]
): boolean {
  if (!conditions || conditions.length === 0) return false;

  return conditions.every((cond) => {
    const targetVal = cond.value.trim().toLowerCase();
    if (cond.field === 'tag') {
      const tags = (product.tags || product.seoKeywords || []).map((t) => t.toLowerCase());
      if (cond.operator === 'equals') return tags.includes(targetVal);
      if (cond.operator === 'contains') return tags.some((t) => t.includes(targetVal));
      return false;
    }
    if (cond.field === 'vendor') {
      const vendor = (product.vendor || product.brand || '').toLowerCase();
      if (cond.operator === 'equals') return vendor === targetVal;
      if (cond.operator === 'contains') return vendor.includes(targetVal);
      return false;
    }
    if (cond.field === 'product_type') {
      const pType = product.productType.toLowerCase();
      if (cond.operator === 'equals') return pType === targetVal;
      if (cond.operator === 'contains') return pType.includes(targetVal);
      return false;
    }
    if (cond.field === 'price') {
      const priceMajor = product.basePriceMinorUnits / 100;
      const numTarget = parseFloat(cond.value) || 0;
      if (cond.operator === 'greater_than') return priceMajor > numTarget;
      if (cond.operator === 'less_than') return priceMajor < numTarget;
      if (cond.operator === 'equals') return Math.abs(priceMajor - numTarget) < 0.01;
      return false;
    }
    if (cond.field === 'inventory') {
      const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
      const numTarget = parseInt(cond.value, 10) || 0;
      if (cond.operator === 'greater_than') return totalStock > numTarget;
      if (cond.operator === 'less_than') return totalStock < numTarget;
      if (cond.operator === 'equals') return totalStock === numTarget;
      return false;
    }
    return false;
  });
}

/**
 * Calculates the discount savings in minor units for a given DiscountRule.
 */
export function calculateDiscountBenefit(
  subtotalMinorUnits: number,
  shippingMinorUnits: number,
  discount: DiscountRule
): { discountMinorUnits: number; freeShippingApplied: boolean; eligible: boolean; reason?: string } {
  if (discount.status !== 'active') {
    return {
      discountMinorUnits: 0,
      freeShippingApplied: false,
      eligible: false,
      reason: `Discount code "${discount.code}" is currently ${discount.status}.`,
    };
  }
  if (subtotalMinorUnits < discount.minPurchaseMinorUnits) {
    return {
      discountMinorUnits: 0,
      freeShippingApplied: false,
      eligible: false,
      reason: `Minimum order subtotal of Rs. ${Math.round(discount.minPurchaseMinorUnits / 100).toLocaleString('en-PK')} required for "${discount.code}".`,
    };
  }
  if (discount.usageLimit !== undefined && discount.usedCount >= discount.usageLimit) {
    return {
      discountMinorUnits: 0,
      freeShippingApplied: false,
      eligible: false,
      reason: `Discount code "${discount.code}" has reached its maximum redemption limit.`,
    };
  }

  if (discount.type === 'percentage') {
    const pct = Math.min(100, Math.max(0, discount.value));
    return {
      discountMinorUnits: Math.round((subtotalMinorUnits * pct) / 100),
      freeShippingApplied: false,
      eligible: true,
    };
  }
  if (discount.type === 'fixed_amount') {
    return {
      discountMinorUnits: Math.min(subtotalMinorUnits, Math.max(0, Math.round(discount.value))),
      freeShippingApplied: false,
      eligible: true,
    };
  }
  if (discount.type === 'free_shipping') {
    return {
      discountMinorUnits: shippingMinorUnits,
      freeShippingApplied: true,
      eligible: true,
    };
  }
  if (discount.type === 'buy_x_get_y') {
    const pct = Math.min(100, Math.max(0, discount.value || 100));
    const buyQ = Math.max(1, discount.buyQuantity || 2);
    const getQ = Math.max(1, discount.getQuantity || 1);
    const effectiveRatio = getQ / (buyQ + getQ);
    return {
      discountMinorUnits: Math.round(subtotalMinorUnits * effectiveRatio * (pct / 100)),
      freeShippingApplied: false,
      eligible: true,
    };
  }
  return { discountMinorUnits: 0, freeShippingApplied: false, eligible: false };
}

/**
 * Evaluates a gift card code against available gift cards and returns the applied amount.
 */
export function evaluateGiftCardRedemption({
  amountDueMinorUnits,
  giftCards,
  giftCardCode,
}: {
  amountDueMinorUnits: number;
  giftCards: GiftCard[];
  giftCardCode?: string;
}): {
  valid: boolean;
  giftCard?: GiftCard;
  appliedMinorUnits: number;
  remainingBalanceMinorUnits: number;
  errorMessage?: string;
} {
  if (!giftCardCode || !giftCardCode.trim()) {
    return { valid: false, appliedMinorUnits: 0, remainingBalanceMinorUnits: 0 };
  }
  const normalized = giftCardCode.trim().toUpperCase();
  const card = giftCards.find((g) => g.code.trim().toUpperCase() === normalized);
  if (!card) {
    return {
      valid: false,
      appliedMinorUnits: 0,
      remainingBalanceMinorUnits: 0,
      errorMessage: `Gift card "${normalized}" was not found.`,
    };
  }
  if (card.status !== 'active') {
    return {
      valid: false,
      giftCard: card,
      appliedMinorUnits: 0,
      remainingBalanceMinorUnits: card.balanceMinorUnits,
      errorMessage: `Gift card "${card.code}" is ${card.status}.`,
    };
  }
  if (card.balanceMinorUnits <= 0) {
    return {
      valid: false,
      giftCard: card,
      appliedMinorUnits: 0,
      remainingBalanceMinorUnits: 0,
      errorMessage: `Gift card "${card.code}" has a Rs. 0 balance.`,
    };
  }

  const appliedMinorUnits = Math.min(Math.max(0, amountDueMinorUnits), card.balanceMinorUnits);
  const remainingBalanceMinorUnits = Math.max(0, card.balanceMinorUnits - appliedMinorUnits);

  return {
    valid: true,
    giftCard: card,
    appliedMinorUnits,
    remainingBalanceMinorUnits,
  };
}

/**
 * Tokenizes payment card details on the client so raw card numbers and CVVs are never stored.
 */
export function tokenizePaymentCard({
  cardNumber,
  cardholderName,
  expiry,
  cvv,
}: {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
}): {
  valid: boolean;
  paymentToken?: string;
  cardBrand?: string;
  cardLast4?: string;
  isDeclinedTestCard?: boolean;
  errorMessage?: string;
} {
  const digits = cardNumber.replace(/[^0-9]/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return { valid: false, errorMessage: 'Please enter a valid 16-digit card number.' };
  }
  if (!cardholderName || cardholderName.trim().length < 2) {
    return { valid: false, errorMessage: 'Please enter the cardholder name as shown on the card.' };
  }
  if (!/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/.test(expiry.trim())) {
    return { valid: false, errorMessage: 'Please enter a valid expiration date (MM/YY).' };
  }
  const cvvDigits = cvv.replace(/[^0-9]/g, '');
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return { valid: false, errorMessage: 'Please enter a valid 3 or 4 digit security code (CVV).' };
  }

  let cardBrand = 'Visa';
  if (digits.startsWith('5') || digits.startsWith('2')) {
    cardBrand = 'Mastercard';
  } else if (digits.startsWith('34') || digits.startsWith('37')) {
    cardBrand = 'American Express';
  } else if (digits.startsWith('62') || digits.startsWith('9')) {
    cardBrand = 'PayPak / UnionPay';
  }

  const cardLast4 = digits.slice(-4);
  const isDeclinedTestCard = cardLast4 === '0002' || digits.endsWith('0002');
  const paymentToken = `tok_pk_${cardBrand.toLowerCase().replace(/[^a-z0-9]/g, '')}_${cardLast4}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  return {
    valid: true,
    paymentToken,
    cardBrand,
    cardLast4,
    isDeclinedTestCard,
  };
}

/**
 * Detects potential duplicate customer profiles based on normalized name, phone, or email.
 */
export function detectDuplicateCustomers(
  customers: CustomerRecord[]
): { primary: CustomerRecord; duplicate: CustomerRecord; matchReason: string }[] {
  const duplicates: { primary: CustomerRecord; duplicate: CustomerRecord; matchReason: string }[] = [];

  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const a = customers[i];
      const b = customers[j];

      const normNameA = a.fullName.trim().toLowerCase().replace(/\s+/g, ' ');
      const normNameB = b.fullName.trim().toLowerCase().replace(/\s+/g, ' ');
      const normPhoneA = a.phone.replace(/[^0-9]/g, '');
      const normPhoneB = b.phone.replace(/[^0-9]/g, '');
      const normEmailA = a.email.trim().toLowerCase();
      const normEmailB = b.email.trim().toLowerCase();

      if (normEmailA && normEmailA === normEmailB) {
        duplicates.push({ primary: a, duplicate: b, matchReason: `Identical email (${a.email})` });
      } else if (normPhoneA.length >= 7 && normPhoneA === normPhoneB) {
        duplicates.push({ primary: a, duplicate: b, matchReason: `Identical phone (${a.phone})` });
      } else if (normNameA.length >= 4 && normNameA === normNameB) {
        duplicates.push({ primary: a, duplicate: b, matchReason: `Matching full name (${a.fullName})` });
      }
    }
  }

  return duplicates;
}

/**
 * Validates whether shipping is available to a destination country.
 */
export function validateCountryEligibility(country: Country): {
  isEligible: boolean;
  status: Country['status'];
  reason?: string;
} {
  if (country.status === 'blocked') {
    return {
      isEligible: false,
      status: country.status,
      reason: `Shipping to ${country.name} is currently unavailable due to courier routing restrictions.`,
    };
  }

  if (country.status === 'pending_legal_review') {
    return {
      isEligible: false,
      status: country.status,
      reason: `Direct shipping to ${country.name} is launching soon. Contact WhatsApp support for custom international dispatch.`,
    };
  }

  if (country.status === 'restricted' && !country.shippingAvailable) {
    return {
      isEligible: false,
      status: country.status,
      reason: `Courier dispatch to ${country.name} is temporarily paused.`,
    };
  }

  return {
    isEligible: true,
    status: country.status,
  };
}

/**
 * Validates customer age when jurisdiction requires it (clothing stores do not gate age).
 */
export function validateCustomerAge(
  birthDateString: string,
  country: Country
): {
  isCompliant: boolean;
  calculatedAge: number;
  minimumRequired: number;
  errorMessage?: string;
} {
  if (!country.ageVerificationRequired || country.minimumAge <= 0) {
    return {
      isCompliant: true,
      calculatedAge: 25,
      minimumRequired: 0,
    };
  }

  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) {
    return {
      isCompliant: false,
      calculatedAge: 0,
      minimumRequired: country.minimumAge,
      errorMessage: 'Invalid date of birth provided.',
    };
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < country.minimumAge) {
    return {
      isCompliant: false,
      calculatedAge: age,
      minimumRequired: country.minimumAge,
      errorMessage: `Minimum age for ordering in ${country.name} is ${country.minimumAge}.`,
    };
  }

  return {
    isCompliant: true,
    calculatedAge: age,
    minimumRequired: country.minimumAge,
  };
}

/**
 * Calculates cart totals including discounts, shipping method, tax, duties, and gift cards in minor units.
 */
export function calculateOrderFinancials({
  subtotalMinorUnits,
  country,
  currency,
  freeShippingThresholdMinorUnits,
  shippingMethodOption,
  discountRule,
  explicitDiscountMinorUnits,
  giftCardAppliedMinorUnits: requestedGiftCardMinorUnits,
}: {
  subtotalMinorUnits: number;
  country: Country;
  currency: Currency;
  freeShippingThresholdMinorUnits: number;
  shippingMethodOption?: ShippingMethodOption;
  discountRule?: DiscountRule | null;
  explicitDiscountMinorUnits?: number;
  giftCardAppliedMinorUnits?: number;
}) {
  const defaultBaseShippingMinorUnits = 20000; // Rs. 200 standard delivery
  const rawMethodFee = shippingMethodOption
    ? shippingMethodOption.baseFeeMinorUnits
    : Math.round(defaultBaseShippingMinorUnits * currency.exchangeRateToBase);

  const qualifiesForThresholdFreeShipping =
    (shippingMethodOption ? shippingMethodOption.freeOverThreshold : true) &&
    subtotalMinorUnits >= freeShippingThresholdMinorUnits * currency.exchangeRateToBase;

  let shippingFeeMinorUnits = qualifiesForThresholdFreeShipping ? 0 : rawMethodFee;

  let discountMinorUnits = explicitDiscountMinorUnits ?? 0;
  if (discountRule) {
    const benefit = calculateDiscountBenefit(subtotalMinorUnits, shippingFeeMinorUnits, discountRule);
    if (benefit.eligible) {
      if (benefit.freeShippingApplied) {
        shippingFeeMinorUnits = 0;
        discountMinorUnits = 0;
      } else {
        discountMinorUnits = benefit.discountMinorUnits;
      }
    }
  }

  discountMinorUnits = Math.min(subtotalMinorUnits, Math.max(0, discountMinorUnits));
  const taxableSubtotalMinorUnits = Math.max(0, subtotalMinorUnits - discountMinorUnits);

  const taxMinorUnits = Math.round(taxableSubtotalMinorUnits * country.standardTaxRate);
  const dutyMinorUnits = Math.round(taxableSubtotalMinorUnits * country.customsDutyRate);

  const grossTotalBeforeGiftCard =
    taxableSubtotalMinorUnits + shippingFeeMinorUnits + taxMinorUnits + dutyMinorUnits;

  const giftCardAppliedMinorUnits = Math.min(
    grossTotalBeforeGiftCard,
    Math.max(0, requestedGiftCardMinorUnits ?? 0)
  );

  const totalAmountMinorUnits = Math.max(0, grossTotalBeforeGiftCard - giftCardAppliedMinorUnits);

  return {
    subtotalMinorUnits,
    discountMinorUnits,
    giftCardAppliedMinorUnits,
    shippingFeeMinorUnits,
    taxMinorUnits,
    dutyMinorUnits,
    totalAmountMinorUnits,
    formattedTotal: formatMinorUnits(totalAmountMinorUnits, currency),
  };
}

/**
 * Creates an immutable order snapshot for persistent records.
 */
export function buildImmutableOrderSnapshot({
  orderNumber,
  idempotencyKey,
  customer,
  isGuestCheckout = true,
  shippingAddress,
  billingSameAsShipping = true,
  billingAddress,
  cartItems,
  country,
  currency,
  ageVerification,
  financials,
  paymentMethod,
  paymentDetails,
  shippingMethod,
  discountCode,
  giftCardCode,
  notes,
}: {
  orderNumber: string;
  idempotencyKey?: string;
  customer: { id?: string; fullName: string; email: string; phone: string };
  isGuestCheckout?: boolean;
  shippingAddress: ImmutableOrderSnapshot['shippingAddress'];
  billingSameAsShipping?: boolean;
  billingAddress?: ImmutableOrderSnapshot['billingAddress'];
  cartItems: CartItem[];
  country: Country;
  currency: Currency;
  ageVerification: AgeVerificationRecord;
  financials: ReturnType<typeof calculateOrderFinancials>;
  paymentMethod: ImmutableOrderSnapshot['payment']['method'];
  paymentDetails?: {
    transactionId?: string;
    paymentStatus?: ImmutableOrderSnapshot['payment']['paymentStatus'];
    cardBrand?: string;
    cardLast4?: string;
    payerEmail?: string;
    paymentToken?: string;
  };
  shippingMethod?: ShippingMethodOption;
  discountCode?: string;
  giftCardCode?: string;
  notes?: string;
}): ImmutableOrderSnapshot {
  const nowIso = new Date().toISOString();
  const txId =
    paymentDetails?.transactionId ||
    'TX_' + Math.random().toString(36).substring(2, 12).toUpperCase();
  const payStatus =
    paymentDetails?.paymentStatus ||
    (paymentMethod === 'cash_on_delivery' ||
    paymentMethod === 'bank_transfer' ||
    paymentMethod === 'wire_transfer_swift'
      ? 'authorized'
      : 'captured');

  return {
    orderId: 'ord_' + Math.random().toString(36).substring(2, 11),
    orderNumber,
    orderDate: nowIso,
    idempotencyKey,
    status: payStatus === 'captured' ? 'paid' : 'processing',
    isGuestCheckout,
    notes,
    discountCode,
    giftCardCode,
    confirmationEmailSentAt: nowIso,
    customer,
    shippingAddress,
    billingSameAsShipping,
    billingAddress: billingSameAsShipping ? shippingAddress : billingAddress || shippingAddress,
    items: cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantTitle: item.variant.title,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPriceMinorUnits: item.unitPriceMinorUnits,
      totalPriceMinorUnits: item.totalPriceMinorUnits,
      productSnapshot: {
        brand: item.product.brand,
        image: item.variant.image || item.product.galleryImages[0] || '',
        specs: item.product.specs || {},
      },
    })),
    financials: {
      currencyCode: currency.code,
      exchangeRateUsed: currency.exchangeRateToBase,
      ...financials,
    },
    compliance: {
      countryMinimumAgeRequired: country.minimumAge,
      customerVerifiedAge: ageVerification.verifiedAge,
      ageVerificationRecordId: ageVerification.id,
      verificationProviderRef: ageVerification.providerReference,
      jurisdictionLegalStatus: country.status,
      tpdFdaComplianceStatement: `Verified fashion order for ${country.name} (${country.code}). Quality inspected at ZARIYA Lahore Atelier.`,
    },
    payment: {
      method: paymentMethod,
      paymentStatus: payStatus,
      transactionId: txId,
      cardBrand: paymentDetails?.cardBrand,
      cardLast4: paymentDetails?.cardLast4,
      payerEmail: paymentDetails?.payerEmail,
      paymentToken: paymentDetails?.paymentToken,
    },
    shipping: {
      methodId: shippingMethod?.id || 'pk_standard',
      carrier:
        shippingMethod?.carrier ||
        (country.code === 'PK'
          ? 'TCS / Leopards Nationwide Express (COD Available)'
          : 'DHL Express Worldwide Tracked'),
      service: shippingMethod?.name || 'Standard Nationwide Courier',
      trackingNumber: 'ZAR' + Math.floor(100000000 + Math.random() * 900000000) + 'PK',
      estimatedDeliveryDays: shippingMethod?.estimatedDays ?? (country.code === 'PK' ? 3 : 5),
    },
    timeline: [
      {
        status: 'Order Received',
        timestamp: nowIso,
        note: `Order placed for ${shippingAddress.city}, ${shippingAddress.stateOrProvince}.`,
      },
      {
        status:
          payStatus === 'captured'
            ? 'Payment Confirmed'
            : paymentMethod === 'cash_on_delivery'
            ? 'Cash on Delivery Confirmed'
            : 'Awaiting Bank Transfer Confirmation',
        timestamp: nowIso,
        note: `Order total locked at ${financials.formattedTotal} (${txId}).`,
      },
      {
        status: 'Confirmation Sent',
        timestamp: nowIso,
        note: `SMS & email confirmation dispatched to ${customer.phone} / ${customer.email}.`,
      },
      {
        status: 'Sent to ZARIYA Lahore Atelier',
        timestamp: nowIso,
        note: 'Queued for quality check, steam press, and boutique packaging at Gulberg III Hub.',
      },
    ],
  };
}
