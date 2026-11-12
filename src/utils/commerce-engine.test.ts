import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveProductPrice,
  formatMinorUnits,
  validateCountryEligibility,
  validateCustomerAge,
  calculateOrderFinancials,
  buildImmutableOrderSnapshot,
  calculateProfitAndMargin,
  evaluateAutomatedCollection,
  calculateDiscountBenefit,
  detectDuplicateCustomers,
  evaluateGiftCardRedemption,
  tokenizePaymentCard,
  getAvailableShippingMethods,
} from './commerce-engine';
import {
  Country,
  Currency,
  Product,
  CartItem,
  AgeVerificationRecord,
  DiscountRule,
  CustomerRecord,
} from '../types/ecommerce';
import {
  hashPasswordScrypt,
  verifyPasswordScrypt,
  createSignedSessionToken,
  verifySignedSessionToken,
} from '../server/admin-auth';
import {
  parseCsvRaw,
  parseAndValidateShopifyCsv,
  generateShopifyCsvTemplate,
  exportProductsToShopifyCsv,
} from './shopify-csv';
import { storeDb } from '../services/store-db';
import {
  extractProductSizes,
  extractProductColors,
} from '../components/storefront/ShopAllProductsPage';

const mockPkrCurrency: Currency = {
  code: 'PKR',
  symbol: 'Rs. ',
  name: 'Pakistani Rupee',
  exchangeRateToBase: 1.0,
  decimalPrecision: 0,
  symbolPosition: 'before',
  isBaseCurrency: true,
  isActive: true,
  lastUpdated: '2026-11-12T06:00:00Z',
};

const mockUsdCurrency: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  exchangeRateToBase: 0.0036,
  decimalPrecision: 2,
  symbolPosition: 'before',
  isActive: true,
  lastUpdated: '2026-11-12T06:00:00Z',
};

const mockGbpCurrency: Currency = {
  code: 'GBP',
  symbol: '£',
  name: 'British Pound',
  exchangeRateToBase: 0.79,
  decimalPrecision: 2,
  symbolPosition: 'before',
  isActive: true,
  lastUpdated: '2026-11-12T06:00:00Z',
};

const mockCountryUK: Country = {
  name: 'United Kingdom',
  code: 'GB',
  flagEmoji: '🇬🇧',
  defaultCurrencyCode: 'GBP',
  supportedCurrencyCodes: ['GBP', 'USD'],
  status: 'approved',
  minimumAge: 18,
  ageVerificationRequired: true,
  verificationMethod: 'provider_id_lookup',
  salesEligible: true,
  importRestrictions: 'International DHL courier fashion delivery',
  shippingAvailable: true,
  standardTaxRate: 0.2,
  customsDutyRate: 0.0,
  complianceNotes: 'Tracked UK courier dispatch.',
};

const mockCountryUS: Country = {
  name: 'United States',
  code: 'US',
  flagEmoji: '🇺🇸',
  defaultCurrencyCode: 'USD',
  supportedCurrencyCodes: ['USD'],
  status: 'approved',
  minimumAge: 21,
  ageVerificationRequired: true,
  verificationMethod: 'kyc_document_eval',
  salesEligible: true,
  importRestrictions: 'International apparel courier restrictions',
  shippingAvailable: true,
  standardTaxRate: 0.08,
  customsDutyRate: 0.0,
  complianceNotes: 'Tracked US express delivery.',
};

const mockCountryBlocked: Country = {
  name: 'Restricted Zone',
  code: 'XX',
  flagEmoji: '🚫',
  defaultCurrencyCode: 'USD',
  supportedCurrencyCodes: ['USD'],
  status: 'blocked',
  minimumAge: 0,
  ageVerificationRequired: false,
  verificationMethod: 'disabled',
  salesEligible: false,
  importRestrictions: 'Courier route unavailable',
  shippingAvailable: false,
  standardTaxRate: 0.0,
  customsDutyRate: 0.0,
  complianceNotes: 'No courier routing.',
};

