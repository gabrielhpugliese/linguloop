'use client';

import React from 'react';
import { Box, IconButton, ListItem, ListItemButton, Tooltip, Typography } from '@mui/material';
import { languageFlags } from '@/lib/languages';
import type { VideoData } from '@/lib/libraryStorage';
import { formatRelativeTime } from './relativeTime';

const clampTwoLines = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  wordBreak: 'break-word',
} as const;

export function videoTitle(video: VideoData): string {
  return video.title || 'Untitled video';
}

interface LibraryVideoItemProps {
  video: VideoData;
  /** Epoch ms shown as a relative date; omitted when unknown. */
  timestamp?: number;
  now: number;
  preview?: string;
  selected: boolean;
  onSelect: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction: () => void;
}

export default function LibraryVideoItem({
  video,
  timestamp,
  now,
  preview,
  selected,
  onSelect,
  actionLabel,
  actionIcon,
  onAction,
}: LibraryVideoItemProps) {
  const title = videoTitle(video);
  const flag = video.language ? languageFlags[video.language] : undefined;
  const level = video.cefr && video.cefr !== 'Any' ? video.cefr : '';
  const meta = [
    flag ? <span key="flag" role="img" aria-label={video.language}>{flag}</span> : null,
    level ? <span key="level">{level}</span> : null,
    formatRelativeTime(timestamp, now) || null,
  ].filter(Boolean);

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Tooltip title={actionLabel}>
          <IconButton edge="end" size="small" aria-label={`${actionLabel}: ${title}`} onClick={onAction}>
            {actionIcon}
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemButton
        selected={selected}
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
        sx={{
          alignItems: 'flex-start',
          gap: 1.5,
          py: 1.25,
          pr: 6,
          borderLeft: '3px solid',
          borderLeftColor: selected ? 'primary.main' : 'transparent',
        }}
      >
        <Box
          component="img"
          src={`https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          sx={{
            width: 112,
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            borderRadius: 1,
            flexShrink: 0,
            backgroundColor: 'action.hover',
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{ ...clampTwoLines, fontWeight: 600, fontStyle: video.title ? 'normal' : 'italic' }}
            title={title}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            component="div"
            color="text.secondary"
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 0.75, mt: 0.25 }}
          >
            {selected && (
              <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>▶ Now playing</Box>
            )}
            {meta.map((part, index) => (
              <React.Fragment key={index}>
                {(index > 0 || selected) && <span aria-hidden="true">·</span>}
                {part}
              </React.Fragment>
            ))}
          </Typography>
          {preview && (
            <Typography variant="body2" color="text.secondary" sx={{ ...clampTwoLines, mt: 0.5, fontSize: '0.8rem' }}>
              {preview}
            </Typography>
          )}
        </Box>
      </ListItemButton>
    </ListItem>
  );
}
