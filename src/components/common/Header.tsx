import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  Category,
  Country,
  Currency,
  StoreSettings,
} from '../../types/ecommerce';
import { formatMinorUnits } from '../../utils/commerce-engine';

export type StorefrontNavView =
  | 'home'
  | 'shop'
  | 'collections'
  | 'sale'
  | 'new_arrivals'
  | 'best_sellers'
  | 'wishlist'
  | 'cart'
  | 'checkout'
  | 'order_confirmation'
  | 'track_order'
  | 'about'
  | 'contact'
  | 'shipping_policy'
  | 'return_policy'
  | 'privacy_policy';

interface HeaderProps {
  settings: StoreSettings;
  categories: Category[];
  currentCountry: Country;
  currentCurrency: Currency;
  countries: Country[];
  currencies: Currency[];
  onSelectCountry: (country: Country) => void;
  onSelectCurrency: (currency: Currency) => void;
  cartItemCount: number;
  cartSubtotalMinorUnits: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenBlog: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onSelectCategory: (categoryId: string) => void;
  storefrontView: StorefrontNavView;
  onNavigate: (view: StorefrontNavView, categoryId?: string) => void;
}

const DEFAULT_ANNOUNCEMENTS = [
  'SALE SALE SALE! UP TO 70% OFF',
  'MEGA FASHION SALE IS LIVE!',
  'FLAT 30% OFF ON SELECTED COLLECTIONS',
  'FREE DELIVERY ON ORDERS ABOVE RS. 3,000',
  'LIMITED TIME FASHION DEALS!',
];