const mockProduct: Product = {
  id: 'prod_fashion_1',
  name: '3 Piece Embroidered Lawn Suit — Gul-e-Rana',
  slug: '3-piece-embroidered-lawn-suit-gul-e-rana',
  sku: 'ZAR-LWN3-ROSE',
  brand: 'Zariya Atelier',
  vendor: 'Zariya Atelier Lahore',
  categoryId: '3-piece-suits',
  productType: 'stitched_3pc',
  tags: ['lawn', 'embroidered', 'sale'],
  shortDescription: 'Soft blush pink embroidered 3-piece summer lawn suit.',
  fullDescription: 'Crafted in Gulberg Lahore with 80/80 combed cotton lawn.',
  galleryImages: ['/src/assets/images/pk_lawn_3pc_rose_1794509751128.jpg'],
  specs: { Fabric: 'Pure 80/80 Combed Lawn' },
  attributes: [
    { id: 'size', name: 'Size', values: ['S', 'M', 'L'] },
    { id: 'color', name: 'Color', values: ['Blush Rose'] },
  ],
  variants: [
    {
      id: 'v1',
      sku: 'ZAR-LWN3-M-ROSE',
      title: 'M / Blush Rose',
      attributes: { Size: 'M', Color: 'Blush Rose' },
      priceMinorUnits: 329000, // Rs. 3,290
      stockQuantity: 25,
      weightGrams: 550,
    },
  ],
  status: 'published',
  basePriceMinorUnits: 20000,
  countrySpecificPrices: {
    GB: 15500,
  },
  currencySpecificPrices: {
    GBP: 15900,
  },
  isAgeRestricted: false,
  complianceWarning: 'Cash on Delivery Available',
  featured: true,
  seoTitle: 'Gul-e-Rana 3 Piece Lawn Suit',
  seoDescription: 'Embroidered Pakistani lawn suit',
  seoKeywords: ['lawn', '3 piece'],
};

test('Pricing Priority 1: Uses country-specific manual price if present', () => {
  const priceInUK = resolveProductPrice(mockProduct, 'GB', mockGbpCurrency);
  assert.equal(priceInUK, 15500);
});

test('Pricing Priority 2: Uses currency-specific price if country not overridden', () => {
  const productWithoutCountryPrice: Product = {
    ...mockProduct,
    countrySpecificPrices: {},
  };
  const priceInGbp = resolveProductPrice(productWithoutCountryPrice, 'FR', mockGbpCurrency);
  assert.equal(priceInGbp, 15900);
});

test('Pricing Priority 3: Converts from base price via exchange rate', () => {
  const cleanProduct: Product = {
    ...mockProduct,
    countrySpecificPrices: {},
    currencySpecificPrices: {},
  };
  const priceInGbp = resolveProductPrice(cleanProduct, 'DE', mockGbpCurrency);
  assert.equal(priceInGbp, 15800);
});

test('formatMinorUnits accurately formats PKR and USD currencies', () => {
  const formattedPkr = formatMinorUnits(329000, mockPkrCurrency);
  assert.equal(formattedPkr, 'Rs. 3,290');

  const formattedUsd = formatMinorUnits(12950, mockUsdCurrency);
  assert.match(formattedUsd, /129\.50/);
  assert.match(formattedUsd, /USD/);
});

test('validateCountryEligibility blocks sales for unavailable shipping zones', () => {
  const checkAllowed = validateCountryEligibility(mockCountryUK);
  assert.equal(checkAllowed.isEligible, true);

  const checkBlocked = validateCountryEligibility(mockCountryBlocked);
  assert.equal(checkBlocked.isEligible, false);
  assert.match(checkBlocked.reason || '', /unavailable/i);
});

test('validateCustomerAge bypasses age gating for Pakistani clothing and checks age only when jurisdiction requires it', () => {
  const date19YearsAgo = new Date();
  date19YearsAgo.setFullYear(date19YearsAgo.getFullYear() - 19);
  const birthStr = date19YearsAgo.toISOString().split('T')[0];

  const ukAgeCheck = validateCustomerAge(birthStr, mockCountryUK);
  assert.equal(ukAgeCheck.isCompliant, true);
  assert.equal(ukAgeCheck.calculatedAge, 19);

  const usAgeCheck = validateCustomerAge(birthStr, mockCountryUS);
  assert.equal(usAgeCheck.isCompliant, false);
  assert.match(usAgeCheck.errorMessage || '', /Minimum age.*21/);
});

