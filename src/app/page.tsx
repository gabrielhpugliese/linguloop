'use client';

import React, { useState, useRef, useSyncExternalStore } from 'react';
import {
  Alert, Box, Button, Container, Typography, Paper,
  FormControlLabel, TextField, Switch, Grid, Tooltip, Skeleton, LinearProgress
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
import LogoMark from '@/components/LogoMark';
import { ADSENSE_SLOT_SIDEBAR, ADSENSE_SLOT_TOP, SITE_NAME, SITE_TAGLINE } from '@/lib/site';

/** No-op subscription: `useSyncExternalStore` is only used to tell server/hydration (false) from client (true). */
const subscribeNever = () => () => {};

/** A request that takes longer than this is treated as a network failure. */
const LOAD_TIMEOUT_MS = 20000;

/** Failed /api/videos response: the HTTP status, and the API's error code if it sent one. */
class LoadError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super(`Failed to fetch (${status}${code ? ` ${code}` : ''})`);
  }
}

/** What went wrong with the last request, in the learner's terms. `retry`: the same request may work again. */
interface LoadNotice {
  severity: 'info' | 'warning' | 'error';
  message: string;
  retry: boolean;
}

function noticeFor(error: unknown): LoadNotice {
  if (error instanceof LoadError) {
    if (error.code === 'ALL_SEEN') {
      return { severity: 'info', message: "You've watched all our picks for this topic. Try another topic or level.", retry: false };
    }
    if (error.code === 'NO_RESULTS') {
      return { severity: 'info', message: "We couldn't find a video for this choice. Try another topic or level.", retry: false };
    }
    if (error.status === 429) {
      return { severity: 'warning', message: 'Too many videos requested in a short time. Wait a minute, then try again.', retry: true };
    }
  }
  return { severity: 'error', message: "We couldn't load a video. Check your connection and try again.", retry: true };
}

