import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cefr = searchParams.get('cefr') || '';
  const grammar = searchParams.get('grammar') || '';
  const format = searchParams.get('format') || '';

  const language = searchParams.get('language') || 'German';

const FORMAT_KEYWORDS: Record<string, string> = {
  'Tutorials': 'grammar lesson tutorial explanation',
  'Street Interviews': 'street interview native speakers',
  'Vlogs': 'vlog daily life',
  'Podcasts': 'podcast',
  'News & Documentaries': 'news documentary news broadcast',
  'Cartoons / Stories': 'cartoon story for beginners fairy tales kids',
  'Music / Lyrics': 'music with lyrics',
  'Shadowing (Pronunciation)': 'pronunciation shadowing speaking practice',
  'Movies & TV Shows': 'movie tv show clips',
  'Shorts': '#shorts',
  'Exam Prep / Mock Tests': 'exam prep mock test speaking exam B1 B2'
};

  // Construct a query optimized for finding language learning content
  let queryTerms = [`Learn ${language}`];
  if (cefr) queryTerms.push(cefr);
  if (grammar) queryTerms.push(grammar);
  if (format) {
    const formatList = format.split(',');
    const formatSearchTerms = formatList.map(f => FORMAT_KEYWORDS[f] || f).join(' ');
    queryTerms.push(formatSearchTerms);
  }
  
  const query = queryTerms.join(' ');

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is not set in environment variables.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const youtubeRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
    );
    
    if (!youtubeRes.ok) {
      console.error('YouTube API error:', await youtubeRes.text());
      return NextResponse.json({ error: 'YouTube API error' }, { status: 500 });
    }

    const data = await youtubeRes.json();
    const videos = data.items;

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 });
    }

    // Pick a random video from the top 20 results
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];

    return NextResponse.json({
      id: randomVideo.id.videoId,
      title: randomVideo.snippet.title,
      cefr: cefr || 'Any',
      grammar: grammar ? [grammar] : [],
      format: format || 'Any'
    });

  } catch (error) {
    console.error('YouTube search failed:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
