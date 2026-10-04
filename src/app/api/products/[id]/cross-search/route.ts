import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { searchPlatform } from '@scripts/scrapers/search';
import { extractSearchQuery } from '@scripts/scrapers/query-extractor';
import { computeProductMatchScore } from '@/lib/dsa';
import { Platform } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

function getDb() {
  try {
    return getServiceSupabase();
  } catch {
    return supabase;
  }
}

const ALL_PLATFORMS: Platform[] = ['amazon', 'flipkart', 'meesho', 'myntra', 'ajio', 'westside'];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token || '');
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const db = getDb();
    const productId = params.id;

    // 1. Fetch current product
    const { data: product, error: pErr } = await db
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (pErr || !product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // 2. Fetch or initialize product group
    let group: any = null;
    let groupVariants: any[] = [];
    let pendingSuggestions: any[] = [];

    if (product.group_id) {
      const { data: gData } = await db
        .from('product_groups')
        .select('*')
        .eq('id', product.group_id)
        .maybeSingle();
      group = gData;

      if (group) {
        const { data: vData } = await db
          .from('products')
          .select('id, platform, title, current_price, lowest_price, url, image_url, check_status')
          .eq('group_id', group.id);
        groupVariants = vData || [];

        const { data: sData } = await db
          .from('cross_platform_suggestions')
          .select('*')
          .eq('group_id', group.id)
          .eq('status', 'pending');
        pendingSuggestions = sData || [];
      }
    }

    return NextResponse.json({
      success: true,
      product,
      group,
      groupVariants,
      pendingSuggestions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token || '');
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const db = getDb();
    const productId = params.id;

    // 1. Fetch target product
    const { data: product, error: pErr } = await db
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (pErr || !product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // 2. Extract clean search keywords
    const searchQuery = extractSearchQuery(product.title);
    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Could not extract clean search keywords from product title.' },
        { status: 400 }
      );
    }

    // 3. Ensure a product_group exists
    let groupId = product.group_id;
    if (!groupId) {
      const { data: newGroup, error: gErr } = await db
        .from('product_groups')
        .insert({
          user_id: session.userId || product.user_id,
          title: product.title,
          search_query: searchQuery,
          best_price: product.current_price,
          best_platform: product.platform,
          best_url: product.url,
        })
        .select()
        .single();

      if (!gErr && newGroup) {
        groupId = newGroup.id;
        await db.from('products').update({ group_id: groupId }).eq('id', product.id);
      }
    }

    // 4. Query all OTHER platforms concurrently
    const otherPlatforms = ALL_PLATFORMS.filter((p) => p !== product.platform);
    const searchPromises = otherPlatforms.map(async (platform) => {
      try {
        const results = await searchPlatform(platform, searchQuery, 4);
        return { platform, results };
      } catch (err) {
        console.warn(`Cross search error on [${platform}]:`, err);
        return { platform, results: [] };
      }
    });

    const searchResponses = await Promise.all(searchPromises);

    // 5. Compute similarity scores & match candidates
    const scoredMatches: Array<{
      platform: Platform;
      title: string;
      price: number;
      originalPrice?: number;
      productUrl: string;
      imageUrl?: string;
      score: number;
      confidence: 'high' | 'medium' | 'low';
      titleJaccard: number;
    }> = [];

    for (const { platform, results } of searchResponses) {
      for (const item of results) {
        const match = computeProductMatchScore(
          {
            title: product.title,
            price: product.current_price,
            platform: product.platform,
          },
          {
            title: item.title,
            price: item.price,
            brand: item.brand,
            platform,
          }
        );

        if (match.score >= 45) {
          scoredMatches.push({
            platform,
            title: item.title,
            price: item.price,
            originalPrice: item.originalPrice,
            productUrl: item.productUrl,
            imageUrl: item.imageUrl,
            score: match.score,
            confidence: match.confidence,
            titleJaccard: match.titleJaccard,
          });
        }
      }
    }

    // Sort by similarity score descending, pick best candidate per platform
    scoredMatches.sort((a, b) => b.score - a.score);
    const bestByPlatform = new Map<Platform, (typeof scoredMatches)[0]>();
    for (const match of scoredMatches) {
      if (!bestByPlatform.has(match.platform)) {
        bestByPlatform.set(match.platform, match);
      }
    }

    const uniqueTopMatches = Array.from(bestByPlatform.values());

    // 6. Record suggestions in database (if table exists)
    if (groupId) {
      for (const match of uniqueTopMatches) {
        try {
          await db.from('cross_platform_suggestions').upsert(
            {
              product_id: product.id,
              group_id: groupId,
              user_id: session.userId || product.user_id,
              platform: match.platform,
              title: match.title,
              price: match.price,
              original_price: match.originalPrice || null,
              product_url: match.productUrl,
              image_url: match.imageUrl || null,
              similarity_score: match.score,
              confidence: match.confidence,
              status: 'pending',
            },
            { onConflict: 'group_id,platform,product_url' }
          );
        } catch {
          // Graceful fallback if migrations are pending in hosted Supabase
        }
      }
    }

    // 7. Calculate overall lowest price across original + discovered options
    let lowestPrice = product.current_price;
    let lowestPlatform: Platform = product.platform;
    let lowestUrl = product.url;

    for (const m of uniqueTopMatches) {
      if (m.price > 0 && m.price < lowestPrice) {
        lowestPrice = m.price;
        lowestPlatform = m.platform;
        lowestUrl = m.productUrl;
      }
    }

    // Update group best price
    if (groupId) {
      try {
        await db.from('product_groups').update({
          best_price: lowestPrice,
          best_platform: lowestPlatform,
          best_url: lowestUrl,
          updated_at: new Date().toISOString(),
        }).eq('id', groupId);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      searchQuery,
      sourceProduct: {
        id: product.id,
        platform: product.platform,
        title: product.title,
        price: product.current_price,
      },
      matches: uniqueTopMatches,
      recommendation: {
        lowestPrice,
        lowestPlatform,
        lowestUrl,
        savingsRupees: Math.max(0, product.current_price - lowestPrice),
        savingsPercent:
          product.current_price > lowestPrice
            ? Math.round(((product.current_price - lowestPrice) / product.current_price) * 100)
            : 0,
        isOriginalLowest: lowestPlatform === product.platform,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
