import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  Category,
  Country,
  Currency,
  ImmutableOrderSnapshot,
  Product,
  ProductVariant,
  StoreSettings,
} from '../../types/ecommerce';
import { ProductCard } from './ProductCard';
import { StorefrontNavView } from '../common/Header';

interface StoreInfoPagesProps {
  view: StorefrontNavView;
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  orders: ImmutableOrderSnapshot[];
  wishlistIds: string[];
  currentCountry: Country;
  currentCurrency: Currency;
  onToggleWishlist: (productId: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onNavigate: (view: StorefrontNavView, categoryId?: string) => void;
}

export const StoreInfoPages: React.FC<StoreInfoPagesProps> = ({
  view,
  settings,
  categories,
  products,
  orders,
  wishlistIds,
  currentCountry,
  currentCurrency,
  onToggleWishlist,
  onViewProduct,
  onAddToCart,
  onNavigate,
}) => {
  // Order tracking local state
  const [trackQuery, setTrackQuery] = useState(orders[0]?.orderNumber || '');
  const [trackedOrder, setTrackedOrder] = useState<ImmutableOrderSnapshot | null>(
    orders[0] || null
  );
  const [trackNotFound, setTrackNotFound] = useState(false);

  // Contact form local state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+92 300 ');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = trackQuery.trim().toLowerCase();
    const match = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === q ||
        (o.shipping.trackingNumber || '').toLowerCase() === q ||
        o.customer.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
    );
    if (match) {
      setTrackedOrder(match);
      setTrackNotFound(false);
    } else {
      setTrackedOrder(null);
      setTrackNotFound(true);
    }
  };

  const bannerGradientStyle = {
    background:
      'radial-gradient(circle at 20% 25%, rgba(255, 145, 0, 0.24), transparent 55%), linear-gradient(120deg, #5C0E54 0%, #3A0738 55%, #240323 100%)',
  };

  // 1. ALL COLLECTIONS PAGE
  if (view === 'collections') {
    return (
      <div className="bg-[#240323] text-white min-h-screen pb-16">
        <div className="border-b border-[#661760]" style={bannerGradientStyle}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              All ZARIYA Collections
            </h1>
            <p className="text-xs sm:text-sm text-[#E9CEE6] max-w-2xl">
              Explore all 10 curated Pakistani women’s wear categories — from daily embroidered lawn 2-piece &amp; 3-piece suits to chiffon party wear and winter khaddar.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigate('shop', cat.id)}
              className="group bg-[#340732] rounded-3xl border border-[#681962] hover:border-[#FFC700] overflow-hidden text-left shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#4A0D46] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h2
                    className="text-xl font-bold text-white group-hover:text-[#FFC700]"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {cat.name}
                  </h2>
                  <p className="text-xs text-[#E3C4DF] mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFC700] pt-2">
                  <span>Explore {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. WISHLIST PAGE
  if (view === 'wishlist') {
    const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
    return (
      <div className="bg-[#240323] text-white min-h-screen pb-16">
        <div className="border-b border-[#661760]" style={bannerGradientStyle}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <Heart className="w-7 h-7 text-[#FFC700] fill-current" />
              <span>My Wishlist ({wishlistedProducts.length})</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#E9CEE6]">
              Your saved Pakistani outfits ready to add to bag while Mega Sale discounts last.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          {wishlistedProducts.length === 0 ? (
            <div className="bg-[#340732] rounded-3xl border border-[#681962] p-12 text-center max-w-lg mx-auto space-y-4">
              <Heart className="w-10 h-10 text-[#FFC700] mx-auto" />
              <h2 className="text-xl font-bold text-white">Your Wishlist is Empty</h2>
              <p className="text-xs text-[#E3C4DF]">
                Tap the heart icon on any suit or kurti to save your favourite looks here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('sale')}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
              >
                Explore Sale Outfits
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlistedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  currentCountry={currentCountry}
                  currentCurrency={currentCurrency}
                  isWishlisted
                  onToggleWishlist={onToggleWishlist}
                  onViewProduct={onViewProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. ORDER TRACKING PAGE
  if (view === 'track_order') {
    return (
      <div className="bg-[#240323] text-white min-h-screen pb-16">
        <div className="border-b border-[#661760]" style={bannerGradientStyle}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <h1
              className="text-3xl font-extrabold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Track Your ZARIYA Parcel
            </h1>
            <p className="text-xs sm:text-sm text-[#E9CEE6]">
              Enter your ZARIYA order number (e.g. {orders[0]?.orderNumber || 'ZAR-PK-88412'}) or TCS tracking ID.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative grow">
              <Search className="w-4 h-4 text-[#D8B6D5] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Order # or TCS/Leopards Tracking Number..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#340732] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs font-semibold focus:outline-hidden focus:border-[#FFC700]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
            >
              Track Parcel
            </button>
          </form>

          {trackNotFound && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
              No matching parcel found. Please double-check your Order # or message us on WhatsApp at +92 300 8429100.
            </div>
          )}

          {trackedOrder && (
            <div className="bg-[#340732] rounded-3xl border border-[#681962] p-6 space-y-5 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5E1659] pb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFC700]">
                    Order #{trackedOrder.orderNumber}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {trackedOrder.customer.fullName} — {trackedOrder.shippingAddress.city},{' '}
                    {trackedOrder.shippingAddress.stateOrProvince}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold uppercase self-start">
                  {trackedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659]">
                  <div className="text-[#D8B6D5]">Courier Service</div>
                  <div className="font-bold text-white mt-0.5">
                    {trackedOrder.shipping.carrier}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659]">
                  <div className="text-[#D8B6D5]">Tracking Number</div>
                  <div className="font-bold text-[#FFC700] tabular-nums mt-0.5">
                    {trackedOrder.shipping.trackingNumber || 'Preparing Dispatch'}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#240323] border border-[#5E1659]">
                  <div className="text-[#D8B6D5]">Order Total</div>
                  <div className="font-bold text-white tabular-nums mt-0.5">
                    {trackedOrder.financials.formattedTotal}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC700]">
                  Dispatch Timeline
                </h3>
                {trackedOrder.timeline.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#240323] border border-[#5E1659] text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">{t.status}</div>
                      <div className="text-[#E3C4DF]">{t.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. ABOUT US PAGE
  if (view === 'about') {
    return (
      <div className="bg-[#240323] text-white min-h-screen pb-16">
        <div className="border-b border-[#661760]" style={bannerGradientStyle}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              About ZARIYA — Pakistan’s Modern Women’s Fashion House
            </h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
          <div className="rounded-3xl overflow-hidden border border-[#FFC700]/40 shadow-xl">
            <img
              src="/src/assets/images/pk_editorial_atelier_1794509750649.jpg"
              alt="ZARIYA Lahore Atelier"
              className="w-full h-72 sm:h-96 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-[#E9CEE6] leading-relaxed">
            <div className="p-6 rounded-2xl bg-[#340732] border border-[#681962] space-y-2">
              <Sparkles className="w-5 h-5 text-[#FFC700]" />
              <h2 className="text-lg font-bold text-white">Our Craft &amp; Fabrics</h2>
              <p>
                Headquartered in Gulberg III, Lahore, ZARIYA collaborates with heritage weavers in Faisalabad and master embroidery karigars to create breathable 90/70 summer lawn, soft winter khaddar, and luminous organza and chiffon ensembles.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#340732] border border-[#681962] space-y-2">
              <Truck className="w-5 h-5 text-[#FFC700]" />
              <h2 className="text-lg font-bold text-white">Built For Pakistani Shoppers</h2>
              <p>
                We make online shopping effortless across Pakistan with honest PKR pricing, Cash on Delivery, Free Delivery on orders over Rs. 3,000, verified size charts, and live WhatsApp stylist support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. CONTACT US PAGE
  if (view === 'contact') {
    return (
      <div className="bg-[#240323] text-white min-h-screen pb-16">
        <div className="border-b border-[#661760]" style={bannerGradientStyle}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Contact ZARIYA Customer Care
            </h1>
            <p className="text-xs sm:text-sm text-[#E9CEE6]">
              Questions about sizes, custom stitching, order tracking, or exchanges? Reach our Lahore team anytime.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#340732] border border-[#681962] space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FFC700] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Lahore Flagship Atelier</div>
                  <div className="text-[#E3C4DF]">{settings.supportAddress}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#FFC700] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Customer Support Helpline</div>
                  <div className="text-[#E3C4DF]">{settings.contactPhone} (Mon–Sat, 10am–8pm)</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#FFC700] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Email Care</div>
                  <div className="text-[#E3C4DF]">{settings.contactEmail}</div>
                </div>
              </div>
              <a
                href="https://wa.me/923008429100"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp (+92 300 8429100)</span>
              </a>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setContactSent(true);
            }}
            className="md:col-span-7 p-6 rounded-2xl bg-[#340732] border border-[#681962] space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Send Us a Message</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your Full Name *"
                className="px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
              />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email Address *"
                className="px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
              />
            </div>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+92 3XX XXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
            />
            <textarea
              rows={4}
              required
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              placeholder="How can we help with your order or outfit sizing?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#240323] border border-[#681962] text-white placeholder-[#D8B6D5] text-xs focus:outline-hidden focus:border-[#FFC700]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFC700] text-[#240323] text-xs font-extrabold cursor-pointer"
            >
              Send Message
            </button>
            {contactSent && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-semibold">
                Thank you! Our Lahore Customer Care desk will reply within 2 business hours.
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // 6. POLICY PAGES (Shipping / Return & Exchange / Privacy)
  const policyConfig =
    view === 'shipping_policy'
      ? {
          icon: Truck,
          title: 'Shipping & Delivery Policy (Pakistan)',
          points: [
            {
              h: 'Free Nationwide Delivery Above Rs. 3,000',
              p: 'Orders of Rs. 3,000 or more qualify for completely FREE standard delivery all across Pakistan via TCS and Leopards Courier.',
            },
            {
              h: 'Flat Delivery Charges',
              p: 'For orders under Rs. 3,000, a flat courier charge of Rs. 200 applies nationwide. Express air dispatch is available for Rs. 350, and Lahore Same-Day Rider for Rs. 400.',
            },
            {
              h: 'Delivery Timelines',
              p: 'Lahore same-day (orders before 3 PM). Karachi, Islamabad, Rawalpindi, Faisalabad, and Multan: 2–3 business days. Other cities across Punjab, Sindh, KPK, and Balochistan: 3–5 business days.',
            },
          ],
        }
      : view === 'return_policy'
      ? {
          icon: RotateCcw,
          title: 'Return & Exchange Policy',
          points: [
            {
              h: '7-Day Easy Exchange Window',
              p: 'You may request a size exchange or store credit within 7 days of receiving your parcel.',
            },
            {
              h: 'Condition of Returned Outfits',
              p: 'Items must be unworn, unwashed, unaltered, with all original ZARIYA tags and packaging intact. Unstitched fabrics must remain uncut.',
            },
            {
              h: 'How to Request an Exchange',
              p: 'Share your Order Number and photos on WhatsApp (+92 300 8429100) or email care@zariya.pk. Our courier team will arrange pickup or size replacement promptly.',
            },
          ],
        }
      : {
          icon: ShieldCheck,
          title: 'Privacy Policy',
          points: [
            {
              h: 'Customer Data Protection',
              p: 'ZARIYA collects only the contact, delivery address, and order details strictly needed to fulfill your Pakistani fashion orders and send parcel tracking alerts.',
            },
            {
              h: 'Zero Card Storage',
              p: 'All online card and mobile wallet transactions are tokenized using TLS encryption. We never store your full debit/credit card numbers or PINs.',
            },
            {
              h: 'Your Rights',
              p: 'You can unsubscribe from Sale alerts at any time or contact care@zariya.pk to update or remove your account records.',
            },
          ],
        };

  const PolicyIcon = policyConfig.icon;
  return (
    <div className="bg-[#240323] text-white min-h-screen pb-16">
      <div className="border-b border-[#661760]" style={bannerGradientStyle}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9CEE6] hover:text-[#FFC700] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <h1
            className="text-3xl font-extrabold text-white flex items-center gap-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <PolicyIcon className="w-7 h-7 text-[#FFC700]" />
            <span>{policyConfig.title}</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-4">
        {policyConfig.points.map((pt) => (
          <div
            key={pt.h}
            className="p-6 rounded-2xl bg-[#340732] border border-[#681962] space-y-2"
          >
            <h2 className="text-base font-bold text-[#FFE066]">{pt.h}</h2>
            <p className="text-xs sm:text-sm text-[#E9CEE6] leading-relaxed">{pt.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
