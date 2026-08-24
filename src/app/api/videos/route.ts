import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cefr = searchParams.get('cefr') || '';
  const grammar = searchParams.get('grammar') || '';
  const format = searchParams.get('format') || '';

  // Construct a query optimized for finding German learning content
  let queryTerms = ['Learn German for English speakers'];
  if (cefr) queryTerms.push(cefr);
  if (grammar) queryTerms.push(grammar);
  if (format) queryTerms.push(format);
  
  const query = queryTerms.join(' ');

  try {
    const r = await ytSearch(query);
    const videos = r.videos;

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 });
    }

    // Pick a random video from the top 20 results (or however many were returned)
    const topResults = videos.slice(0, 20);
    const randomVideo = topResults[Math.floor(Math.random() * topResults.length)];

    return NextResponse.json({
      id: randomVideo.videoId,
      title: randomVideo.title,
      cefr: cefr || 'Any',
      grammar: grammar ? [grammar] : [],
      format: format || 'Any'
    });

  } catch (error) {
    console.error('YouTube search failed:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
