import React, { useState, useEffect, useMemo } from 'react';
import {
  Country,
  Currency,
  Product,
  CartItem,
  ProductVariant,
  ImmutableOrderSnapshot,
  StoreSettings,
  UserRole,
} from './types/ecommerce';
import { storeDb } from './services/store-db';
import { analyticsTracker } from './services/analytics-tracker';
import { resolveProductPrice } from './utils/commerce-engine';
import { Header, StorefrontNavView } from './components/common/Header';
import { HeroBanner } from './components/storefront/HeroBanner';
import {
  ZariyaCategoryShowcase,
  ZariyaFeaturedProductBand,
  ZariyaPromotionalMidBanner,
  ZariyaTrustStrip,
  ZariyaBrandStory,
  ZariyaCustomerReviews,
  ZariyaStyleJournal,
  ZariyaFaqSection,
  ZariyaRecentlyViewedStrip,
} from './components/storefront/MavenoEditorialSections';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { ShopAllProductsPage } from './components/storefront/ShopAllProductsPage';
import { StoreInfoPages } from './components/storefront/StoreInfoPages';
import { CartDrawer } from './components/cart/CartDrawer';
import { ShoppingCartPage } from './components/cart/ShoppingCartPage';
import { ShopifyCheckoutPage } from './components/checkout/ShopifyCheckoutPage';
import { OrderConfirmationPage } from './components/checkout/OrderConfirmationPage';
import { OrderConfirmationModal } from './components/checkout/OrderConfirmationModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import {
  adminAuthClient,
  AuthenticatedAdminProfile,
} from './services/admin-auth-client';
import { CustomerDashboardModal } from './components/account/CustomerDashboardModal';
import { BlogModal } from './components/cms/BlogModal';
import { Footer } from './components/common/Footer';
import { FestiveConfetti, triggerFestiveConfetti } from './components/common/FestiveConfetti';

const PATH_TO_VIEW: Record<string, StorefrontNavView> = {
  '/': 'home',
  '/shop': 'shop',
  '/collections': 'collections',
  '/sale': 'sale',
  '/new-arrivals': 'new_arrivals',
  '/best-sellers': 'best_sellers',
  '/wishlist': 'wishlist',
  '/cart': 'cart',
  '/checkout': 'checkout',
  '/order-confirmation': 'order_confirmation',
  '/track-order': 'track_order',
  '/about': 'about',
  '/contact': 'contact',
  '/shipping-policy': 'shipping_policy',
  '/return-policy': 'return_policy',
  '/privacy-policy': 'privacy_policy',
};

