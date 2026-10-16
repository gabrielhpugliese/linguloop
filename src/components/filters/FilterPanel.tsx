'use client';

import React, { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import {
  Box, Button, ButtonBase, Chip, Collapse, FormControl, FormControlLabel, FormLabel,
  MenuItem, Paper, Select, Switch, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  DEFAULT_SELECTION, GOALS, LANGUAGES, LEVELS, SPEEDS,
  buildSummary, getGoal, getOptionGroups, sanitizeSelection, selectionToParams,
  withGoal, withLanguage, withLevel,
  type LanguageId, type LevelId, type Selection, type Speed,
} from '@/lib/catalog';

const STORAGE_KEY = 'linguloop_filters';

/** `saved` is false on a first visit (nothing stored, or storage unreadable). */
function loadSelection(): { selection: Selection; saved: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw
      ? { selection: sanitizeSelection(JSON.parse(raw)), saved: true }
      : { selection: DEFAULT_SELECTION, saved: false };
  } catch {
    return { selection: DEFAULT_SELECTION, saved: false };
  }
}

/** No-op subscription: `useSyncExternalStore` is only used to tell server/hydration (false) from client (true). */
const subscribeNever = () => () => {};

const FILTER_BODY_ID = 'filter-panel-body';

function saveSelection(selection: Selection) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // Storage blocked or full: filters just are not remembered.
  }
}

export interface FilterPanelProps {
  /**
   * Called with the /api/videos query params when "Next video" is clicked, and once on
   * mount for returning visitors after the saved filters have been restored (so the first
   * video already respects them).
   */
  onNext: (params: URLSearchParams) => void;
  /** Called once on mount instead of `onNext` on a first visit: nothing loads until the learner has chosen. */
  onFirstVisit?: () => void;
  /** Called when the user changes any filter. */
  onSelectionChange?: () => void;
  /** Shows the searching label; clicks are ignored until the video has loaded. */
  isLoading: boolean;
  /** Shown right under the "Next video" button (e.g. why no new video loaded). */
  notice?: React.ReactNode;
}

const sectionLabelSx = { fontSize: '0.8rem', mb: 0.75, display: 'block' } as const;

