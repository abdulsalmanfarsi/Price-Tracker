'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Sparkles, Plus, Check, Loader2, ArrowDownRight, Tag } from 'lucide-react';
import { Platform, Product } from '@/types';
import { PlatformBadge } from './platform-badge';
import { formatPrice } from '@/lib/utils';

interface DiscoveredMatch {
  platform: Platform;
  title: string;
  price: number;
  originalPrice?: number;
  productUrl: string;
  imageUrl?: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

interface CrossPlatformComparisonProps {
  product: Product;
  onAddedProduct?: () => void;
}

export function CrossPlatformComparison({ product, onAddedProduct }: CrossPlatformComparisonProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<DiscoveredMatch[]>([]);
  const [recommendation, setRecommendation] = useState<{
    lowestPrice: number;
    lowestPlatform: Platform;
    lowestUrl: string;
    savingsRupees: number;
    savingsPercent: number;
    isOriginalLowest: boolean;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [addingUrls, setAddingUrls] = useState<Record<string, boolean>>({});
  const [addedUrls, setAddedUrls] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchCrossPlatform = async () => {
    setIsSearching(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/products/${product.id}/cross-search`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search alternative stores.');
      }

      setMatches(data.matches || []);
      setRecommendation(data.recommendation || null);
      setSearchQuery(data.searchQuery || '');
      setHasSearched(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackVariant = async (match: DiscoveredMatch) => {
    setAddingUrls((prev) => ({ ...prev, [match.productUrl]: true }));
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: match.productUrl,
          targetPrice: match.price,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddedUrls((prev) => ({ ...prev, [match.productUrl]: true }));
        if (onAddedProduct) onAddedProduct();
      } else {
        alert(data.error || 'Failed to add store to tracking.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error adding store');
    } finally {
      setAddingUrls((prev) => ({ ...prev, [match.productUrl]: false }));
    }
  };

  return (
    <div className="mt-8 border border-surface-border bg-obsidian-subtle rounded-sm p-4 sm:p-6 relative overflow-hidden">
      {/* Background Champagne Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/5 blur-3xl rounded-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <h3 className="font-serif text-lg sm:text-xl text-champagne font-medium tracking-tight">
              Cross-Platform Store Scanner
            </h3>
          </div>
          <p className="text-xs text-champagne-muted mt-0.5">
            Auto-scans Amazon, Flipkart, Meesho, Myntra, Ajio & Westside for the same item and highlights the lowest market price.
          </p>
        </div>

        <button
          onClick={handleSearchCrossPlatform}
          disabled={isSearching}
          className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-gold/30 hover:border-gold text-gold text-xs font-medium px-4 py-2.5 rounded-sm transition-all disabled:opacity-50 whitespace-nowrap shadow-sm shadow-gold/5"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning 5 Stores...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hasSearched ? 'Rescan Alternative Stores' : 'Find on Other Stores'}</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-terracotta/10 border border-terracotta/20 text-terracotta text-xs rounded-sm">
          {errorMsg}
        </div>
      )}

      {/* Best Price Recommendation Banner */}
      {recommendation && (
        <div className="mt-4 p-3.5 rounded-sm border bg-obsidian flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-surface-border">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center flex-shrink-0 text-sage">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-champagne-faint">
                  Market Recommendation
                </span>
                {recommendation.isOriginalLowest ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sage/10 text-sage border border-sage/30 rounded-sm">
                    Current Store Has Lowest Price
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-gold/10 text-gold border border-gold/30 rounded-sm flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3" /> Save {recommendation.savingsPercent}% (₹{recommendation.savingsRupees})
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-champagne mt-0.5">
                Lowest verified price: <strong className="text-sage font-mono">{formatPrice(recommendation.lowestPrice)}</strong> on{' '}
                <span className="uppercase text-gold font-mono">{recommendation.lowestPlatform}</span>
              </p>
            </div>
          </div>

          <a
            href={recommendation.lowestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-gold hover:bg-gold-hover text-obsidian text-xs font-semibold px-3.5 py-2 rounded-sm transition-colors whitespace-nowrap"
          >
            <span>Buy on {recommendation.lowestPlatform.toUpperCase()}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Comparison Results Table */}
      {hasSearched && (
        <div className="mt-5">
          {searchQuery && (
            <div className="text-[11px] font-mono text-champagne-muted mb-2.5">
              Target Query: <span className="text-champagne font-semibold">&ldquo;{searchQuery}&rdquo;</span>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-surface-border rounded-sm">
              <p className="text-xs text-champagne-muted">
                No matching catalog items found on other platforms with high confidence. You can still track manual URLs anytime.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.map((item, idx) => {
                const isCheaper = item.price < product.current_price;
                const priceDiff = product.current_price - item.price;
                const isLowest = recommendation && item.price === recommendation.lowestPrice;
                const isAdded = addedUrls[item.productUrl];
                const isAdding = addingUrls[item.productUrl];

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-sm border bg-obsidian flex flex-col justify-between transition-all ${
                      isLowest
                        ? 'border-gold/40 shadow-sm shadow-gold/5 ring-1 ring-gold/20'
                        : 'border-surface-border hover:border-surface-border-strong'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <PlatformBadge platform={item.platform} />
                        {isLowest ? (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm bg-gold/15 text-gold border border-gold/30 font-semibold tracking-wider">
                            ⭐ Lowest Price
                          </span>
                        ) : isCheaper ? (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm bg-sage/10 text-sage border border-sage/20 font-medium">
                            ₹{priceDiff} Cheaper
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm bg-surface-subtle text-champagne-faint border border-surface-border">
                            {item.score}% Match
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {item.imageUrl && (
                          <div className="w-12 h-14 relative flex-shrink-0 bg-surface rounded-sm overflow-hidden border border-surface-border">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs text-champagne font-medium line-clamp-2 leading-relaxed">
                            {item.title}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-sm font-mono font-semibold text-champagne">
                              {formatPrice(item.price)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-[10px] font-mono line-through text-champagne-faint">
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-champagne-muted hover:text-champagne bg-surface-subtle hover:bg-surface border border-surface-border py-1.5 px-2.5 rounded-sm transition-colors"
                      >
                        <span>View Store</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleTrackVariant(item)}
                        disabled={isAdded || isAdding}
                        className={`flex items-center justify-center gap-1 text-xs py-1.5 px-3 rounded-sm font-medium transition-all ${
                          isAdded
                            ? 'bg-sage/15 text-sage border border-sage/30'
                            : 'bg-surface hover:bg-surface-hover text-gold border border-gold/30 hover:border-gold'
                        }`}
                        title="Add this store variant to your tracked products"
                      >
                        {isAdding ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Tracking</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Auto-Track</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