const visuallyHiddenSx = {
  position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
  clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap',
} as const;

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  // Starts true: returning visitors get a video requested on mount (FilterPanel says otherwise
  // on a first visit, where nothing loads until the learner has chosen).
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hideNotes, setHideNotes] = useState<boolean>(false);
  const [notice, setNotice] = useState<LoadNotice | null>(null);
  // Params of the last request (without `exclude`), for "Try again".
  const lastParams = useRef<URLSearchParams | null>(null);

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

  // Called by FilterPanel on 'Next video' and once on mount for returning visitors (after it
  // restores the saved filters). State is only updated in promise callbacks, so this is safe
  // to start from an effect.
  const loadVideo = (params: URLSearchParams) => {
    lastParams.current = new URLSearchParams(params);
    setIsLoading(true);
    // Tell the server what to skip: the playing video plus the watch history. This only
    // narrows the random pick on the server; it does not affect the YouTube search cache.
    const watchedIds = getWatchedVideoIds(currentVideo?.id);
    if (watchedIds.length > 0) params.set('exclude', watchedIds.join(','));
    return fetch(`/api/videos?${params.toString()}`, { signal: AbortSignal.timeout(LOAD_TIMEOUT_MS) })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { code?: string } | null;
          throw new LoadError(res.status, body?.code);
        }
        return res.json() as Promise<VideoData>;
      })
      .then((data) => {
        setNotice(null);
        setCurrentVideo(data);
        recordWatch(data);
      })
      .catch((error) => {
        // The current video (if any) stays; the notice explains what happened.
        if (!(error instanceof LoadError)) console.error(error);
        setNotice(noticeFor(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const retry = () => {
    if (lastParams.current && !isLoading) loadVideo(new URLSearchParams(lastParams.current));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentVideo) {
      setNoteText(currentVideo, e.target.value);
    }
  };

  const retryButton = (
    <Button color="inherit" size="small" onClick={retry} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      Try again
    </Button>
  );

  // With a video on screen the notice sits under "Next video"; without one it fills the player area.
  const panelNotice = notice && currentVideo ? (
    <Alert severity={notice.severity} action={notice.retry ? retryButton : undefined}>
      {notice.message}
    </Alert>
  ) : undefined;

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
    setNotice(null);
    setCurrentVideo(toVideoData(video));
    if (!isDesktop) {
      // Bottom sheet covers the player: close it and bring the player into view.
      setLibraryOpen(false);
      videoAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Player area without a video: loading, failed, or waiting for the first choice.
  const emptyPlayer = isLoading ? (
    <Paper className="glass-panel" sx={{ overflow: 'hidden', mb: 4 }}>
      <Skeleton variant="rectangular" animation="wave" sx={{ height: 'auto', aspectRatio: '16 / 9' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="30%" />
        <Skeleton width="70%" />
      </Box>
    </Paper>
  ) : (
    <Paper
      className="glass-panel"
      sx={{
        mb: 4, px: { xs: 2.5, sm: 4 }, py: { xs: 4, sm: 5 },
        minHeight: { sm: 320 },
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 1.5,
      }}
    >
      {notice ? (
        <>
          <Box role="alert">
            <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              No video this time
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '60ch' }}>{notice.message}</Typography>
          </Box>
          {notice.retry && (
            <Button variant="outlined" onClick={retry}>Try again</Button>
          )}
        </>
      ) : (
        <>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold' }}>
            Your video will play here
          </Typography>
          <Typography sx={{ maxWidth: '60ch' }}>
            Choose a language, your level and what you want to work on, then press{' '}
            <strong>Next video</strong>. {SITE_NAME} finds a YouTube video that fits.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '60ch' }}>
            Videos are found automatically, so not every one will be a perfect match. If one isn&apos;t
            right, press Next video again.
          </Typography>
        </>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 }, pb: 4 }}>
      <Box
        component="header"
        sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, md: 3 } }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 1.5, rowGap: 0.25, minWidth: 0, flex: 1 }}>
          {/* Block (not flex) so the row's baseline is the name's text baseline, shared with the tagline. */}
          <Typography component="h1" sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, color: 'primary.main' }}>
            <LogoMark height={24} style={{ display: 'inline-block', verticalAlign: '-0.2em', marginRight: 8 }} />
            {SITE_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary">{SITE_TAGLINE}</Typography>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <LibraryButton
            ref={libraryButtonRef}
            open={isLibraryOpen}
            notesCount={notesCount}
            onToggle={toggleLibrary}
          />
        </Box>
      </Box>

      <AdSlot slot={ADSENSE_SLOT_TOP} variant="top" />

      {/* Announces loading and the newly playing video; errors announce themselves (role="alert"). */}
      <Box role="status" sx={visuallyHiddenSx}>
        {isLoading ? 'Searching YouTube for a video…' : currentVideo ? `Now playing: ${videoTitle(currentVideo)}` : ''}
      </Box>

      <Grid container spacing={4} sx={{ mt: { xs: 1, md: 2 } }}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 4, lg: 3.6 }}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <FilterPanel
              isLoading={isLoading}
              onNext={loadVideo}
              onFirstVisit={() => setIsLoading(false)}
              onSelectionChange={() => setNotice(null)}
              notice={panelNotice}
            />

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
              {currentVideo ? (
                <Box>
                  <Paper className="glass-panel" sx={{ overflow: 'hidden', mb: 4 }}>
                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                      <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}`}
                        title={videoTitle(currentVideo)}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      {isLoading && (
                        <LinearProgress
                          aria-label="Loading the next video"
                          sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <VideoContextLine video={currentVideo} />
                      <Typography variant="body2">{videoTitle(currentVideo)}</Typography>
                    </Box>
                  </Paper>

                  <Paper className="glass-panel" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold' }}>My Notes</Typography>
                      <Tooltip title="Blur your notes so you can write or rewatch without reading them">
                        <FormControlLabel
                          control={<Switch checked={hideNotes} onChange={(e) => setHideNotes(e.target.checked)} />}
                          label="Hide notes"
                        />
                      </Tooltip>
                    </Box>
                    <TextField
                      multiline
                      fullWidth
                      rows={10}
                      variant="outlined"
                      placeholder="New words, phrases, anything you want to remember. Notes are saved in this browser only."
                      value={notes}
                      onChange={handleNotesChange}
                      slotProps={{ htmlInput: { 'aria-label': 'Notes for this video' } }}
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
              ) : emptyPlayer}
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
  );
}
