'use client';

import React, { useState, useRef } from 'react';
import {
  Box, Container, Typography, Paper,
  FormControlLabel, TextField, Switch, Grid, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  getSortedNotes, recordWatch, setLibraryOpen, setNoteText, toVideoData, useLibrary, type VideoData
} from '@/lib/libraryStorage';
import FilterPanel from '@/components/filters/FilterPanel';
import VideoContextLine from '@/components/filters/VideoContextLine';
import LibraryButton from '@/components/library/LibraryButton';
import LibrarySidePanel from '@/components/library/LibrarySidePanel';
import LibraryBottomSheet from '@/components/library/LibraryBottomSheet';
import { videoTitle } from '@/components/library/LibraryVideoItem';
import { LIBRARY_PANEL_ID } from '@/components/library/LibraryPanel';

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  // Starts true: the first video is requested on mount.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hideNotes, setHideNotes] = useState<boolean>(false);

  // History, notes and Library panel state live in localStorage (see src/lib/libraryStorage.ts).
  const library = useLibrary();
  const notesCount = getSortedNotes(library.notes).length;
  const notes = currentVideo ? library.notes[currentVideo.id]?.text ?? '' : '';

  // Desktop gets a side panel that pushes the video; smaller screens get a bottom sheet.
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isLibraryOpen = library.ui.open;
  const libraryButtonRef = useRef<HTMLButtonElement>(null);
  const videoAreaRef = useRef<HTMLDivElement>(null);

  // Called by FilterPanel on 'Next video' and once on mount (after it restores the saved
  // filters). State is only updated in promise callbacks, so this is safe to start from an effect.
  const loadVideo = (params: URLSearchParams) => {
    setIsLoading(true);
    return fetch(`/api/videos?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json() as Promise<VideoData>;
      })
      .then((data) => {
        setCurrentVideo(data);
        recordWatch(data);
      })
      .catch((error) => {
        console.error(error);
        alert("No videos match the selected filters or there was an error fetching from YouTube.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentVideo) {
      setNoteText(currentVideo, e.target.value);
    }
  };

  const toggleLibrary = () => setLibraryOpen(!isLibraryOpen);

  const closeLibrary = () => {
    // Desktop: if focus is inside the side panel it is about to disappear, so hand it back
    // to the toggle. (Esc while typing notes keeps focus where it is; the mobile sheet's
    // Modal restores focus by itself.)
    if (isDesktop && document.getElementById(LIBRARY_PANEL_ID)?.contains(document.activeElement)) {
      libraryButtonRef.current?.focus({ preventScroll: true });
    }
    setLibraryOpen(false);
  };

  const handleSelectVideo = (video: VideoData) => {
    setCurrentVideo(toVideoData(video));
    if (!isDesktop) {
      // Bottom sheet covers the player: close it and bring the player into view.
      setLibraryOpen(false);
      videoAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 4, lg: 3.6 }}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <FilterPanel isLoading={isLoading} onNext={loadVideo} />

            {/* 300x250 Ad Placeholder */}
            <Box 
              sx={{ 
                width: 300, 
                height: 250, 
                backgroundColor: '#333', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto',
                border: '1px solid #555',
                color: '#888'
              }}
            >
              300x250 Medium Rectangle Ad
            </Box>
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 8, lg: 8.4 }}>
          {/* Video column + (desktop) Library side panel. The panel is a later sibling,
              so opening/closing it never remounts the player. */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Box ref={videoAreaRef} sx={{ flex: 1, minWidth: 0, scrollMarginTop: 16 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <LibraryButton
                  ref={libraryButtonRef}
                  open={isLibraryOpen}
                  notesCount={notesCount}
                  onToggle={toggleLibrary}
                />
              </Box>

              {currentVideo ? (
                <Box>
                  <Paper className="glass-panel" sx={{ overflow: 'hidden', mb: 4 }}>
                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                      <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        src={`https://www.youtube.com/embed/${currentVideo.id}`}
                        title={videoTitle(currentVideo)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <VideoContextLine video={currentVideo} />
                      <Typography variant="body2">{videoTitle(currentVideo)}</Typography>
                    </Box>
                  </Paper>

                  <Paper className="glass-panel" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>My Notes</Typography>
                      <Tooltip title="Blur your notes so you can write or rewatch without reading them">
                        <FormControlLabel
                          control={<Switch checked={hideNotes} onChange={(e) => setHideNotes(e.target.checked)} color="secondary" />}
                          label="Hide notes"
                        />
                      </Tooltip>
                    </Box>
                    <TextField
                      multiline
                      fullWidth
                      rows={10}
                      variant="outlined"
                      placeholder="Take your notes here..."
                      value={notes}
                      onChange={handleNotesChange}
                      sx={{
                        '& .MuiInputBase-input': {
                          filter: hideNotes ? 'blur(8px)' : 'none',
                          transition: 'filter 0.3s ease, opacity 0.3s ease',
                          opacity: hideNotes ? 0.3 : 1,
                        }
                      }}
                    />
                  </Paper>
                </Box>
              ) : (
                <Typography>Loading video...</Typography>
              )}
            </Box>

            {isDesktop && isLibraryOpen && (
              <LibrarySidePanel
                currentVideoId={currentVideo?.id}
                onSelectVideo={handleSelectVideo}
                onClose={closeLibrary}
              />
            )}
          </Box>
        </Grid>
      </Grid>

      {!isDesktop && (
        <LibraryBottomSheet
          open={isLibraryOpen}
          currentVideoId={currentVideo?.id}
          onSelectVideo={handleSelectVideo}
          onClose={closeLibrary}
        />
      )}
    </Container>
  );
}
