import { Typography } from '@mui/material';
import { getLanguage, LANGUAGE_IDS, type LanguageId } from '@/lib/catalog';
import type { VideoData } from '@/lib/libraryStorage';

/** Older history entries have no `summary`; fall back to "flag level" from what they do have. */
function fallbackSummary(video: Pick<VideoData, 'language' | 'cefr'>): string {
  const language = LANGUAGE_IDS.find((id) => id === video.language) as LanguageId | undefined;
  const level = video.cefr === 'Any' ? 'All levels' : video.cefr;
  return [language ? getLanguage(language).flag : '', level].filter(Boolean).join(' ');
}

/** How the video was found, e.g. "🇩🇪 B1 · Grammar · Dative case". Renders nothing without data. */
export default function VideoContextLine({
  video,
}: {
  video: Pick<VideoData, 'summary' | 'language' | 'cefr'>;
}) {
  const text = video.summary || fallbackSummary(video);
  if (!text) return null;
  return (
    <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
      {text}
    </Typography>
  );
}