test('calculateOrderFinancials computes subtotal, tax, and free shipping threshold accurately', () => {
  const financials = calculateOrderFinancials({
    subtotalMinorUnits: 20000,
    country: mockCountryUK,
    currency: mockGbpCurrency,
    freeShippingThresholdMinorUnits: 15000,
  });

  assert.equal(financials.shippingFeeMinorUnits, 0);
  assert.equal(financials.taxMinorUnits, 4000);
  assert.equal(financials.totalAmountMinorUnits, 24000);
});

test('buildImmutableOrderSnapshot preserves complete order, shipping, and financial snapshot', () => {
  const mockRecord: AgeVerificationRecord = {
    id: 'av_pk_123',
    customerEmail: 'ayesha@zariya.pk',
    customerName: 'Ayesha Khan',
    countryCode: 'GB',
    dateOfBirth: '1995-04-12',
    verifiedAge: 31,
    provider: 'Pakistan COD Verification',
    providerReference: 'PK-VERIFIED-994821',
    status: 'passed',
    timestamp: '2026-11-12T08:00:00Z',
    complianceAuditHash: 'sha256_mock_hash_892182',
  };

  const financials = calculateOrderFinancials({
    subtotalMinorUnits: 15500,
    country: mockCountryUK,
    currency: mockGbpCurrency,
    freeShippingThresholdMinorUnits: 15000,
  });

  const cartItem: CartItem = {
    id: 'ci_1',
    productId: mockProduct.id,
    variantId: 'v1',
    product: mockProduct,
    variant: {
      id: 'v1',
      sku: 'ZAR-LWN3-M-ROSE',
      title: 'M / Blush Rose',
      attributes: { Size: 'M', Color: 'Blush Rose' },
      priceMinorUnits: 15500,
      stockQuantity: 12,
      weightGrams: 550,
    },
    quantity: 1,
    unitPriceMinorUnits: 15500,
    totalPriceMinorUnits: 15500,
  };

  const snapshot = buildImmutableOrderSnapshot({
    orderNumber: 'ZAR-2026-GB-1001',
    customer: { fullName: 'Ayesha Khan', email: 'ayesha@zariya.pk', phone: '+44 7700 900077' },
    shippingAddress: {
      addressLine1: '42 Regent Street',
      city: 'London',
      stateOrProvince: 'Greater London',
      postalCode: 'W1B 5AH',
      countryCode: 'GB',
      countryName: 'United Kingdom',
    },
    cartItems: [cartItem],
    country: mockCountryUK,
    currency: mockGbpCurrency,
    ageVerification: mockRecord,
    financials,
    paymentMethod: 'credit_card_gateway',
  });

  assert.equal(snapshot.orderNumber, 'ZAR-2026-GB-1001');
  assert.equal(snapshot.compliance.verificationProviderRef, 'PK-VERIFIED-994821');
  assert.equal(snapshot.financials.currencyCode, 'GBP');
  assert.equal(snapshot.financials.subtotalMinorUnits, 15500);
  assert.equal(snapshot.items[0].productName, '3 Piece Embroidered Lawn Suit — Gul-e-Rana');
});

