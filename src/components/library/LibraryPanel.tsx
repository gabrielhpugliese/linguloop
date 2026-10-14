'use client';

import React from 'react';
import { Box, IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getSortedNotes, setLibraryTab, useLibrary, type LibraryTab, type VideoData } from '@/lib/libraryStorage';
import { useNow } from './relativeTime';
import NotesTab from './NotesTab';
import HistoryTab from './HistoryTab';

export const LIBRARY_PANEL_ID = 'library-panel';
export const LIBRARY_TITLE_ID = 'library-panel-title';

interface LibraryPanelProps {
  currentVideoId?: string;
  onSelectVideo: (video: VideoData) => void;
  onClose: () => void;
}

/** Library contents (header, tabs, lists). Rendered inside the desktop side panel or the mobile bottom sheet. */
export default function LibraryPanel({ currentVideoId, onSelectVideo, onClose }: LibraryPanelProps) {
  const library = useLibrary();
  const now = useNow();
  const notes = getSortedNotes(library.notes);
  // Remembered tab wins; otherwise start on Notes when there are any.
  const tab: LibraryTab = library.ui.tab ?? (notes.length > 0 ? 'notes' : 'history');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: 2, pr: 1, pt: 1.5 }}>
        <Typography id={LIBRARY_TITLE_ID} variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          Library
        </Typography>
        <Tooltip title="Close library (Esc)">
          <IconButton aria-label="Close library" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value: LibraryTab) => setLibraryTab(value)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab
          value="notes"
          label={`Notes (${notes.length})`}
          id="library-tab-notes"
          aria-controls="library-tabpanel-notes"
          sx={{ fontWeight: 'bold' }}
        />
        <Tab
          value="history"
          label={`History (${library.history.length})`}
          id="library-tab-history"
          aria-controls="library-tabpanel-history"
          sx={{ fontWeight: 'bold' }}
        />
      </Tabs>

      <Box
        role="tabpanel"
        id={`library-tabpanel-${tab}`}
        aria-labelledby={`library-tab-${tab}`}
        sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {tab === 'notes' ? (
          <NotesTab notes={notes} now={now} currentVideoId={currentVideoId} onSelectVideo={onSelectVideo} />
        ) : (
          <HistoryTab history={library.history} now={now} currentVideoId={currentVideoId} onSelectVideo={onSelectVideo} />
        )}
      </Box>
    </Box>
  );
}