const VIEW_TO_PATH: Record<StorefrontNavView, string> = {
  home: '/',
  shop: '/shop',
  collections: '/collections',
  sale: '/sale',
  new_arrivals: '/new-arrivals',
  best_sellers: '/best-sellers',
  wishlist: '/wishlist',
  cart: '/cart',
  checkout: '/checkout',
  order_confirmation: '/order-confirmation',
  track_order: '/track-order',
  about: '/about',
  contact: '/contact',
  shipping_policy: '/shipping-policy',
  return_policy: '/return-policy',
  privacy_policy: '/privacy-policy',
};

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(storeDb.getSettings());
  const [countries, setCountries] = useState<Country[]>(storeDb.getCountries());
  const [currencies, setCurrencies] = useState<Currency[]>(storeDb.getCurrencies());
  const [products, setProducts] = useState<Product[]>(storeDb.getProducts());
  const [orders, setOrders] = useState<ImmutableOrderSnapshot[]>(storeDb.getOrders());
  const [verifications, setVerifications] = useState(storeDb.getAgeVerifications());
  const [blogPosts, setBlogPosts] = useState(storeDb.getBlogPosts());
  const [userRole, setUserRole] = useState<UserRole>(storeDb.getCurrentUserRole());
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => storeDb.getWishlistProductIds());
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    storeDb.getRecentlyViewedProductIds()
  );

  // Default to Pakistan (PK) and PKR (Rs.)
  const [currentCountry, setCurrentCountry] = useState<Country>(
    countries.find((c) => c.code === 'PK') || countries[0]
  );
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(
    currencies.find((c) => c.code === 'PKR') || currencies[0]
  );

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Persistent Cart State
  const initialPersistedCart = storeDb.getPersistedCart(
    (countries.find((c) => c.code === 'PK') || countries[0]).code,
    currencies.find((c) => c.code === 'PKR') || currencies[0]
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(initialPersistedCart.items);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>(
    initialPersistedCart.discountCode
  );
  const [appliedGiftCardCode, setAppliedGiftCardCode] = useState<string>(
    initialPersistedCart.giftCardCode
  );
  const [cartOrderNotes, setCartOrderNotes] = useState<string>(
    initialPersistedCart.orderNotes
  );
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>(
    initialPersistedCart.shippingMethodId || 'pk_standard'
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals & Routing
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<ImmutableOrderSnapshot | null>(
    () => storeDb.getOrders()[0] || null
  );
  const [receiptModalOrder, setReceiptModalOrder] = useState<ImmutableOrderSnapshot | null>(null);
  const [adminView, setAdminView] = useState<'closed' | 'login' | 'dashboard'>('closed');
  const [storefrontView, setStorefrontView] = useState<StorefrontNavView>(() => {
    if (typeof window === 'undefined') return 'home';
    return PATH_TO_VIEW[window.location.pathname] || 'home';
  });
  const [authenticatedAdmin, setAuthenticatedAdmin] = useState<AuthenticatedAdminProfile | null>(
    null
  );
  const [adminAuthNotice, setAdminAuthNotice] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isBlogOpen, setIsBlogOpen] = useState(false);

  useEffect(() => {
    storeDb.applyBrandStyling();
  }, [settings]);

  useEffect(() => {
    storeDb.savePersistedCart({
      items: cartItems,
      discountCode: appliedDiscountCode,
      giftCardCode: appliedGiftCardCode,
      orderNotes: cartOrderNotes,
      shippingMethodId: selectedShippingMethodId,
    });
  }, [
    cartItems,
    appliedDiscountCode,
    appliedGiftCardCode,
    cartOrderNotes,
    selectedShippingMethodId,
  ]);

  useEffect(() => {
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalValueMinor = cartItems.reduce((acc, item) => acc + item.totalPriceMinorUnits, 0);
    analyticsTracker.trackEvent({
      type: storefrontView === 'checkout' ? 'checkout_started' : 'page_view',
      countryCode: currentCountry.code,
      pagePath: VIEW_TO_PATH[storefrontView] || '/',
      cartItemCount: totalCount,
      cartValueMinorUnits: totalValueMinor,
      inCheckout: storefrontView === 'checkout',
    });
  }, [storefrontView, currentCountry.code, cartItems]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalValueMinor = cartItems.reduce((acc, item) => acc + item.totalPriceMinorUnits, 0);
      analyticsTracker.trackEvent({
        type: 'heartbeat',
        countryCode: currentCountry.code,
        cartItemCount: totalCount,
        cartValueMinorUnits: totalValueMinor,
        inCheckout: storefrontView === 'checkout',
      });
    }, 25000);
    return () => window.clearInterval(timer);
  }, [currentCountry.code, cartItems, storefrontView]);

  useEffect(() => {
    setCartItems((prev) =>
      prev.map((item) => {
        const unitPriceMinorUnits = resolveProductPrice(
          item.product,
          currentCountry.code,
          currentCurrency,
          1.0,
          item.variant
        );
        return {
          ...item,
          unitPriceMinorUnits,
          totalPriceMinorUnits: item.quantity * unitPriceMinorUnits,
        };
      })
    );
  }, [currentCountry.code, currentCurrency]);

  useEffect(() => {
    const evaluateRoute = async () => {
      const path = window.location.pathname;
      if (path === '/admin/login') {
        const session = await adminAuthClient.verifySession();
        if (session.authenticated && session.admin) {
          setAuthenticatedAdmin(session.admin);
          window.history.replaceState({}, '', '/admin');
          setAdminView('dashboard');
        } else {
          setAuthenticatedAdmin(null);
          setAdminView('login');
        }
      } else if (path === '/admin' || path.startsWith('/admin/')) {
        const session = await adminAuthClient.verifySession();
        if (session.authenticated && session.admin) {
          setAuthenticatedAdmin(session.admin);
          setAdminAuthNotice(null);
          setAdminView('dashboard');
        } else {
          setAuthenticatedAdmin(null);
          setAdminAuthNotice('Please sign in with administrator credentials.');
          window.history.replaceState({}, '', '/admin/login');
          setAdminView('login');
        }
      } else {
        setAdminView('closed');
        setStorefrontView(PATH_TO_VIEW[path] || 'home');
      }
    };

    void evaluateRoute();
    const onPopState = () => void evaluateRoute();
    window.addEventListener('popstate', onPopState);
    const unsubscribeUnauth = adminAuthClient.onUnauthorized(() => {
      setAuthenticatedAdmin(null);
      setAdminAuthNotice('Your administrator session expired. Please sign in again.');
      window.history.replaceState({}, '', '/admin/login');
      setAdminView('login');
    });
    return () => {
      window.removeEventListener('popstate', onPopState);
      unsubscribeUnauth();
    };
  }, []);

  const navigateTo = (view: StorefrontNavView, categoryId?: string) => {
    if (categoryId !== undefined) {
      setSelectedCategory(categoryId);
    }
    setAdminView('closed');
    setIsCartOpen(false);
    const targetPath = VIEW_TO_PATH[view] || '/';
    window.history.pushState({}, '', targetPath);
    setStorefrontView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminGateway = async () => {
    window.scrollTo({ top: 0 });
    const session = await adminAuthClient.verifySession();
    if (session.authenticated && session.admin) {
      setAuthenticatedAdmin(session.admin);
      setAdminAuthNotice(null);
      window.history.pushState({}, '', '/admin');
      setAdminView('dashboard');
    } else {
      setAuthenticatedAdmin(null);
      setAdminAuthNotice(null);
      window.history.pushState({}, '', '/admin/login');
      setAdminView('login');
    }
  };

  const handleAdminLogout = async () => {
    await adminAuthClient.logout();
    setAuthenticatedAdmin(null);
    setAdminAuthNotice('Signed out of Admin Console.');
    window.history.pushState({}, '', '/admin/login');
    setAdminView('login');
  };

  const handleInspectProduct = (product: Product) => {
    const updatedRecent = storeDb.recordRecentlyViewedProduct(product.id);
    setRecentIds(updatedRecent);
    setSelectedProduct(product);
    analyticsTracker.trackEvent({
      type: 'product_view',
      countryCode: currentCountry.code,
      productId: product.id,
      productName: product.name,
    });
  };

  const handleToggleWishlist = (productId: string) => {
    const res = storeDb.toggleWishlistProduct(productId);
    setWishlistIds(res.wishlistIds);
  };

  const refreshAllData = () => {
    setSettings(storeDb.getSettings());
    const refreshedCountries = storeDb.getCountries();
    setCountries(refreshedCountries);
    setCurrencies(storeDb.getCurrencies());
    setProducts(storeDb.getProducts());
    setOrders(storeDb.getOrders());
    setVerifications(storeDb.getAgeVerifications());
    setBlogPosts(storeDb.getBlogPosts());
    setUserRole(storeDb.getCurrentUserRole());
  };

  const handleSelectCountry = (country: Country) => {
    setCurrentCountry(country);
    const matchingCurrency = currencies.find((c) => c.code === country.defaultCurrencyCode);
    if (matchingCurrency) {
      setCurrentCurrency(matchingCurrency);
    }
  };

  const handleAddToCart = (
    product: Product,
    variant?: ProductVariant,
    quantity = 1,
    openDrawer = true
  ) => {
    const selectedVar = variant || product.variants[0];
    const unitPriceMinorUnits = resolveProductPrice(
      product,
      currentCountry.code,
      currentCurrency,
      1.0,
      selectedVar
    );

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === selectedVar.id
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          unitPriceMinorUnits,
          quantity: newQty,
          totalPriceMinorUnits: newQty * unitPriceMinorUnits,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          productId: product.id,
          variantId: selectedVar.id,
          product,
          variant: selectedVar,
          quantity,
          unitPriceMinorUnits,
          totalPriceMinorUnits: quantity * unitPriceMinorUnits,
        },
      ];
    });

    if (openDrawer) {
      setIsCartOpen(true);
      triggerFestiveConfetti('cart');
    }

    analyticsTracker.trackEvent({
      type: 'add_to_cart',
      countryCode: currentCountry.code,
      productId: product.id,
      productName: product.name,
      variantTitle: selectedVar.title,
      quantity,
      amountMinorUnits: quantity * unitPriceMinorUnits,
    });
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity: newQty,
              totalPriceMinorUnits: newQty * item.unitPriceMinorUnits,
            }
          : item
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setAppliedDiscountCode('');
    setAppliedGiftCardCode('');
    setCartOrderNotes('');
    storeDb.clearPersistedCart();
  };

  const cartSubtotalMinorUnits = cartItems.reduce(
    (acc, item) => acc + item.totalPriceMinorUnits,
    0
  );

  const allCategories = storeDb.getCategories();
  const allCollections = storeDb.getCollections();
  const allDiscounts = storeDb.getDiscounts();
  const allGiftCards = storeDb.getGiftCards();
  const allCustomers = storeDb.getCustomers();

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  // Curated 7 Homepage Featured Product Bands
  const saleProducts = useMemo(
    () =>
      [...publishedProducts]
        .sort((a, b) => {
          const discA = a.compareAtPriceMinorUnits
            ? (a.compareAtPriceMinorUnits - a.basePriceMinorUnits) / a.compareAtPriceMinorUnits
            : 0;
          const discB = b.compareAtPriceMinorUnits
            ? (b.compareAtPriceMinorUnits - b.basePriceMinorUnits) / b.compareAtPriceMinorUnits
            : 0;
          return discB - discA;
        })
        .slice(0, 4),
    [publishedProducts]
  );

  const bestSellingProducts = useMemo(
    () =>
      [...publishedProducts]
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 4),
    [publishedProducts]
  );

  const newArrivalsProducts = useMemo(() => {
    const tagged = publishedProducts.filter(
      (p) =>
        p.collectionIds?.includes('col_new_arrivals') ||
        (p.tags || []).some((t) => t.toLowerCase().includes('new'))
    );
    return (tagged.length >= 4 ? tagged : publishedProducts).slice(0, 4);
  }, [publishedProducts]);

  const trendingSuits = useMemo(() => {
    const tagged = publishedProducts.filter(
      (p) =>
        p.collectionIds?.includes('col_trending_suits') ||
        ['cat_3pc_suits', 'cat_unstitched_lawn', 'cat_2pc_suits'].includes(p.categoryId)
    );
    return (tagged.length >= 4 ? tagged : publishedProducts).slice(0, 4);
  }, [publishedProducts]);

  const luxuryCollectionProducts = useMemo(() => {
    const lux = publishedProducts.filter(
      (p) =>
        p.collectionIds?.includes('col_luxury_collection') ||
        ['cat_luxury_pret', 'cat_formal_wear', 'cat_chiffon_collection', 'cat_party_wear'].includes(
          p.categoryId
        )
    );
    return (lux.length >= 4 ? lux : publishedProducts).slice(0, 4);
  }, [publishedProducts]);

  const under1999Products = useMemo(
    () =>
      publishedProducts
        .filter((p) => p.basePriceMinorUnits <= 199900)
        .slice(0, 4),
    [publishedProducts]
  );

  const customerFavouriteProducts = useMemo(
    () =>
      [...publishedProducts]
        .filter((p) => p.featured || (p.reviews?.length || 0) > 0)
        .slice(0, 4),
    [publishedProducts]
  );

  const heroSpotlightProduct =
    publishedProducts.find((p) => p.id === 'prod_luxury_organza_blush') || publishedProducts[0];

  if (adminView === 'login') {
    return (
      <AdminLoginPage
        settings={settings}
        unauthorizedReason={adminAuthNotice}
        onLoginSuccess={(admin) => {
          setAuthenticatedAdmin(admin);
          setAdminAuthNotice(null);
          window.history.pushState({}, '', '/admin');
          setAdminView('dashboard');
        }}
        onBackToStorefront={() => navigateTo('home')}
      />
    );
  }

  const isShopMode =
    storefrontView === 'shop' ||
    storefrontView === 'sale' ||
    storefrontView === 'new_arrivals' ||
    storefrontView === 'best_sellers';

  const isInfoPage =
    storefrontView === 'collections' ||
    storefrontView === 'wishlist' ||
    storefrontView === 'track_order' ||
    storefrontView === 'about' ||
    storefrontView === 'contact' ||
    storefrontView === 'shipping_policy' ||
    storefrontView === 'return_policy' ||
    storefrontView === 'privacy_policy';

  return (
    <div className="min-h-screen flex flex-col bg-[#240323] text-white">
      <Header
        settings={settings}
        categories={allCategories}
        currentCountry={currentCountry}
        currentCurrency={currentCurrency}
        countries={countries}
        currencies={currencies}
        onSelectCountry={handleSelectCountry}
        onSelectCurrency={setCurrentCurrency}
        cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        cartSubtotalMinorUnits={cartSubtotalMinorUnits}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenBlog={() => setIsBlogOpen(true)}
        onSearch={(q) => setSearchQuery(q)}
        searchQuery={searchQuery}
        onSelectCategory={(catId) => navigateTo('shop', catId)}
        storefrontView={storefrontView}
        onNavigate={navigateTo}
      />

      {isShopMode ? (
        <main className="grow">
          <ShopAllProductsPage
            key={`${storefrontView}_${selectedCategory}`}
            products={products}
            categories={allCategories}
            collections={allCollections}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            defaultProductsPerPage={settings.shopProductsPerPage || 12}
            initialCategory={selectedCategory}
            initialSearchQuery={searchQuery}
            shopMode={
              storefrontView === 'sale'
                ? 'sale'
                : storefrontView === 'new_arrivals'
                ? 'new_arrivals'
                : storefrontView === 'best_sellers'
                ? 'best_sellers'
                : 'all'
            }
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onBackToHome={() => navigateTo('home')}
            onViewProduct={handleInspectProduct}
            onAddToCart={(p, variant, qty) => handleAddToCart(p, variant, qty)}
          />
        </main>
      ) : isInfoPage ? (
        <main className="grow">
          <StoreInfoPages
            view={storefrontView}
            settings={settings}
            categories={allCategories}
            products={publishedProducts}
            orders={orders}
            wishlistIds={wishlistIds}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={(p, variant, qty) => handleAddToCart(p, variant, qty)}
            onNavigate={navigateTo}
          />
        </main>
      ) : storefrontView === 'cart' ? (
        <main className="grow">
          <ShoppingCartPage
            items={cartItems}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            settings={settings}
            discounts={allDiscounts}
            appliedDiscountCode={appliedDiscountCode}
            onApplyDiscountCode={setAppliedDiscountCode}
            orderNotes={cartOrderNotes}
            onChangeOrderNotes={setCartOrderNotes}
            selectedShippingMethodId={selectedShippingMethodId}
            onSelectShippingMethod={setSelectedShippingMethodId}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onContinueShopping={() => navigateTo('shop', 'all')}
            onProceedToCheckout={() => navigateTo('checkout')}
            onViewProduct={handleInspectProduct}
          />
        </main>
      ) : storefrontView === 'checkout' ? (
        <main className="grow">
          <ShopifyCheckoutPage
            cartItems={cartItems}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            settings={settings}
            discounts={allDiscounts}
            giftCards={allGiftCards}
            customers={allCustomers}
            appliedDiscountCode={appliedDiscountCode}
            onApplyDiscountCode={setAppliedDiscountCode}
            appliedGiftCardCode={appliedGiftCardCode}
            onApplyGiftCardCode={setAppliedGiftCardCode}
            selectedShippingMethodId={selectedShippingMethodId}
            onSelectShippingMethod={setSelectedShippingMethodId}
            orderNotes={cartOrderNotes}
            onChangeOrderNotes={setCartOrderNotes}
            onBackToCart={() => navigateTo('cart')}
            onBackToStorefront={() => navigateTo('home')}
            onOrderCompleted={(order) => {
              analyticsTracker.trackEvent({
                type: 'purchase_completed',
                countryCode: order.shippingAddress.countryCode || currentCountry.code,
                city: order.shippingAddress.city,
                pagePath: '/order-confirmation',
                cartItemCount: 0,
                cartValueMinorUnits: 0,
                inCheckout: false,
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                amountMinorUnits: order.financials.totalAmountMinorUnits,
              });
              setCompletedOrder(order);
              handleClearCart();
              refreshAllData();
              navigateTo('order_confirmation');
            }}
          />
        </main>
      ) : storefrontView === 'order_confirmation' ? (
        <main className="grow">
          <OrderConfirmationPage
            order={completedOrder}
            allOrders={orders}
            currentCurrency={currentCurrency}
            settings={settings}
            onContinueShopping={() => navigateTo('home')}
            onViewOrderReceipt={(ord) => setReceiptModalOrder(ord)}
            onOpenCustomerAccount={() => setIsAccountOpen(true)}
          />
        </main>
      ) : (
        <main className="grow">
          {/* HERO CAMPAIGN BANNER */}
          <HeroBanner
            settings={settings}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            featuredProduct={heroSpotlightProduct}
            onShopSale={() => navigateTo('sale')}
            onExploreNewArrivals={() => navigateTo('new_arrivals')}
            onInspectProduct={handleInspectProduct}
          />

          {/* 10 IMAGE-BASED CATEGORIES */}
          <ZariyaCategoryShowcase
            categories={allCategories}
            onSelectCategory={(catId) => navigateTo('shop', catId)}
            onViewAllCollections={() => navigateTo('collections')}
          />

          {/* PAKISTANI TRUST STRIP */}
          <ZariyaTrustStrip settings={settings} />

          {/* FEATURED SECTION 1: SALE SALE SALE */}
          <ZariyaFeaturedProductBand
            id="sale-sale-sale"
            eyebrow="Up to 70% Off"
            title="SALE SALE SALE"
            subtitle="Massive markdowns on embroidered 3-piece lawn, organza formals & everyday pret."
            products={saleProducts}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('sale')}
            viewAllLabel="Shop All Sale"
            variantStyle="blush"
          />

          {/* FEATURED SECTION 2: Best Selling Products */}
          <ZariyaFeaturedProductBand
            id="best-selling-products"
            eyebrow="Most Popular Across Pakistan"
            title="Best Selling Products"
            subtitle="Top-rated Pakistani eastern wear ordered daily from Lahore, Karachi & Islamabad."
            products={bestSellingProducts}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('best_sellers')}
            viewAllLabel="View Best Sellers"
            variantStyle="ivory"
          />

          {/* FEATURED SECTION 3: New Arrivals */}
          <ZariyaFeaturedProductBand
            id="new-arrivals"
            eyebrow="Fresh Season Drop"
            title="New Arrivals"
            subtitle="Just landed from our Lahore atelier — embroidered lawn, cotton kurtis & winter khaddar."
            products={newArrivalsProducts}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('new_arrivals')}
            viewAllLabel="Explore New Arrivals"
            variantStyle="beige"
          />

          {/* MID PROMO BANNER */}
          <ZariyaPromotionalMidBanner
            onShopSale={() => navigateTo('sale')}
            onExploreLuxury={() => navigateTo('shop', 'cat_chiffon_collection')}
          />

          {/* FEATURED SECTION 4: Trending Pakistani Suits */}
          <ZariyaFeaturedProductBand
            id="trending-suits"
            eyebrow="Pakistani Classics"
            title="Trending Pakistani Suits"
            subtitle="Signature 2-Piece & 3-Piece stitched and unstitched lawn silhouettes."
            products={trendingSuits}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('shop', 'cat_3pc_suits')}
            viewAllLabel="Shop 3 Piece Suits"
            variantStyle="ivory"
          />

          {/* FEATURED SECTION 5: Luxury Collection */}
          <ZariyaFeaturedProductBand
            id="luxury-collection"
            eyebrow="Festive, Wedding & Evening"
            title="Luxury Collection"
            subtitle="Pure chiffon, embroidered organza & designer silk ensembles with intricate tilla work."
            products={luxuryCollectionProducts}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('shop', 'cat_luxury_pret')}
            viewAllLabel="Explore Luxury Pret"
            variantStyle="blush"
          />

          {/* FEATURED SECTION 6: Under Rs. 1,999 */}
          <ZariyaFeaturedProductBand
            id="under-1999"
            eyebrow="Unbeatable Value"
            title="Under Rs. 1,999"
            subtitle="Stylish everyday kurtis, cotton daily wear & printed 2-piece deals under Rs. 1,999."
            products={under1999Products}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('shop', 'cat_casual_wear')}
            viewAllLabel="Shop Budget Picks"
            variantStyle="beige"
          />

          {/* FEATURED SECTION 7: Customer Favourite Picks */}
          <ZariyaFeaturedProductBand
            id="customer-favourites"
            eyebrow="5-Star Wardrobe Staples"
            title="Customer Favourite Picks"
            subtitle="Highest-reviewed suits loved for breathable comfort & true-to-chart stitching."
            products={customerFavouriteProducts}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigateTo('shop', 'all')}
            viewAllLabel="Shop All Outfits"
            variantStyle="ivory"
          />

          <ZariyaRecentlyViewedStrip
            products={publishedProducts}
            recentIds={recentIds}
            currentCountry={currentCountry}
            currentCurrency={currentCurrency}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={handleInspectProduct}
            onAddToCart={handleAddToCart}
          />

          <ZariyaBrandStory
            settings={settings}
            onExploreShop={() => navigateTo('shop', 'all')}
            onOpenAbout={() => navigateTo('about')}
          />

          <ZariyaCustomerReviews
            products={publishedProducts}
            onViewProduct={handleInspectProduct}
          />

          <ZariyaStyleJournal posts={blogPosts} onOpenBlog={() => setIsBlogOpen(true)} />

          <ZariyaFaqSection settings={settings} onOpenContact={() => navigateTo('contact')} />
        </main>
      )}

      <Footer
        settings={settings}
        currentCountry={currentCountry}
        currentCurrency={currentCurrency}
        countries={countries}
        currencies={currencies}
        onSelectCountry={handleSelectCountry}
        onSelectCurrency={setCurrentCurrency}
        onOpenBlog={() => setIsBlogOpen(true)}
        onOpenAdmin={() => void handleOpenAdminGateway()}
        onOpenAccount={() => setIsAccountOpen(true)}
        onNavigate={navigateTo}
        onSubscribed={refreshAllData}
      />

      <ProductDetailModal
        product={selectedProduct}
        allProducts={publishedProducts}
        currentCountry={currentCountry}
        currentCurrency={currentCurrency}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onSelectRelatedProduct={handleInspectProduct}
        onReviewAdded={refreshAllData}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, variant, qty) => {
          handleAddToCart(prod, variant, qty);
          setSelectedProduct(null);
        }}
        onBuyNow={(prod, variant, qty) => {
          handleAddToCart(prod, variant, qty, false);
          setSelectedProduct(null);
          navigateTo('checkout');
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        currentCountry={currentCountry}
        currentCurrency={currentCurrency}
        settings={settings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onViewFullCart={() => navigateTo('cart')}
        onCheckout={() => navigateTo('checkout')}
      />

      <OrderConfirmationModal
        order={receiptModalOrder}
        currency={currentCurrency}
        settings={settings}
        onClose={() => setReceiptModalOrder(null)}
      />

      <AdminDashboard
        isOpen={adminView === 'dashboard' && Boolean(authenticatedAdmin)}
        authenticatedAdmin={authenticatedAdmin}
        onClose={() => navigateTo('home')}
        onLogout={() => void handleAdminLogout()}
        settings={settings}
        countries={countries}
        currencies={currencies}
        products={products}
        orders={orders}
        verifications={verifications}
        onRefreshData={refreshAllData}
      />

      <CustomerDashboardModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        orders={orders}
        settings={settings}
        currentRole={userRole}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => navigateTo('wishlist')}
        onRoleChanged={(r) => setUserRole(r)}
        onOrdersUpdated={refreshAllData}
        onViewOrder={(order) => {
          setCompletedOrder(order);
          navigateTo('order_confirmation');
        }}
      />

      <BlogModal
        isOpen={isBlogOpen}
        onClose={() => setIsBlogOpen(false)}
        posts={blogPosts}
      />

      <FestiveConfetti />
    </div>
  );
}