test('Pakistan (PK) Financials: PKR base currency with Rs. 3,000 free delivery threshold and Rs. 200 flat COD fee', () => {
  const pkCountry = storeDb.getCountryByCode('PK')!;
  const pkrCurrency = storeDb.getCurrencyByCode('PKR');

  const underThreshold = calculateOrderFinancials({
    subtotalMinorUnits: 189000, // Rs. 1,890
    country: pkCountry,
    currency: pkrCurrency,
    freeShippingThresholdMinorUnits: 300000, // Rs. 3,000
  });
  assert.equal(underThreshold.shippingFeeMinorUnits, 20000); // Rs. 200 delivery
  assert.equal(underThreshold.taxMinorUnits, 0);
  assert.equal(underThreshold.totalAmountMinorUnits, 209000);

  const overThreshold = calculateOrderFinancials({
    subtotalMinorUnits: 329000, // Rs. 3,290
    country: pkCountry,
    currency: pkrCurrency,
    freeShippingThresholdMinorUnits: 300000,
  });
  assert.equal(overThreshold.shippingFeeMinorUnits, 0);
  assert.equal(overThreshold.taxMinorUnits, 0);
  assert.equal(overThreshold.totalAmountMinorUnits, 329000);
});

test('Admin: calculateProfitAndMargin computes profit and margin percentage accurately', () => {
  const res = calculateProfitAndMargin(329000, 175000);
  assert.equal(res.profitMinorUnits, 154000);
  assert.equal(res.marginPercent, 46.8);
});

test('Admin: evaluateAutomatedCollection matches products by tag, price, and inventory rules', () => {
  const matches = evaluateAutomatedCollection(mockProduct, [
    { id: 'c1', field: 'tag', operator: 'contains', value: 'lawn' },
    { id: 'c2', field: 'inventory', operator: 'greater_than', value: '10' },
  ]);
  assert.equal(matches, true);

  const fails = evaluateAutomatedCollection(mockProduct, [
    { id: 'c3', field: 'price', operator: 'greater_than', value: '9999' },
  ]);
  assert.equal(fails, false);
});

test('Admin: calculateDiscountBenefit handles percentage and free shipping codes in PKR', () => {
  const pctDiscount: DiscountRule = {
    id: 'd1',
    code: 'SALE30',
    title: 'Flat 30% Off Selected Festive Suits',
    type: 'percentage',
    method: 'code',
    value: 30,
    minPurchaseMinorUnits: 200000, // Rs. 2,000
    customerEligibility: 'all',
    usedCount: 5,
    startsAt: '2026-11-01',
    status: 'active',
  };
  const benefitPct = calculateDiscountBenefit(500000, 20000, pctDiscount);
  assert.equal(benefitPct.eligible, true);
  assert.equal(benefitPct.discountMinorUnits, 150000);

  const freeShipDiscount: DiscountRule = {
    ...pctDiscount,
    id: 'd2',
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
  };
  const benefitShip = calculateDiscountBenefit(200000, 20000, freeShipDiscount);
  assert.equal(benefitShip.freeShippingApplied, true);
  assert.equal(benefitShip.discountMinorUnits, 20000);
});

test('Admin: detectDuplicateCustomers finds matching Pakistani customer profiles by phone or name', () => {
  const customers: CustomerRecord[] = [
    {
      id: 'cust_1',
      fullName: 'Ayesha Khan',
      email: 'ayesha@zariya.pk',
      phone: '+92 300 8429100',
      addresses: [],
      tags: ['VIP'],
      notes: '',
      marketingSubscribed: true,
      smsMarketingSubscribed: true,
      segment: 'VIP',
      createdAt: '2026-10-01',
    },
    {
      id: 'cust_2',
      fullName: 'Ayesha  Khan ',
      email: 'ayesha.alt@zariya.pk',
      phone: '+92 321 9988776',
      addresses: [],
      tags: [],
      notes: '',
      marketingSubscribed: false,
      smsMarketingSubscribed: false,
      segment: 'Returning',
      createdAt: '2026-11-05',
    },
  ];

  const dupes = detectDuplicateCustomers(customers);
  assert.equal(dupes.length, 1);
  assert.match(dupes[0].matchReason, /Matching full name/i);
});

test('Admin Auth: scrypt password hashing and constant-time verification reject wrong passwords', () => {
  const { salt, hash } = hashPasswordScrypt('SuperSecret#2026');
  assert.equal(verifyPasswordScrypt('SuperSecret#2026', salt, hash), true);
  assert.equal(verifyPasswordScrypt('WrongPassword#2026', salt, hash), false);
});

