'use client';

import React, { useState } from 'react';
import { Box, Button, List, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { clearHistory, HISTORY_LIMIT, removeFromHistory, type HistoryEntry, type VideoData } from '@/lib/libraryStorage';
import LibraryVideoItem from './LibraryVideoItem';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';

interface HistoryTabProps {
  /** Most recently watched first. */
  history: HistoryEntry[];
  now: number;
  currentVideoId?: string;
  onSelectVideo: (video: VideoData) => void;
}

export default function HistoryTab({ history, now, currentVideoId, onSelectVideo }: HistoryTabProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      {history.length === 0 ? (
        <EmptyState
          title="No videos watched yet"
          message={`Videos you watch show up here (the last ${HISTORY_LIMIT}). Your notes are kept separately.`}
        />
      ) : (
        <>
          <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Keeps your last {HISTORY_LIMIT} videos
            </Typography>
            <Button size="small" color="error" onClick={() => setConfirmOpen(true)}>
              Clear history
            </Button>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <List disablePadding>
              {history.map((entry) => (
                <LibraryVideoItem
                  key={entry.id}
                  video={entry}
                  timestamp={entry.watchedAt}
                  now={now}
                  selected={entry.id === currentVideoId}
                  onSelect={() => onSelectVideo(entry)}
                  actionLabel="Remove from history"
                  actionIcon={<CloseIcon fontSize="small" />}
                  onAction={() => removeFromHistory(entry.id)}
                />
              ))}
            </List>
          </Box>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Clear watch history?"
        message="All videos will be removed from your history. Your notes are kept and stay in the Notes tab."
        confirmLabel="Clear history"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          clearHistory();
          setConfirmOpen(false);
        }}
      />
    </Box>
  );
}
