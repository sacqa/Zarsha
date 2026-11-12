import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Country, Currency, StoreSettings } from '../../types/ecommerce';
import { storeDb } from '../../services/store-db';
import { StorefrontNavView } from './Header';

interface FooterProps {
  settings: StoreSettings;
  currentCountry: Country;
  currentCurrency: Currency;
  countries: Country[];
  currencies: Currency[];
  onSelectCountry: (country: Country) => void;
  onSelectCurrency: (currency: Currency) => void;
  onOpenBlog: () => void;
  onOpenAdmin: () => void;
  onOpenAccount: () => void;
  onNavigate: (view: StorefrontNavView, categoryId?: string) => void;
  onSubscribed?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  currentCurrency,
  currencies,
  onSelectCurrency,
  onOpenBlog,
  onOpenAdmin,
  onOpenAccount,
  onNavigate,
  onSubscribed,
}) => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const adminClickCountRef = useRef(0);
  const adminClickResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (adminClickResetTimerRef.current !== null) {
        window.clearTimeout(adminClickResetTimerRef.current);
      }
    };
  }, []);

  const handleSecretAdminClick = () => {
    if (adminClickResetTimerRef.current !== null) {
      window.clearTimeout(adminClickResetTimerRef.current);
    }

    adminClickCountRef.current += 1;
    if (adminClickCountRef.current >= 3) {
      adminClickCountRef.current = 0;
      adminClickResetTimerRef.current = null;
      onOpenAdmin();
      return;
    }

    adminClickResetTimerRef.current = window.setTimeout(() => {
      adminClickCountRef.current = 0;
      adminClickResetTimerRef.current = null;
    }, 2500);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storeDb.subscribeToNewsletter(email, true);
    setFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success) {
      setEmail('');
      onSubscribed?.();
    }
  };

  return (
    <footer
      data-testid="zariya-footer"
      className="bg-[#180117] border-t border-[#661760] text-white"
    >
      {/* Top Festive Newsletter Strip */}
      <div className="border-b border-[#5E1659] bg-gradient-to-r from-[#380736] via-[#540D4E] to-[#380736]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#FFC700]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Join ZARIYA Style Club</span>
            </div>
            <h3
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Get Extra 15% Off &amp; First Access to Lawn &amp; Festive Sales
            </h3>
            <p className="text-xs text-[#E9CEE6]">
              Sign up for seasonal drops, flash sale alerts across Pakistan, and exclusive promo code{' '}
              <strong className="text-[#FFC700]">ZARIYA15</strong>.
            </p>
          </div>

          <form onSubmit={handleSubscribe} noValidate className="w-full lg:max-w-md space-y-2">
            <div className="flex items-center bg-[#240323] rounded-full border border-[#7A1870] p-1.5 shadow-md">
              <input
                type="email"
                data-testid="footer-newsletter-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder="Enter your email address..."
                className="grow px-4 py-2 text-xs bg-transparent text-white placeholder-[#D8B6D5] focus:outline-hidden"
              />
              <button
                type="submit"
                data-testid="footer-newsletter-submit"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] hover:brightness-105 text-[#240323] text-xs font-extrabold cursor-pointer transition-all shrink-0"
              >
                Subscribe
              </button>
            </div>
            {feedback && (
              <div
                className={`text-[11px] font-medium flex items-center gap-1.5 ${
                  feedback.type === 'success' ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 text-xs">
        {/* Brand Column */}
        <div className="col-span-2 lg:col-span-4 space-y-4">
          <div>
            <div
              className="text-2xl font-extrabold tracking-[0.14em] text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {settings.logoText || 'ZARIYA'}
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#FFC700] font-semibold">
              Pakistani Women’s Clothing House
            </div>
          </div>

          <p className="text-xs text-[#E3C4DF] leading-relaxed max-w-sm">
            Celebrating timeless Pakistani craft—from breathable 3-piece printed &amp; embroidered lawn to hand-embellished chiffon formals, delivered nationwide with Cash on Delivery.
          </p>

          <div className="space-y-1.5 text-[#E3C4DF]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#FFC700] shrink-0" />
              <span>{settings.supportAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#FFC700] shrink-0" />
              <span>{settings.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#FFC700] shrink-0" />
              <span>{settings.contactEmail}</span>
            </div>
            <a
              href="https://wa.me/923008429100"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-emerald-300 font-bold hover:underline pt-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support ({settings.whatsappNumber || '+92 300 8429100'})</span>
            </a>
          </div>
        </div>

        {/* Shop Collections */}
        <div className="col-span-1 lg:col-span-2 space-y-3">
          <h4 className="font-bold text-[#FFC700] uppercase tracking-wider text-[11px]">
            Shop Fashion
          </h4>
          <ul className="space-y-2 text-[#E3C4DF]">
            {[
              { label: 'Sale — Up to 70% Off', view: 'sale' as StorefrontNavView },
              { label: 'New Arrivals', view: 'new_arrivals' as StorefrontNavView },
              { label: 'Best Sellers', view: 'best_sellers' as StorefrontNavView },
              { label: 'All Collections', view: 'collections' as StorefrontNavView },
              { label: 'Shop All Suits', view: 'shop' as StorefrontNavView },
              { label: 'Style Journal', action: onOpenBlog },
            ].map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => (item.action ? item.action() : onNavigate(item.view!))}
                  className="hover:text-[#FFC700] transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Care */}
        <div className="col-span-1 lg:col-span-3 space-y-3">
          <h4 className="font-bold text-[#FFC700] uppercase tracking-wider text-[11px]">
            Customer Care
          </h4>
          <ul className="space-y-2 text-[#E3C4DF]">
            {[
              { label: 'My Account & Orders', action: onOpenAccount },
              { label: 'My Wishlist', view: 'wishlist' as StorefrontNavView },
              { label: 'Track Your Order', view: 'track_order' as StorefrontNavView },
              { label: 'Shipping Policy (COD & Express)', view: 'shipping_policy' as StorefrontNavView },
              { label: 'Return & Exchange Policy', view: 'return_policy' as StorefrontNavView },
              { label: 'Privacy Policy', view: 'privacy_policy' as StorefrontNavView },
            ].map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => (item.action ? item.action() : onNavigate(item.view!))}
                  className="hover:text-[#FFC700] transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Company & Payments */}
        <div className="col-span-2 lg:col-span-3 space-y-3">
          <h4 className="font-bold text-[#FFC700] uppercase tracking-wider text-[11px]">
            Company &amp; Payments
          </h4>
          <ul className="space-y-2 text-[#E3C4DF]">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-[#FFC700] transition-colors cursor-pointer"
              >
                About ZARIYA
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="hover:text-[#FFC700] transition-colors cursor-pointer"
              >
                Contact Us &amp; Lahore Flagship
              </button>
            </li>
          </ul>

          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#FFC700]">
              Accepted Across Pakistan
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
              {['Cash on Delivery', 'Bank IBFT', 'JazzCash', 'Easypaisa', 'Visa / Mastercard'].map(
                (pm) => (
                  <span
                    key={pm}
                    className="px-2 py-1 rounded-md bg-[#2E062D] border border-[#661760] text-[#F9EEF8]"
                  >
                    {pm}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-[#4A0F45] bg-[#120112]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#D8B6D5]">
          <div>
            © {new Date().getFullYear()} {settings.storeName}.{' '}
            <span
              data-testid="footer-admin-trigger"
              onClick={handleSecretAdminClick}
              className="select-none cursor-default"
            >
              All rights reserved. Crafted in Pakistan.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Currency:</span>
            <select
              value={currentCurrency.code}
              onChange={(e) => {
                const c = currencies.find((curr) => curr.code === e.target.value);
                if (c) onSelectCurrency(c);
              }}
              aria-label="Footer currency selector"
              className="bg-[#2D052B] border border-[#661760] rounded-md px-2 py-1 text-[11px] font-semibold text-white"
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
    </footer>
  );
};
