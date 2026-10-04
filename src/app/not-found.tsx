import Link from 'next/link';
import { Compass, ArrowLeft, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: '404 — Page Not Found | PriceWatcher',
  description: 'The requested resource could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface border border-surface-border text-champagne text-[11px] font-mono tracking-wide">
        <ShieldAlert className="w-3.5 h-3.5 text-gold" />
        <span>HTTP 404 • Resource Not Located</span>
      </div>

      <div className="space-y-3 max-w-lg">
        <h1 className="font-display text-5xl sm:text-7xl font-normal text-champagne tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-champagne-muted leading-relaxed font-normal">
          The requested route does not exist or has been relocated. Check the URL or return to your product surveillance dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-obsidian font-semibold px-5 py-2.5 rounded-sm text-xs transition-colors"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Go to Watchlist</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-surface hover:bg-surface-hover text-champagne border border-surface-border px-5 py-2.5 rounded-sm text-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