export const Header: React.FC<HeaderProps> = ({
  settings,
  categories,
  currentCurrency,
  currencies,
  onSelectCurrency,
  cartItemCount,
  cartSubtotalMinorUnits,
  wishlistCount,
  onOpenCart,
  onOpenAccount,
  onSearch,
  searchQuery,
  storefrontView,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [isAnnouncementPaused, setIsAnnouncementPaused] = useState(false);

  const messages =
    settings.announcementMessages && settings.announcementMessages.length > 0
      ? settings.announcementMessages
      : DEFAULT_ANNOUNCEMENTS;

  useEffect(() => {
    if (isAnnouncementPaused || messages.length <= 1) return;
    const interval = window.setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [isAnnouncementPaused, messages.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storefrontView !== 'shop') {
      onNavigate('shop', 'all');
    }
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#240323]/95 backdrop-blur-md border-b border-[#5E1659] text-white">
      {/* 1. Rotating Festive Sale Announcement Bar */}
      {settings.announcementBarEnabled !== false && (
        <div
          data-testid="sale-announcement-bar"
          onMouseEnter={() => setIsAnnouncementPaused(true)}
          onMouseLeave={() => setIsAnnouncementPaused(false)}
          className="bg-gradient-to-r from-[#4E0C47] via-[#8F197E] to-[#4E0C47] border-b border-[#FFC700]/30 text-white text-[11px] sm:text-xs font-semibold tracking-wider uppercase py-2 px-3 relative"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                setAnnouncementIdx((prev) => (prev - 1 + messages.length) % messages.length)
              }
              aria-label="Previous announcement"
              className="p-1 text-white/75 hover:text-[#FFC700] transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sale')}
              className="flex items-center justify-center gap-2 text-center truncate cursor-pointer hover:opacity-95 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFC700] shrink-0 hidden sm:inline" />
              <span key={announcementIdx} className="animate-in fade-in duration-300 truncate font-bold">
                {messages[announcementIdx]}
              </span>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[10px] font-extrabold text-[#240323] tracking-wider">
                SHOP NOW
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAnnouncementIdx((prev) => (prev + 1) % messages.length)}
              aria-label="Next announcement"
              className="p-1 text-white/75 hover:text-[#FFC700] transition-colors cursor-pointer shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Utility Strip (Desktop) */}
      <div className="hidden lg:block bg-[#180117] border-b border-[#4A0F45] text-[11px] text-[#E6CBE3]">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#FFC700]" />
              <span>Nationwide Cash on Delivery Across Pakistan</span>
            </span>
            <span className="text-[#661760]">|</span>
            <a
              href="https://wa.me/923008429100"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#FFC700] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#FFC700]" />
              <span>WhatsApp Styling: {settings.whatsappNumber || '+92 300 8429100'}</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('track_order')}
              className="hover:text-[#FFC700] font-medium transition-colors cursor-pointer"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="hover:text-[#FFC700] font-medium transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="hover:text-[#FFC700] font-medium transition-colors cursor-pointer"
            >
              Contact
            </button>

            <select
              value={currentCurrency.code}
              onChange={(e) => {
                const curr = currencies.find((c) => c.code === e.target.value);
                if (curr) onSelectCurrency(curr);
              }}
              aria-label="Select currency"
              className="bg-[#2D052B] border border-[#661760] rounded-md px-2 py-0.5 text-[11px] font-semibold text-white focus:outline-hidden focus:border-[#FFC700] cursor-pointer"
            >
              {currencies
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#240323] text-white">
                    {c.code} ({c.symbol.trim()})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Sticky Brand & Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Button + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-white hover:bg-[#3D083B] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            data-testid="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex flex-col items-start text-left cursor-pointer group"
          >
            <span
              className="text-xl sm:text-2xl font-extrabold tracking-[0.14em] text-white group-hover:text-[#FFC700] transition-colors"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {settings.logoText || 'ZARIYA'}
            </span>
            <span className="text-[9px] tracking-[0.22em] uppercase text-[#FFC700] font-semibold -mt-0.5">
              Pakistani Fashion House
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#F9EEF8]">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`py-2 transition-colors cursor-pointer ${
              storefrontView === 'home'
                ? 'text-[#FFC700] border-b-2 border-[#FFC700]'
                : 'hover:text-[#FFC700]'
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => onNavigate('shop', 'all')}
            className={`py-2 transition-colors cursor-pointer ${
              storefrontView === 'shop'
                ? 'text-[#FFC700] border-b-2 border-[#FFC700]'
                : 'hover:text-[#FFC700]'
            }`}
          >
            Shop
          </button>

          {/* All Collections Mega Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCollectionsDropdownOpen(true)}
            onMouseLeave={() => setCollectionsDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => onNavigate('collections')}
              className={`py-2 inline-flex items-center gap-1 transition-colors cursor-pointer ${
                storefrontView === 'collections'
                  ? 'text-[#FFC700] border-b-2 border-[#FFC700]'
                  : 'hover:text-[#FFC700]'
              }`}
            >
              <span>All Collections</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {collectionsDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-[460px] z-50">
                <div className="bg-[#31062F] rounded-2xl shadow-2xl border border-[#7A1870] p-5 grid grid-cols-2 gap-2.5 text-white">
                  <div className="col-span-2 flex items-center justify-between border-b border-[#5E1659] pb-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC700]">
                      Shop By Fashion Category
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCollectionsDropdownOpen(false);
                        onNavigate('collections');
                      }}
                      className="text-[11px] font-semibold text-[#F3DDF0] hover:text-[#FFC700] underline cursor-pointer"
                    >
                      View All Collections →
                    </button>
                  </div>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCollectionsDropdownOpen(false);
                        onNavigate('shop', cat.id);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#490B45] text-left transition-colors cursor-pointer"
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-9 h-9 rounded-lg object-cover border border-[#7A1870] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-[#E3C4DF] truncate">
                          {cat.itemCount || 4}+ Styles
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            data-testid="nav-sale-btn"
            onClick={() => onNavigate('sale')}
            className={`py-1.5 px-3.5 rounded-full inline-flex items-center gap-1.5 font-extrabold transition-all cursor-pointer shadow-xs ${
              storefrontView === 'sale'
                ? 'bg-[#FFE066] text-[#240323] ring-2 ring-[#FF7A00]'
                : 'bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] hover:brightness-110'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>Sale</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('new_arrivals')}
            className={`py-2 transition-colors cursor-pointer ${
              storefrontView === 'new_arrivals'
                ? 'text-[#FFC700] border-b-2 border-[#FFC700]'
                : 'hover:text-[#FFC700]'
            }`}
          >
            New Arrivals
          </button>

          <button
            type="button"
            onClick={() => onNavigate('best_sellers')}
            className={`py-2 transition-colors cursor-pointer ${
              storefrontView === 'best_sellers'
                ? 'text-[#FFC700] border-b-2 border-[#FFC700]'
                : 'hover:text-[#FFC700]'
            }`}
          >
            Best Sellers
          </button>
        </nav>

        {/* Right: Search, Wishlist, Account, Admin, Bag */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Desktop Search Pill */}
          <form onSubmit={handleSearchSubmit} className="hidden xl:flex relative w-52">
            <Search className="w-3.5 h-3.5 text-[#D8B6D5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="header-search-input"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search lawn, pret, silk..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#360734] border border-[#6B1A64] text-xs text-white placeholder-[#D8B6D5] focus:outline-hidden focus:border-[#FFC700]"
            />
          </form>

          {/* Search Toggle (Tablet/Mobile) */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="xl:hidden p-2 rounded-full text-white hover:bg-[#3D083B] transition-colors cursor-pointer"
            aria-label="Toggle product search"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            data-testid="header-wishlist-btn"
            onClick={() => onNavigate('wishlist')}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              storefrontView === 'wishlist'
                ? 'bg-[#490B45] text-[#FFC700]'
                : 'text-white hover:bg-[#3D083B] hover:text-[#FFC700]'
            }`}
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF9900] text-[#240323] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* My Account */}
          <button
            type="button"
            data-testid="header-account-btn"
            onClick={onOpenAccount}
            className="p-2 rounded-full text-white hover:bg-[#3D083B] hover:text-[#FFC700] transition-colors cursor-pointer"
            aria-label="My Account"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Shopping Bag */}
          <button
            type="button"
            data-testid="header-cart-btn"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold transition-all cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tabular-nums font-extrabold">{cartItemCount}</span>
            {cartSubtotalMinorUnits > 0 && (
              <span className="hidden md:inline border-l border-[#240323]/25 pl-2 tabular-nums">
                {formatMinorUnits(cartSubtotalMinorUnits, currentCurrency)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Expandable Search Bar */}
      {searchOpen && (
        <div className="xl:hidden border-t border-[#5E1659] bg-[#31062F] px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative grow">
              <Search className="w-4 h-4 text-[#D8B6D5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search embroidered lawn, organza, pret..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-[#240323] border border-[#6B1A64] text-xs text-white placeholder-[#D8B6D5] focus:outline-hidden focus:border-[#FFC700]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#5E1659] bg-[#240323] px-4 py-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {[
              { label: 'Home', view: 'home' as StorefrontNavView },
              { label: 'Shop All', view: 'shop' as StorefrontNavView },
              { label: 'SALE UP TO 70%', view: 'sale' as StorefrontNavView, highlight: true },
              { label: 'New Arrivals', view: 'new_arrivals' as StorefrontNavView },
              { label: 'Best Sellers', view: 'best_sellers' as StorefrontNavView },
              { label: 'All Collections', view: 'collections' as StorefrontNavView },
              { label: `Wishlist (${wishlistCount})`, view: 'wishlist' as StorefrontNavView },
              { label: 'Track Order', view: 'track_order' as StorefrontNavView },
              { label: 'About Us', view: 'about' as StorefrontNavView },
              { label: 'Contact Us', view: 'contact' as StorefrontNavView },
            ].map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(item.view, item.view === 'shop' ? 'all' : undefined);
                }}
                className={`py-2.5 px-3 rounded-xl text-left transition-colors cursor-pointer ${
                  item.highlight
                    ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] font-extrabold'
                    : storefrontView === item.view
                    ? 'bg-[#4E0C47] text-[#FFC700] border border-[#FFC700]/50'
                    : 'bg-[#340732] border border-[#661760] text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#5E1659] flex items-center justify-end">
            <select
              value={currentCurrency.code}
              onChange={(e) => {
                const curr = currencies.find((c) => c.code === e.target.value);
                if (curr) onSelectCurrency(curr);
              }}
              className="bg-[#340732] border border-[#661760] text-white rounded-lg px-2.5 py-1 text-xs font-semibold"
            >
              {currencies
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#240323] text-white">
                    {c.code} ({c.symbol.trim()})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
