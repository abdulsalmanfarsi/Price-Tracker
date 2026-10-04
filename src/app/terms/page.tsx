import Link from 'next/link';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions — PriceWatcher Intelligence',
  description: 'Terms of service, fair use limits, automated scraping policies, and liability disclaimers.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12 space-y-12">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-champagne-muted hover:text-champagne transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface border border-surface-border text-champagne text-[11px] font-mono tracking-wide">
          <Scale className="w-3.5 h-3.5 text-gold" />
          <span>Legal &amp; Compliance</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-normal text-champagne tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs sm:text-sm text-champagne-muted font-mono">
          Last updated: October 2026 • Terms Version 2.2
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-xs sm:text-sm text-champagne-muted leading-relaxed">
        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>1. Permitted Use &amp; Service Scope</h2>
          </div>
          <p>
            PriceWatcher provides algorithmic price tracking, historical charting, and threshold-based alerts across supported Indian storefronts. The platform is designed for consumer transparency, personal price tracking, and ethical automated discovery.
          </p>
        </section>

        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>2. Fair Usage &amp; Rate Limits</h2>
          </div>
          <p>
            To preserve target server availability and prevent denial-of-service disruptions, all discovery lookups and manual scrape triggers are throttled by strict server-side sliding window limiters (e.g., 5-30 requests per minute depending on route). Automated scraping routines employ randomized jitter and exponential backoff.
          </p>
        </section>

        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>3. Price Accuracy &amp; Merchant Autonomy</h2>
          </div>
          <p>
            E-commerce storefronts may alter product prices, coupon structures, stock availability, and delivery charges at any microsecond. While PriceWatcher monitors catalog prices every 4 hours, real-time checkout totals are controlled exclusively by the merchant. PriceWatcher does not sell products and is not responsible for transaction discrepancies on third-party stores.
          </p>
        </section>

        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <Scale className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>4. Intellectual Property &amp; Trademarks</h2>
          </div>
          <p>
            All brand names, trademarks, product titles, and storefront logos (Amazon, Flipkart, Meesho, Myntra, Ajio, Westside) are properties of their respective owners. Their appearance within this interface is strictly nominative for identification and fair comparison purposes.
          </p>
        </section>
      </div>
    </div>
  );
}
