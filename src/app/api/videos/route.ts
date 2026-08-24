import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cefr = searchParams.get('cefr') || '';
  const grammar = searchParams.get('grammar') || '';
  const format = searchParams.get('format') || '';

const FORMAT_KEYWORDS: Record<string, string> = {
  'Tutorials': 'grammar lesson tutorial explanation',
  'Street Interviews': 'Easy German street interview Leute auf der Straße',
  'Vlogs': 'German vlog daily life Deutsch lernen',
  'Podcasts': 'German podcast Easy German Deutsch lernen',
  'News & Documentaries': 'DW Nachrichten DW Deutsch documentary news',
  'Cartoons / Stories': 'German cartoon story for beginners märchen kinder',
  'Music / Lyrics': 'German music with lyrics Deutsch musik',
  'Shadowing (Pronunciation)': 'German pronunciation shadowing Aussprache',
  'Movies & TV Shows': 'German movie tv show clips film serien',
  'Shorts': '#shorts German learning Deutsch',
  'Exam Prep / Mock Tests': 'Goethe Zertifikat TELC exam prep mock test mündliche prüfung B1 B2'
};

  // Construct a query optimized for finding German learning content
  let queryTerms = ['Learn German'];
  if (cefr) queryTerms.push(cefr);
  if (grammar) queryTerms.push(grammar);
  if (format) {
    const formatList = format.split(',');
    const formatSearchTerms = formatList.map(f => FORMAT_KEYWORDS[f] || f).join(' ');
    queryTerms.push(formatSearchTerms);
  }
  
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
