'use client';

import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Box, Button, ButtonBase, Chip, FormControl, FormControlLabel, FormLabel,
  MenuItem, Paper, Select, Switch, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DEFAULT_SELECTION, GOALS, LANGUAGES, LEVELS, SPEEDS,
  getGoal, getOptionGroups, sanitizeSelection, selectionToParams,
  withGoal, withLanguage, withLevel,
  type LanguageId, type LevelId, type Selection, type Speed,
} from '@/lib/catalog';

const STORAGE_KEY = 'linguloop_filters';

function loadSelection(): Selection {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeSelection(JSON.parse(raw)) : DEFAULT_SELECTION;
  } catch {
    return DEFAULT_SELECTION;
  }
}

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
   * mount after the saved filters have been restored (so the first video already
   * respects them).
   */
  onNext: (params: URLSearchParams) => void;
  /** Disables the button and shows the searching label. */
  isLoading: boolean;
}

const sectionLabelSx = { fontSize: '0.8rem', mb: 0.75, display: 'block' } as const;

export default function FilterPanel({ onNext, isLoading }: FilterPanelProps) {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  const started = useRef(false);

  // localStorage is only read in an effect, so server and first client render match.
  const start = useEffectEvent((restored: Selection) => onNext(selectionToParams(restored)));
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in development
    started.current = true;
    const restored = loadSelection();
    setSelection(restored);
    start(restored);
  }, []);

  const update = (next: Selection) => {
    setSelection(next);
    saveSelection(next);
  };

  const goal = getGoal(selection.goal);
  const groups = getOptionGroups(selection.goal, selection.language, selection.level);

  const toggleOption = (id: string) =>
    update({ ...selection, option: selection.option === id ? '' : id });

  return (
    <Paper className="glass-panel" sx={{ p: 2, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }} color="primary">
        LinguLoop Filters
      </Typography>

      {/* Language */}
      <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
        <FormLabel color="secondary" id="filter-language-label">Language</FormLabel>
        <Select
          value={selection.language}
          size="small"
          labelId="filter-language-label"
          onChange={(e) => update(withLanguage(selection, e.target.value as LanguageId))}
          sx={{ mt: 1 }}
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
        <FormLabel color="secondary" component="div" sx={sectionLabelSx} id="filter-level-label">Level</FormLabel>
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
        <FormLabel color="secondary" component="div" sx={sectionLabelSx} id="filter-goal-label">
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
          <FormLabel color="secondary" component="div" sx={sectionLabelSx} id="filter-options-label">
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
          <FormLabel color="secondary" component="div" sx={sectionLabelSx} id="filter-speed-label">Speed</FormLabel>
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
                color="secondary"
                onChange={(e) => update({ ...selection, short: e.target.checked })}
              />
            }
            label="Short videos only"
          />
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1, py: 1.5, fontWeight: 'bold' }}
        onClick={() => onNext(selectionToParams(selection))}
        disabled={isLoading}
      >
        {isLoading ? 'Searching YouTube...' : 'Next video'}
      </Button>
    </Paper>
  );
}
