import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, Server, FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — PriceWatcher Intelligence',
  description: 'Our data protection principles, zero-tracking philosophy, and privacy-preserving price telemetry protocols.',
};

export default function PrivacyPage() {
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
          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
          <span>Privacy &amp; Data Protection</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-normal text-champagne tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-champagne-muted font-mono">
          Last updated: October 2026 • Policy Version 2.4
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-xs sm:text-sm text-champagne-muted leading-relaxed">
        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <Lock className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>1. Zero-Tracking Philosophy</h2>
          </div>
          <p>
            PriceWatcher operates under strict privacy-first constraints. We do not sell, rent, or monetize your product tracking queries, shopping habits, or watchlist history. We do not embed third-party surveillance scripts, behavioral tracking pixels, or cross-site ad networks.
          </p>
        </section>

        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <Server className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>2. Information We Process</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-champagne">Public E-Commerce URLs:</strong> URLs submitted for price scraping are parsed solely to extract public product metadata (titles, prices, discounts, and SKU identifiers) from supported storefronts.
            </li>
            <li>
              <strong className="text-champagne">Authentication &amp; Session Tokens:</strong> For registered accounts, we store hashed credentials and issue stateless, cryptographically signed HTTP-only session cookies.
            </li>
            <li>
              <strong className="text-champagne">Alert Dispatch Configurations:</strong> Webhook URLs, Telegram Chat IDs, or Web Push subscriptions configured in Settings are securely encrypted and utilized strictly for automated price threshold notifications.
            </li>
          </ul>
        </section>

        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <EyeOff className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>3. Automated Scraping &amp; Data Integrity</h2>
          </div>
          <p>
            Scraping jobs execute on scheduled cron intervals across Amazon India, Flipkart, Meesho, Myntra, Ajio, and Westside. No private consumer session cookies or customer authentication headers are ever passed to target e-commerce platforms. All scraped prices reflect publicly advertised catalog values.
          </p>
        </section>

        <section className="bg-surface border border-surface-border p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-champagne font-medium text-sm sm:text-base">
            <FileText className="w-4 h-4 text-gold flex-shrink-0" />
            <h2>4. Data Retention &amp; User Rights</h2>
          </div>
          <p>
            Users have complete sovereignty over their data. You may delete individual products, clear search history logs, or purge notification settings at any time via the Watchlist and Settings dashboards. Deletion operations cascade immediately to historical price tables.
          </p>
        </section>
      </div>
    </div>
  );
}
