'use client';

import React, { useState, useRef, useSyncExternalStore } from 'react';
import {
  Alert, Box, Container, Typography, Paper,
  FormControlLabel, TextField, Switch, Grid, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  getSortedNotes, getWatchedVideoIds, recordWatch, setLibraryOpen, setNoteText, toVideoData, useLibrary, type VideoData
} from '@/lib/libraryStorage';
import FilterPanel from '@/components/filters/FilterPanel';
import VideoContextLine from '@/components/filters/VideoContextLine';
import LibraryButton from '@/components/library/LibraryButton';
import LibrarySidePanel from '@/components/library/LibrarySidePanel';
import LibraryBottomSheet from '@/components/library/LibraryBottomSheet';
import { videoTitle } from '@/components/library/LibraryVideoItem';
import { LIBRARY_PANEL_ID } from '@/components/library/LibraryPanel';
import AdSlot from '@/components/ads/AdSlot';
import { ADSENSE_SLOT_SIDEBAR, ADSENSE_SLOT_TOP } from '@/lib/site';

/** No-op subscription: `useSyncExternalStore` is only used to tell server/hydration (false) from client (true). */
const subscribeNever = () => () => {};

const ALL_SEEN_MESSAGE = "You've watched all our picks for this topic. Try another topic or level.";

/** Failed /api/videos response; `code` is the API's error code, if it sent one. */
class LoadError extends Error {
  constructor(readonly code?: string) {
    super(`Failed to fetch${code ? ` (${code})` : ''}`);
  }
}

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  // Starts true: the first video is requested on mount.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hideNotes, setHideNotes] = useState<boolean>(false);
  // Set when the server says every pick for the current filters was already watched.
  const [allSeen, setAllSeen] = useState<boolean>(false);

  // History, notes and Library panel state live in localStorage (see src/lib/libraryStorage.ts).
  const library = useLibrary();
  const notesCount = getSortedNotes(library.notes).length;
  const notes = currentVideo ? library.notes[currentVideo.id]?.text ?? '' : '';

  // Desktop gets a side panel that pushes the video; smaller screens get a bottom sheet.
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  // The two columns stack below `md`. The sidebar ad sits under the filters when side by side
  // and after the notes when stacked. Exactly one AdSlot is ever mounted (two with one hidden
  // by CSS would still request an ad), and none until the client has hydrated and the query
  // is known, so the server HTML and the first client render match (both without the ad).
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const sidebarAd = hydrated ? (
    <AdSlot slot={ADSENSE_SLOT_SIDEBAR} variant="sidebar" />
  ) : null;
  const isLibraryOpen = library.ui.open;
  const libraryButtonRef = useRef<HTMLButtonElement>(null);
  const videoAreaRef = useRef<HTMLDivElement>(null);

  // Called by FilterPanel on 'Next video' and once on mount (after it restores the saved
  // filters). State is only updated in promise callbacks, so this is safe to start from an effect.
  const loadVideo = (params: URLSearchParams) => {
    setIsLoading(true);
    // Tell the server what to skip: the playing video plus the watch history. This only
    // narrows the random pick on the server; it does not affect the YouTube search cache.
    const watchedIds = getWatchedVideoIds(currentVideo?.id);
    if (watchedIds.length > 0) params.set('exclude', watchedIds.join(','));
    return fetch(`/api/videos?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { code?: string } | null;
          throw new LoadError(body?.code);
        }
        return res.json() as Promise<VideoData>;
      })
      .then((data) => {
        setAllSeen(false);
        setCurrentVideo(data);
        recordWatch(data);
      })
      .catch((error) => {
        if (error instanceof LoadError && error.code === 'ALL_SEEN') {
          // Friendly inline message instead of an alert; the current video stays.
          setAllSeen(true);
          return;
        }
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

  const allSeenAlert = <Alert severity="info">{ALL_SEEN_MESSAGE}</Alert>;

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
    <>
    <AdSlot slot={ADSENSE_SLOT_TOP} variant="top" />
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 4, lg: 3.6 }}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <FilterPanel
              isLoading={isLoading}
              onNext={loadVideo}
              onSelectionChange={() => setAllSeen(false)}
              notice={allSeen ? allSeenAlert : undefined}
            />
            {/* Phones show this message inside FilterPanel, right under the Next button. */}
            {allSeen && isMdUp && (
              <Alert severity="info" sx={{ mt: -2, mb: 3 }}>{ALL_SEEN_MESSAGE}</Alert>
            )}

            {/* Responsive ad unit: separated from the controls by its own margin, divider and label.
                Side-by-side layout only; stacked layouts render it after the notes instead. */}
            {isMdUp && sidebarAd}
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
                        src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}`}
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

          {/* Stacked (phone/tablet portrait): after the notes, not between filters and player. */}
          {!isMdUp && sidebarAd}
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
    </>
  );
}
