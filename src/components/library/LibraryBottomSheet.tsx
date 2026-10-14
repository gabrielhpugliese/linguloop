'use client';

import React from 'react';
import { Box, SwipeableDrawer } from '@mui/material';
import type { VideoData } from '@/lib/libraryStorage';
import LibraryPanel, { LIBRARY_PANEL_ID, LIBRARY_TITLE_ID } from './LibraryPanel';

interface LibraryBottomSheetProps {
  open: boolean;
  currentVideoId?: string;
  onSelectVideo: (video: VideoData) => void;
  onClose: () => void;
}

const noop = () => {};

/** Mobile library: bottom sheet up to ~85% of the viewport; swipe down, tap the backdrop, ✕ or Esc to close. */
export default function LibraryBottomSheet({ open, currentVideoId, onSelectVideo, onClose }: LibraryBottomSheetProps) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={noop}
      disableSwipeToOpen
      slotProps={{
        paper: {
          id: LIBRARY_PANEL_ID,
          'aria-labelledby': LIBRARY_TITLE_ID,
          sx: {
            height: '85vh',
            '@supports (height: 100dvh)': { height: '85dvh' },
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            // The theme's Paper is translucent; the sheet needs a solid surface over the page.
            backgroundColor: 'background.paper',
            backdropFilter: 'none',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, flexShrink: 0 }} aria-hidden="true">
        <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'text.disabled' }} />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <LibraryPanel currentVideoId={currentVideoId} onSelectVideo={onSelectVideo} onClose={onClose} />
      </Box>
    </SwipeableDrawer>
  );
}