test('Admin Auth: HMAC-SHA256 signed session tokens detect tampering', () => {
  const sessionId = '9f8e7d6c5b4a3210';
  const token = createSignedSessionToken(sessionId);
  assert.equal(verifySignedSessionToken(token), sessionId);
  assert.equal(verifySignedSessionToken(token + 'tampered'), null);
  assert.equal(verifySignedSessionToken('invalid.token'), null);
});

test('Product CSV: RFC 4180 parser handles quoted commas, escaped quotes, and multi-row rows', () => {
  const csv =
    'Handle,Title,"Body (HTML)",Variant Price\nzariya-lawn,"Gul-e-Rana ""Blush"" Edition, 3Pc","<p>80/80 Lawn, Lahore Atelier</p>",3290.00';
  const rows = parseCsvRaw(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][0], 'zariya-lawn');
  assert.equal(rows[1][1], 'Gul-e-Rana "Blush" Edition, 3Pc');
  assert.equal(rows[1][2], '<p>80/80 Lawn, Lahore Atelier</p>');
  assert.equal(rows[1][3], '3290.00');
});

test('Product CSV: Template parses into fashion products and detects updates vs creates', () => {
  const templateCsv = generateShopifyCsvTemplate();
  const result = parseAndValidateShopifyCsv(templateCsv, [mockProduct]);

  assert.equal(result.products.length, 2);
  assert.equal(result.errorProductsCount, 0);
  assert.equal(result.newProductsCount, 2);
  assert.equal(result.totalVariantsCount, 2);
  assert.equal(result.products[0].product.variants.length, 1);
  assert.equal(result.products[0].product.galleryImages.length, 1);

  // Test matching existing product by Handle for update
  const updateCsv = `Handle,Title,Variant SKU,Variant Price,Variant Inventory Qty\n3-piece-embroidered-lawn-suit-gul-e-rana,Gul-e-Rana Updated,ZAR-LWN3-M-ROSE,2990.00,40`;
  const updateRes = parseAndValidateShopifyCsv(updateCsv, [mockProduct]);
  assert.equal(updateRes.products.length, 1);
  assert.equal(updateRes.products[0].action, 'update');
  assert.equal(updateRes.products[0].existingProductId, 'prod_fashion_1');
  assert.equal(updateRes.products[0].product.basePriceMinorUnits, 299000);
  assert.equal(updateRes.products[0].product.variants[0].stockQuantity, 40);
});

test('Product CSV: Validator highlights missing title and invalid price or negative stock errors', () => {
  const invalidCsv = [
    'Handle,Title,Variant SKU,Variant Price,Variant Inventory Qty',
    'broken-suit,,BROKEN-SKU,-50.00,-5',
  ].join('\n');

  const res = parseAndValidateShopifyCsv(invalidCsv, []);
  assert.equal(res.products.length, 1);
  assert.equal(res.products[0].isValid, false);
  assert.equal(res.errorProductsCount, 1);
  assert.equal(res.products[0].errors.length, 3);
});

test('Product CSV: Exporter generates re-importable multi-row and single-row CSV', () => {
  const exportedMulti = exportProductsToShopifyCsv([mockProduct], [], 'shopify_multirow');
  const reimported = parseAndValidateShopifyCsv(exportedMulti, []);
  assert.equal(reimported.products.length, 1);
  assert.equal(reimported.products[0].handle, '3-piece-embroidered-lawn-suit-gul-e-rana');
  assert.equal(reimported.products[0].product.variants[0].sku, 'ZAR-LWN3-M-ROSE');

  const exportedSingle = exportProductsToShopifyCsv([mockProduct], [], 'summary_singlerow');
  const singleRows = parseCsvRaw(exportedSingle);
  assert.equal(singleRows.length, 2);
  assert.equal(singleRows[1][0], '3-piece-embroidered-lawn-suit-gul-e-rana');
});

