'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, InputAdornment, List, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { deleteNote, type NoteEntry, type VideoData } from '@/lib/libraryStorage';
import LibraryVideoItem, { videoTitle } from './LibraryVideoItem';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';

/** Case- and accent-insensitive matching ("uber" finds "Über"). */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

interface NotesTabProps {
  notes: NoteEntry[];
  now: number;
  currentVideoId?: string;
  onSelectVideo: (video: VideoData) => void;
}

export default function NotesTab({ notes, now, currentVideoId, onSelectVideo }: NotesTabProps) {
  const [query, setQuery] = useState('');
  // Kept after closing so the dialog text doesn't vanish during its exit transition.
  const [pendingDelete, setPendingDelete] = useState<NoteEntry | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return notes;
    return notes.filter((note) => normalize(`${note.video.title}\n${note.text}`).includes(q));
  }, [notes, query]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          message="Write something in “My Notes” below a video and it shows up here, even after the video leaves your history."
        />
      ) : (
        <>
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            <TextField
              size="small"
              fullWidth
              type="search"
              placeholder="Search titles and notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': 'Search notes' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <EmptyState
                title="No matching notes"
                message={`Nothing matches “${query.trim()}”. Try another word.`}
                action={<Button size="small" onClick={() => setQuery('')}>Clear search</Button>}
              />
            ) : (
              <List disablePadding>
                {filtered.map((note) => (
                  <LibraryVideoItem
                    key={note.video.id}
                    video={note.video}
                    timestamp={note.updatedAt}
                    now={now}
                    preview={note.text.trim()}
                    selected={note.video.id === currentVideoId}
                    onSelect={() => onSelectVideo(note.video)}
                    actionLabel="Delete note"
                    actionIcon={<DeleteOutlinedIcon fontSize="small" />}
                    onAction={() => {
                      setPendingDelete(note);
                      setConfirmOpen(true);
                    }}
                  />
                ))}
              </List>
            )}
          </Box>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete note?"
        message={
          pendingDelete ? (
            <>
              Your note for <strong>{videoTitle(pendingDelete.video)}</strong> will be permanently deleted. This can&apos;t be undone.
            </>
          ) : null
        }
        confirmLabel="Delete note"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (pendingDelete) deleteNote(pendingDelete.video.id);
          setConfirmOpen(false);
        }}
      />
    </Box>
  );
}
