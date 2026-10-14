'use client';

import React, { useEffect, useEffectEvent } from 'react';
import { Paper } from '@mui/material';
import type { VideoData } from '@/lib/libraryStorage';
import LibraryPanel, { LIBRARY_PANEL_ID, LIBRARY_TITLE_ID } from './LibraryPanel';

export const LIBRARY_SIDE_PANEL_WIDTH = 380;

interface LibrarySidePanelProps {
  currentVideoId?: string;
  onSelectVideo: (video: VideoData) => void;
  onClose: () => void;
}

/**
 * Desktop library: a non-modal column that sits next to the video and pushes it
 * narrower instead of covering it, so the video keeps playing.
 */
export default function LibrarySidePanel({ currentVideoId, onSelectVideo, onClose }: LibrarySidePanelProps) {
  // Esc closes the panel. Open MUI dialogs (e.g. confirmations) swallow their own Esc first.
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing) onClose();
  });
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => onEscape(event);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Paper
      component="aside"
      id={LIBRARY_PANEL_ID}
      aria-labelledby={LIBRARY_TITLE_ID}
      className="glass-panel"
      sx={{
        width: LIBRARY_SIDE_PANEL_WIDTH,
        flexShrink: 0,
        position: 'sticky',
        top: 24,
        height: 'calc(100vh - 48px)',
        minHeight: 420,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LibraryPanel currentVideoId={currentVideoId} onSelectVideo={onSelectVideo} onClose={onClose} />
    </Paper>
  );
}