test('Bulk Inventory Update: storeDb.bulkUpdateVariantInventory updates Lahore hub stock levels and records StockHistoryEntry', () => {
  const productsBefore = storeDb.getProducts();
  assert.ok(productsBefore.length >= 10, 'Expected at least 10 Pakistani fashion products in storeDb');

  const firstProd = productsBefore[0];
  const firstVar = firstProd.variants[0];
  const initialStock = firstVar.stockQuantity;

  const res = storeDb.bulkUpdateVariantInventory(
    [
      {
        productId: firstProd.id,
        variantId: firstVar.id,
        productName: firstProd.name,
        variantTitle: firstVar.title,
        sku: firstVar.sku,
        locationId: 'loc_lahore_gulberg',
        currentStock: initialStock,
        newStock: initialStock + 35,
        delta: 35,
        reason: 'received',
      },
    ],
    'Unit Test Admin'
  );

  assert.equal(res.updatedVariantsCount, 1);
  assert.equal(res.netDelta, 35);

  const updatedProd = storeDb.getProductById(firstProd.id)!;
  assert.equal(updatedProd.variants[0].stockQuantity, initialStock + 35);

  const history = storeDb.getStockHistory();
  assert.ok(history.length > 0);
  assert.equal(history[0].sku, firstVar.sku);
  assert.equal(history[0].delta, 35);
  assert.equal(history[0].newAvailable, initialStock + 35);
});

test('Homepage Product Display Control & Shop Extractors: updates homepageProductLimit and extracts size/color options', () => {
  storeDb.updateSettings({ homepageProductLimit: 8, shopProductsPerPage: 12 });
  const updatedSettings = storeDb.getSettings();
  assert.equal(updatedSettings.homepageProductLimit, 8);
  assert.equal(updatedSettings.shopProductsPerPage, 12);

  // Restore default 4
  storeDb.updateSettings({ homepageProductLimit: 4, shopProductsPerPage: 12 });

  const allProds = storeDb.getProducts();
  const sizesFound = new Set<string>();
  const colorsFound = new Set<string>();
  allProds.forEach((p) => {
    extractProductSizes(p).forEach((s) => sizesFound.add(s));
    extractProductColors(p).forEach((c) => colorsFound.add(c));
  });

  assert.ok(sizesFound.size >= 4, 'Expected multiple distinct sizes across catalog');
  assert.ok(colorsFound.size >= 4, 'Expected multiple distinct colors across catalog');
});