export default function FilterPanel({ onNext, onFirstVisit, onSelectionChange, isLoading, notice }: FilterPanelProps) {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  // Phones (below `md`) get a collapsible layout. `expanded` stays null until the saved filters
  // have been read on mount (first visit: expanded, later visits: collapsed), and the layout is
  // only chosen after hydration, so the server HTML and the first client render match.
  const [expanded, setExpanded] = useState<boolean | null>(null);
  // First visit, until the first "Next video": phones show the whole panel with the button at
  // the bottom, after the choices, instead of the summary bar.
  const [firstRun, setFirstRun] = useState(false);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const started = useRef(false);

  // localStorage is only read in an effect, so server and first client render match.
  const start = useEffectEvent((restored: Selection, saved: boolean) => {
    if (saved) onNext(selectionToParams(restored));
    else onFirstVisit?.();
  });
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in development
    started.current = true;
    const { selection: restored, saved } = loadSelection();
    setSelection(restored);
    setExpanded(!saved);
    setFirstRun(!saved);
    start(restored, saved);
  }, []);

  const update = (next: Selection) => {
    setSelection(next);
    saveSelection(next);
    onSelectionChange?.();
  };

  const goal = getGoal(selection.goal);
  const groups = getOptionGroups(selection.goal, selection.language, selection.level);

  const toggleOption = (id: string) =>
    update({ ...selection, option: selection.option === id ? '' : id });

  const compact = hydrated && !isMdUp;

  const handleNext = () => {
    // Not `disabled` while loading: a disabled button drops keyboard focus.
    if (isLoading) return;
    // Remember the selection even if it was never changed, so the next visit is not a first visit.
    saveSelection(selection);
    setFirstRun(false);
    // Phones: collapse to the summary bar.
    if (compact) setExpanded(false);
    onNext(selectionToParams(selection));
  };

  const nextButton = (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      sx={{ mt: compact && !firstRun ? 0 : 1, py: 1.5, fontWeight: 'bold', ...(isLoading && { cursor: 'progress' }) }}
      onClick={handleNext}
      aria-disabled={isLoading || undefined}
    >
      {isLoading ? 'Searching YouTube…' : 'Next video'}
    </Button>
  );

  const heading = (
    <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
      Find a video
    </Typography>
  );

  const noticeBlock = notice && <Box sx={{ mt: 1.5 }}>{notice}</Box>;

  const fields = (
    <>
      {/* Language */}
      <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
        <FormLabel sx={sectionLabelSx} id="filter-language-label">Language</FormLabel>
        <Select
          value={selection.language}
          size="small"
          labelId="filter-language-label"
          onChange={(e) => update(withLanguage(selection, e.target.value as LanguageId))}
        >
          {LANGUAGES.map((language) => (
            <MenuItem key={language.id} value={language.id}>
              <span style={{ marginRight: '8px' }}>{language.flag}</span> {language.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Level */}
      <Box sx={{ mb: 2 }}>
        <FormLabel component="div" sx={sectionLabelSx} id="filter-level-label">Level</FormLabel>
        <Box role="group" aria-labelledby="filter-level-label" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {LEVELS.map((level) => (
            <Tooltip key={level.id} title={level.description} enterTouchDelay={300}>
              <Chip
                label={level.label}
                clickable
                aria-pressed={selection.level === level.id}
                color={selection.level === level.id ? 'primary' : 'default'}
                variant={selection.level === level.id ? 'filled' : 'outlined'}
                onClick={() => update(withLevel(selection, level.id as LevelId))}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Goal */}
      <Box sx={{ mb: 2 }}>
        <FormLabel component="div" sx={sectionLabelSx} id="filter-goal-label">
          What do you want to work on?
        </FormLabel>
        <Box
          role="group"
          aria-labelledby="filter-goal-label"
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
          }}
        >
          {GOALS.map((g) => {
            const selected = selection.goal === g.id;
            return (
              <ButtonBase
                key={g.id}
                aria-pressed={selected}
                onClick={() => update(withGoal(selection, g.id))}
                sx={(theme) => ({
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 0.5,
                  minHeight: 76,
                  px: 1,
                  py: 1,
                  borderRadius: 2,
                  border: 1,
                  borderColor: selected ? 'primary.main' : 'divider',
                  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                  color: selected ? 'primary.main' : 'text.primary',
                  textAlign: 'center',
                  transition: 'background-color 0.15s, border-color 0.15s',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, selected ? 0.22 : 0.08) },
                  '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                })}
              >
                <span aria-hidden style={{ fontSize: '1.5rem', lineHeight: 1 }}>{g.icon}</span>
                <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{g.label}</Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {/* Goal options (all optional, single choice) */}
      {goal.optionsLabel && (
        <Box sx={{ mb: 2 }}>
          <FormLabel component="div" sx={sectionLabelSx} id="filter-options-label">
            {goal.optionsLabel} (optional)
          </FormLabel>
          <Box
            role="group"
            aria-labelledby="filter-options-label"
            sx={{
              maxHeight: 260,
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-thumb': { background: '#555', borderRadius: '10px' },
            }}
          >
            {groups.map((group, index) => (
              <Box key={group.heading ?? index} sx={{ mb: group.heading ? 1.5 : 0 }}>
                {group.heading && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    {group.heading}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {group.options.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      clickable
                      aria-pressed={selection.option === option.id}
                      color={selection.option === option.id ? 'primary' : 'default'}
                      variant={selection.option === option.id ? 'filled' : 'outlined'}
                      onClick={() => toggleOption(option.id)}
                      sx={{ height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Listening extras */}
      {selection.goal === 'listening' && (
        <Box sx={{ mb: 2 }}>
          <FormLabel component="div" sx={sectionLabelSx} id="filter-speed-label">Speed</FormLabel>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            color="primary"
            value={selection.speed}
            aria-labelledby="filter-speed-label"
            onChange={(_, value: Speed | null) => {
              if (value) update({ ...selection, speed: value });
            }}
          >
            {SPEEDS.map((speed) => (
              <ToggleButton key={speed.id} value={speed.id} sx={{ textTransform: 'none' }}>
                {speed.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControlLabel
            sx={{ mt: 1, ml: 0 }}
            control={
              <Switch
                checked={selection.short}
                onChange={(e) => update({ ...selection, short: e.target.checked })}
              />
            }
            label="Short videos only"
          />
        </Box>
      )}

    </>
  );

  if (!hydrated) {
    // Server / hydration render. Phones get a same-height placeholder for the collapsed bar
    // (so nothing jumps once the layout is chosen); md and up get the full panel.
    return (
      <>
        <Box sx={{ display: { xs: 'block', md: 'none' }, minHeight: 124, mb: 3 }} />
        <Paper className="glass-panel" sx={{ display: { xs: 'none', md: 'block' }, p: 2, mb: 4 }}>
          {heading}
          {fields}
          {nextButton}
        </Paper>
      </>
    );
  }

  if (compact && !firstRun) {
    if (expanded === null) return <Box sx={{ minHeight: 124, mb: 3 }} />;
    return (
      <Box sx={{ mb: 3 }}>
        <Paper
          className="glass-panel"
          sx={{ p: 1.5, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold', flex: 1, minWidth: 0 }}>
            {buildSummary(selection)}
          </Typography>
          <Button
            size="small"
            aria-expanded={expanded}
            aria-controls={FILTER_BODY_ID}
            onClick={() => setExpanded(!expanded)}
            sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 'bold' }}
          >
            {expanded ? 'Done' : 'Edit'}
            <span aria-hidden style={{ marginLeft: 4 }}>{expanded ? '\u25B4' : '\u25BE'}</span>
          </Button>
        </Paper>
        {nextButton}
        {noticeBlock}
        <Collapse in={expanded} id={FILTER_BODY_ID}>
          <Paper className="glass-panel" sx={{ p: 2, mt: 1.5 }}>
            {fields}
          </Paper>
        </Collapse>
      </Box>
    );
  }

  return (
    <Paper className="glass-panel" sx={{ p: 2, mb: compact ? 3 : 4 }}>
      {heading}
      {fields}
      {nextButton}
      {noticeBlock}
    </Paper>
  );
}
