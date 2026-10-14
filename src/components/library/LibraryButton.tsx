'use client';

import React from 'react';
import { Badge, Button } from '@mui/material';
import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined';
import { LIBRARY_PANEL_ID } from './LibraryPanel';

interface LibraryButtonProps {
  open: boolean;
  notesCount: number;
  onToggle: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}

/** Toggles the Library panel. The badge shows how many notes the user has. */
export default function LibraryButton({ open, notesCount, onToggle, ref }: LibraryButtonProps) {
  return (
    <Badge badgeContent={notesCount} color="primary" max={99} overlap="rectangular">
      <Button
        ref={ref}
        variant={open ? 'contained' : 'outlined'}
        color="secondary"
        startIcon={<CollectionsBookmarkOutlinedIcon />}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open ? LIBRARY_PANEL_ID : undefined}
        aria-label={`Library, ${notesCount} ${notesCount === 1 ? 'note' : 'notes'}`}
        sx={{ fontWeight: 'bold' }}
      >
        Library
      </Button>
    </Badge>
  );
}
