import { NextResponse } from 'next/server';
import { buildSummary, parseSelectionParams, toSearchRequest } from '@/lib/catalog';
import {
  NoVideosFoundError,
  YouTubeApiError,
  YouTubeConfigError,
  searchVideos,
} from '@/lib/youtube-search';

// Simple in-memory rate limiter (per serverless container)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // 15 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Clean up old timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function GET(request: Request) {
  // Extract IP address from headers
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip';
  
  if (isRateLimited(ip)) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json({ error: 'Too Many Requests. Please wait a minute.' }, { status: 429 });
  }

  // Every param is validated against the catalog; unknown ids are a client error.
  const parsed = parseSelectionParams(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const selection = parsed.selection;

  try {
    // Cached per search request, derived from validated ids (see src/lib/youtube-search.ts).
    const videos = await searchVideos(toSearchRequest(selection));

    // Random pick happens outside the cache, so every request can get a different video.
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];

    return NextResponse.json({
      id: randomVideo.id,
      title: randomVideo.title,
      language: selection.language,
      cefr: selection.level === 'all' ? 'Any' : selection.level,
      goal: selection.goal,
      option: selection.option,
      summary: buildSummary(selection),
    });
  } catch (error) {
    if (error instanceof NoVideosFoundError) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 });
    }
    if (error instanceof YouTubeConfigError) {
      console.error('YOUTUBE_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    if (error instanceof YouTubeApiError) {
      console.error('YouTube API error:', error.message);
      return NextResponse.json({ error: 'YouTube API error' }, { status: 500 });
    }
    console.error('YouTube search failed:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
