import { ImmutableOrderSnapshot } from '../types/ecommerce';

export interface TrackedVisitorSession {
  sessionId: string;
  visitorId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  trafficSource: 'Direct' | 'Organic Search' | 'Social' | 'Referral' | 'Campaign';
  countryCode: string;
  countryName: string;
  city: string;
  lat: number;
  lng: number;
  currentPage: string;
  cartItemCount: number;
  cartValueMinorUnits: number;
  inCheckout: boolean;
  viewedProductIds: string[];
  addedToCart: boolean;
  reachedCheckout: boolean;
  completedPurchase: boolean;
  linkedOrderId?: string;
  startedAt: string;
  lastSeenAt: string;
  isOnline: boolean;
}

export interface TrackedAnalyticsEvent {
  eventId: string;
  type:
    | 'session_start'
    | 'page_view'
    | 'product_view'
    | 'add_to_cart'
    | 'cart_updated'
    | 'checkout_started'
    | 'purchase_completed'
    | 'heartbeat'
    | 'session_leave';
  sessionId: string;
  visitorId: string;
  timestamp: string;
  countryCode: string;
  countryName: string;
  city: string;
  lat: number;
  lng: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  trafficSource: 'Direct' | 'Organic Search' | 'Social' | 'Referral' | 'Campaign';
  pagePath?: string;
  productId?: string;
  productName?: string;
  variantTitle?: string;
  quantity?: number;
  amountMinorUnits?: number;
  orderId?: string;
  orderNumber?: string;
}

export interface LiveAnalyticsSnapshot {
  timestamp: string;
  liveCounters: {
    activeVisitorsRightNow: number;
    activeCartsRightNow: number;
    checkingOutRightNow: number;
    purchasedRightNow: number;
  };
  sessions: TrackedVisitorSession[];
  recentEvents: TrackedAnalyticsEvent[];
}

const STORAGE_KEYS = {
  VISITOR_ID: 'zariya_analytics_visitor_id',
  SESSION_ID: 'zariya_analytics_session_id',
  SESSIONS_HISTORY: 'zariya_analytics_sessions_v1',
  EVENTS_HISTORY: 'zariya_analytics_events_v1',
};

export const COUNTRY_GEO_COORDS: Record<
  string,
  { countryName: string; city: string; lat: number; lng: number }