test('Pakistan Checkout: PKR pricing, discount + gift card calculation, card tokenization, and idempotent COD/Card order creation', () => {
  const pkrCurrency = storeDb.getCurrencyByCode('PKR');
  const pkCountry = storeDb.getCountryByCode('PK')!;
  const prod = storeDb.getProducts()[0];

  // 1. Tokenization never retains raw card number and detects declined test card 0002
  const validToken = tokenizePaymentCard({
    cardNumber: '4532 8810 9921 4481',
    cardholderName: 'AYESHA KHAN',
    expiry: '09/28',
    cvv: '842',
  });
  assert.equal(validToken.valid, true);
  assert.equal(validToken.cardBrand, 'Visa');
  assert.equal(validToken.cardLast4, '4481');
  assert.equal(validToken.isDeclinedTestCard, false);
  assert.ok(validToken.paymentToken?.startsWith('tok_pk_visa_4481_'));

  const declinedToken = tokenizePaymentCard({
    cardNumber: '5200 1111 2222 0002',
    cardholderName: 'TEST DECLINE',
    expiry: '10/28',
    cvv: '999',
  });
  assert.equal(declinedToken.valid, true);
  assert.equal(declinedToken.cardBrand, 'Mastercard');
  assert.equal(declinedToken.cardLast4, '0002');
  assert.equal(declinedToken.isDeclinedTestCard, true);

  // 2. Shipping methods & financials with discount + gift card
  const shippingMethods = getAvailableShippingMethods(pkCountry, pkrCurrency);
  assert.ok(shippingMethods.length >= 3);
  const expressMethod = shippingMethods.find((m) => m.id === 'pk_express')!;

  const zariya15Discount = storeDb
    .getDiscounts()
    .find((d) => d.code === 'ZARIYA15')!;
  const giftCards = storeDb.getGiftCards();

  const preGiftFinancials = calculateOrderFinancials({
    subtotalMinorUnits: 1000000, // Rs. 10,000
    country: pkCountry,
    currency: pkrCurrency,
    freeShippingThresholdMinorUnits: 300000, // Rs. 3,000
    shippingMethodOption: expressMethod, // Rs. 350 express courier (not free over threshold)
    discountRule: zariya15Discount, // 15% off = Rs. 1,500 discount
  });
  assert.equal(preGiftFinancials.discountMinorUnits, 150000);
  assert.equal(preGiftFinancials.shippingFeeMinorUnits, 35000);

  const gcEval = evaluateGiftCardRedemption({
    amountDueMinorUnits: preGiftFinancials.totalAmountMinorUnits,
    giftCards,
    giftCardCode: 'ZARIYA-GIFT-5000', // Rs. 5,000 balance
  });
  assert.equal(gcEval.valid, true);
  assert.equal(gcEval.appliedMinorUnits, 500000);

  const finalFinancials = calculateOrderFinancials({
    subtotalMinorUnits: 1000000,
    country: pkCountry,
    currency: pkrCurrency,
    freeShippingThresholdMinorUnits: 300000,
    shippingMethodOption: expressMethod,
    discountRule: zariya15Discount,
    giftCardAppliedMinorUnits: gcEval.appliedMinorUnits,
  });
  assert.equal(finalFinancials.giftCardAppliedMinorUnits, 500000);
  assert.equal(
    finalFinancials.totalAmountMinorUnits,
    preGiftFinancials.totalAmountMinorUnits - 500000
  );

  // 3. Idempotent Order Creation & Inventory Decrement
  const initialStock = prod.variants[0].stockQuantity;
  const verRec = storeDb.recordAgeVerification({
    customerEmail: 'idempotency.test@zariya.pk',
    customerName: 'Idempotency Tester',
    countryCode: 'PK',
    dateOfBirth: '1995-01-01',
    verifiedAge: 31,
    provider: 'Pakistan COD Verification',
    providerReference: 'PK-COD-TEST-999',
    status: 'passed',
  });

  const snapshot = buildImmutableOrderSnapshot({
    orderNumber: 'ZAR-PK-IDEM-999',
    idempotencyKey: 'idem_unit_test_key_999',
    customer: {
      fullName: 'Idempotency Tester',
      email: 'idempotency.test@zariya.pk',
      phone: '+92 300 8429100',
    },
    shippingAddress: {
      addressLine1: 'House 12, Street 4, DHA Phase 5',
      city: 'Lahore',
      stateOrProvince: 'Punjab',
      postalCode: '54792',
      countryCode: 'PK',
      countryName: 'Pakistan',
    },
    cartItems: [
      {
        id: 'ci_1',
        productId: prod.id,
        variantId: prod.variants[0].id,
        product: prod,
        variant: prod.variants[0],
        quantity: 2,
        unitPriceMinorUnits: prod.variants[0].priceMinorUnits,
        totalPriceMinorUnits: prod.variants[0].priceMinorUnits * 2,
      },
    ],
    country: pkCountry,
    currency: pkrCurrency,
    ageVerification: verRec,
    financials: finalFinancials,
    paymentMethod: 'credit_card_gateway',
    paymentDetails: {
      transactionId: 'ZARIYA_PK_TEST999',
      paymentStatus: 'captured',
      cardBrand: 'Visa',
      cardLast4: '4481',
      paymentToken: validToken.paymentToken,
    },
  });

  const created1 = storeDb.createOrder(snapshot);
  const stockAfterFirst = storeDb.getProductById(prod.id)!.variants[0].stockQuantity;
  assert.equal(stockAfterFirst, initialStock - 2);

  // Calling createOrder a second time with the same idempotencyKey must NOT duplicate or decrement stock again
  const created2 = storeDb.createOrder(snapshot);
  const stockAfterSecond = storeDb.getProductById(prod.id)!.variants[0].stockQuantity;
  assert.equal(created2.orderId, created1.orderId);
  assert.equal(stockAfterSecond, initialStock - 2);
});