> = {
  PK: { countryName: 'Pakistan', city: 'Lahore', lat: 31.5204, lng: 74.3587 },
  AE: { countryName: 'United Arab Emirates', city: 'Dubai', lat: 25.2048, lng: 55.2708 },
  GB: { countryName: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278 },
  US: { countryName: 'United States', city: 'New York', lat: 40.7128, lng: -74.006 },
  CA: { countryName: 'Canada', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
  SA: { countryName: 'Saudi Arabia', city: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  QA: { countryName: 'Qatar', city: 'Doha', lat: 25.2854, lng: 51.531 },
};

export function resolveGeoForCountry(
  countryCode = 'PK',
  cityOverride?: string
): { countryCode: string; countryName: string; city: string; lat: number; lng: number } {
  const code = (countryCode || 'PK').toUpperCase();
  const base = COUNTRY_GEO_COORDS[code] || COUNTRY_GEO_COORDS.PK;
  if (code === 'PK' && cityOverride) {
    const lower = cityOverride.toLowerCase();
    if (lower.includes('karachi')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Karachi', lat: 24.8607, lng: 67.0011 };
    }
    if (lower.includes('islamabad')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Islamabad', lat: 33.6844, lng: 73.0479 };
    }
    if (lower.includes('rawalpindi')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Rawalpindi', lat: 33.5651, lng: 73.0169 };
    }
    if (lower.includes('faisalabad')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Faisalabad', lat: 31.4504, lng: 73.135 };
    }
    if (lower.includes('multan')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Multan', lat: 30.1575, lng: 71.5249 };
    }
    if (lower.includes('peshawar')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Peshawar', lat: 34.0151, lng: 71.5249 };
    }
    if (lower.includes('quetta')) {
      return { countryCode: 'PK', countryName: 'Pakistan', city: 'Quetta', lat: 30.1798, lng: 66.975 };
    }
  }
  return {
    countryCode: code,
    countryName: base.countryName,
    city: cityOverride || base.city,
    lat: base.lat,
    lng: base.lng,
  };
}

export function detectVisitorDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    return 'mobile';
  }
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth >= 768 && window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export function detectTrafficSource(): 'Direct' | 'Organic Search' | 'Social' | 'Referral' | 'Campaign' {
  if (typeof window === 'undefined') return 'Direct';
  const params = new URLSearchParams(window.location.search);
  if (params.get('utm_source') || params.get('utm_campaign') || params.get('utm_medium')) {
    return 'Campaign';
  }
  const ref = (document.referrer || '').toLowerCase();
  if (!ref || ref.includes(window.location.hostname)) {
    return 'Direct';
  }
  if (ref.includes('google.') || ref.includes('bing.') || ref.includes('duckduckgo.') || ref.includes('yahoo.')) {
    return 'Organic Search';
  }
  if (
    ref.includes('instagram.') ||
    ref.includes('facebook.') ||
    ref.includes('tiktok.') ||
    ref.includes('twitter.') ||
    ref.includes('x.com') ||
    ref.includes('linkedin.') ||
    ref.includes('youtube.')
  ) {
    return 'Social';
  }
  return 'Referral';
}

class StorefrontAnalyticsTracker {
  private visitorId = '';
  private sessionId = '';
  private currentCountryCode = 'PK';
  private currentCartCount = 0;
  private currentCartValueMinor = 0;
  private currentInCheckout = false;
  private currentPagePath = '/';
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners = new Set<(snapshot: LiveAnalyticsSnapshot) => void>();
  private latestServerSnapshot: LiveAnalyticsSnapshot | null = null;
  private eventSource: EventSource | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initIdentifiers();
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('zariya_realtime_analytics');
          this.broadcastChannel.onmessage = (ev) => {
            if (ev.data && ev.data.type === 'ANALYTICS_UPDATED') {
              this.notifyListeners();
            }
          };
        }
      } catch {
        // Ignore if BroadcastChannel is restricted
      }
    }
  }

  private initIdentifiers() {
    try {
      let vid = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
      if (!vid) {
        vid = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem(STORAGE_KEYS.VISITOR_ID, vid);
      }
      this.visitorId = vid;

      let sid = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
      if (!sid) {
        sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sid);
      }
      this.sessionId = sid;
    } catch {
      this.visitorId = 'vis_fallback';
      this.sessionId = 'sess_fallback';
    }
  }

  public getStoredSessions(): TrackedVisitorSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredSessions(sessions: TrackedVisitorSession[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS_HISTORY, JSON.stringify(sessions.slice(0, 500)));
    } catch {
      // Ignore quota errors
    }
  }

  public getStoredEvents(): TrackedAnalyticsEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVENTS_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredEvents(events: TrackedAnalyticsEvent[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS_HISTORY, JSON.stringify(events.slice(0, 500)));
    } catch {
      // Ignore quota errors
    }
  }

  public syncWithDatabaseOrders(orders: ImmutableOrderSnapshot[]): TrackedVisitorSession[] {
    const sessions = this.getStoredSessions();
    const activeOrders = orders.filter((o) => !o.isDraft && o.status !== 'cancelled');
    const validOrderIds = new Set(activeOrders.map((o) => o.orderId));

    const cleaned = sessions.filter((s) => !s.linkedOrderId || validOrderIds.has(s.linkedOrderId));
    let changed = cleaned.length !== sessions.length;

    activeOrders.forEach((order, index) => {
      const alreadyLinked = cleaned.some(
        (s) => s.linkedOrderId === order.orderId || s.sessionId === `ord_sess_${order.orderId}`
      );
      if (!alreadyLinked) {
        const geo = resolveGeoForCountry(
          order.shippingAddress.countryCode || 'PK',
          order.shippingAddress.city
        );
        const sources: TrackedVisitorSession['trafficSource'][] = [
          'Direct',
          'Organic Search',
          'Social',
          'Campaign',
          'Referral',
        ];
        const devices: TrackedVisitorSession['deviceType'][] = ['desktop', 'mobile', 'tablet'];
        const source =
          order.tags?.some((t) => t.toLowerCase().includes('vip') || t.toLowerCase().includes('sale'))
            ? 'Campaign'
            : sources[index % sources.length];
        const device = devices[index % devices.length];

        cleaned.push({
          sessionId: `ord_sess_${order.orderId}`,
          visitorId: `cust_${order.customer.email.toLowerCase()}`,
          deviceType: device,
          trafficSource: source,
          countryCode: geo.countryCode,
          countryName: geo.countryName,
          city: geo.city,
          lat: geo.lat,
          lng: geo.lng,
          currentPage: '/order-confirmation',
          cartItemCount: 0,
          cartValueMinorUnits: order.financials.totalAmountMinorUnits,
          inCheckout: false,
          viewedProductIds: order.items.map((i) => i.productId),
          addedToCart: true,
          reachedCheckout: true,
          completedPurchase: true,
          linkedOrderId: order.orderId,
          startedAt: order.orderDate,
          lastSeenAt: order.orderDate,
          isOnline: false,
        });
        changed = true;
      }
    });

    if (changed) {
      this.saveStoredSessions(cleaned);
    }
    return cleaned;
  }

  public trackEvent(params: {
    type: TrackedAnalyticsEvent['type'];
    countryCode?: string;
    city?: string;
    pagePath?: string;
    productId?: string;
    productName?: string;
    variantTitle?: string;
    quantity?: number;
    amountMinorUnits?: number;
    cartItemCount?: number;
    cartValueMinorUnits?: number;
    inCheckout?: boolean;
    orderId?: string;
    orderNumber?: string;
  }) {
    if (typeof window === 'undefined') return;
    if (!this.sessionId || !this.visitorId) {
      this.initIdentifiers();
    }

    if (params.countryCode) this.currentCountryCode = params.countryCode;
    if (typeof params.cartItemCount === 'number') this.currentCartCount = params.cartItemCount;
    if (typeof params.cartValueMinorUnits === 'number') this.currentCartValueMinor = params.cartValueMinorUnits;
    if (typeof params.inCheckout === 'boolean') this.currentInCheckout = params.inCheckout;
    if (params.pagePath) this.currentPagePath = params.pagePath;

    const geo = resolveGeoForCountry(this.currentCountryCode, params.city);
    const deviceType = detectVisitorDeviceType();
    const trafficSource = detectTrafficSource();
    const nowIso = new Date().toISOString();
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const sessions = this.getStoredSessions();
    const existingIdx = sessions.findIndex((s) => s.sessionId === this.sessionId);
    const prev = existingIdx >= 0 ? sessions[existingIdx] : null;
    const viewedSet = new Set<string>(prev?.viewedProductIds || []);
    if (params.productId) viewedSet.add(params.productId);

    const updatedSession: TrackedVisitorSession = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      deviceType,
      trafficSource: prev?.trafficSource || trafficSource,
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      currentPage: this.currentPagePath,
      cartItemCount: this.currentCartCount,
      cartValueMinorUnits: this.currentCartValueMinor,
      inCheckout: this.currentInCheckout,
      viewedProductIds: Array.from(viewedSet),
      addedToCart:
        Boolean(prev?.addedToCart) || params.type === 'add_to_cart' || this.currentCartCount > 0,
      reachedCheckout:
        Boolean(prev?.reachedCheckout) || params.type === 'checkout_started' || this.currentInCheckout,
      completedPurchase:
        Boolean(prev?.completedPurchase) || params.type === 'purchase_completed',
      linkedOrderId: params.orderId || prev?.linkedOrderId,
      startedAt: prev?.startedAt || nowIso,
      lastSeenAt: nowIso,
      isOnline: params.type !== 'session_leave',
    };

    if (existingIdx >= 0) {
      sessions[existingIdx] = updatedSession;
    } else {
      sessions.unshift(updatedSession);
    }
    this.saveStoredSessions(sessions);

    if (params.type !== 'heartbeat') {
      const events = this.getStoredEvents();
      const newEv: TrackedAnalyticsEvent = {
        eventId,
        type: params.type,
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        timestamp: nowIso,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        deviceType,
        trafficSource: updatedSession.trafficSource,
        pagePath: this.currentPagePath,
        productId: params.productId,
        productName: params.productName,
        variantTitle: params.variantTitle,
        quantity: params.quantity,
        amountMinorUnits: params.amountMinorUnits,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      };
      events.unshift(newEv);
      this.saveStoredEvents(events);
    }

    try {
      this.broadcastChannel?.postMessage({ type: 'ANALYTICS_UPDATED' });
    } catch {
      // Ignore
    }
    this.notifyListeners();

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        type: params.type,
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        deviceType,
        trafficSource: updatedSession.trafficSource,
        pagePath: this.currentPagePath,
        productId: params.productId,
        productName: params.productName,
        variantTitle: params.variantTitle,
        quantity: params.quantity,
        amountMinorUnits: params.amountMinorUnits,
        cartItemCount: this.currentCartCount,
        cartValueMinorUnits: this.currentCartValueMinor,
        inCheckout: this.currentInCheckout,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.snapshot) {
          this.latestServerSnapshot = data.snapshot;
          this.notifyListeners();
        }
      })
      .catch(() => {
        // Fallback to local snapshot if offline
      });
  }

  public getCombinedSnapshot(orders: ImmutableOrderSnapshot[] = []): LiveAnalyticsSnapshot {
    const localSessions = this.syncWithDatabaseOrders(orders);
    const localEvents = this.getStoredEvents();
    const serverSessions = this.latestServerSnapshot?.sessions || [];
    const serverEvents = this.latestServerSnapshot?.recentEvents || [];

    const mergedMap = new Map<string, TrackedVisitorSession>();
    localSessions.forEach((s) => mergedMap.set(s.sessionId, s));
    serverSessions.forEach((s) => {
      const existing = mergedMap.get(s.sessionId);
      mergedMap.set(s.sessionId, {
        ...existing,
        ...s,
        viewedProductIds: Array.from(
          new Set([...(existing?.viewedProductIds || []), ...(s.viewedProductIds || [])])
        ),
        addedToCart: Boolean(existing?.addedToCart || s.addedToCart),
        reachedCheckout: Boolean(existing?.reachedCheckout || s.reachedCheckout),
        completedPurchase: Boolean(existing?.completedPurchase || s.completedPurchase),
      });
    });

    const now = Date.now();
    const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
    let activeVisitorsRightNow = 0;
    let activeCartsRightNow = 0;
    let checkingOutRightNow = 0;
    let purchasedRightNow = 0;

    const allSessions = Array.from(mergedMap.values()).map((s) => {
      const isOnline =
        !s.sessionId.startsWith('ord_sess_') &&
        s.isOnline &&
        now - new Date(s.lastSeenAt).getTime() <= ACTIVE_WINDOW_MS;
      if (isOnline) {
        activeVisitorsRightNow += 1;
        if (s.cartItemCount > 0) activeCartsRightNow += 1;
        if (s.inCheckout) checkingOutRightNow += 1;
        if (s.completedPurchase) purchasedRightNow += 1;
      }
      return { ...s, isOnline };
    });

    const eventMap = new Map<string, TrackedAnalyticsEvent>();
    localEvents.forEach((e) => eventMap.set(e.eventId, e));
    serverEvents.forEach((e) => eventMap.set(e.eventId, e));
    const allEvents = Array.from(eventMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      timestamp: new Date().toISOString(),
      liveCounters: {
        activeVisitorsRightNow,
        activeCartsRightNow,
        checkingOutRightNow,
        purchasedRightNow,
      },
      sessions: allSessions.sort(
        (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
      ),
      recentEvents: allEvents.slice(0, 150),
    };
  }

  private notifyListeners() {
    const snap = this.getCombinedSnapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  public subscribe(callback: (snapshot: LiveAnalyticsSnapshot) => void): () => void {
    this.listeners.add(callback);

    if (typeof window !== 'undefined' && !this.eventSource) {
      try {
        this.eventSource = new EventSource('/api/analytics/live-stream');
        this.eventSource.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data) as LiveAnalyticsSnapshot;
            this.latestServerSnapshot = parsed;
            this.notifyListeners();
          } catch {
            // Ignore malformed SSE message
          }
        };
        this.eventSource.onerror = () => {};
      } catch {}
    }

    fetch('/api/analytics/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          this.latestServerSnapshot = data;
          this.notifyListeners();
        }
      })
      .catch(() => {});

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }
}

export const analyticsTracker = new StorefrontAnalyticsTracker();
