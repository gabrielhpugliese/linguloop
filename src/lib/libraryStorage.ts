import { useSyncExternalStore } from 'react';

/**
 * Client-side library store: watch history, notes and Library panel prefs,
 * persisted in localStorage.
 *
 * Nothing touches localStorage during render. Data is loaded the first time a
 * component subscribes (React subscribes in the commit phase, like an effect),
 * or lazily by the first mutation. The server snapshot is always empty, so the
 * hydrated markup never depends on what the browser has stored.
 */

export interface VideoData {
  id: string;
  title: string;
  /** CEFR level, or 'Any' for "All levels" (empty on very old entries). */
  cefr: string;
  language?: string;
  /** Goal id from src/lib/catalog.ts (grammar, listening, ...). Missing on older entries. */
  goal?: string;
  /** Goal option id (e.g. a grammar topic); '' when none. */
  option?: string;
  /** Display line, e.g. "🇩🇪 B1 · Grammar · Dative case". */
  summary?: string;
}

export interface HistoryEntry extends VideoData {
  /** Epoch ms. Missing on entries saved before this field existed. */
  watchedAt?: number;
}

export interface NoteEntry {
  /** Metadata may be a placeholder (empty title) for notes migrated without history info. */
  video: VideoData;
  text: string;
  /** Epoch ms. 0 means unknown (migrated legacy note). */
  updatedAt: number;
}

export type LibraryTab = 'notes' | 'history';

export interface LibraryUiPrefs {
  open: boolean;
  /** Last tab the user picked; null until they pick one. */
  tab: LibraryTab | null;
}

export interface LibrarySnapshot {
  loaded: boolean;
  /** Most recent first (new entries are always prepended). */
  history: HistoryEntry[];
  notes: Record<string, NoteEntry>;
  ui: LibraryUiPrefs;
}

export const HISTORY_LIMIT = 50;

const HISTORY_KEY = 'linguloop_history';
const NOTES_KEY = 'linguloop_notes';
const UI_KEY = 'linguloop_library_ui';
const LEGACY_NOTES_PREFIX = 'notes_';
const LEGACY_MIGRATED_KEY = 'linguloop_legacy_notes_migrated';

const EMPTY_SNAPSHOT: LibrarySnapshot = {
  loaded: false,
  history: [],
  notes: {},
  ui: { open: false, tab: null },
};

let snapshot: LibrarySnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

// ---------------------------------------------------------------------------
// Safe localStorage access
// ---------------------------------------------------------------------------

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readJson(key: string): unknown {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`LinguLoop: could not save "${key}" to localStorage`, error);
    return false;
  }
}

function listLegacyNoteKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(LEGACY_NOTES_PREFIX)) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Parsing / sanitising
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toVideoData(value: VideoData | HistoryEntry): VideoData {
  const video: VideoData = {
    id: value.id,
    title: value.title ?? '',
    cefr: value.cefr ?? '',
  };
  if (value.language) video.language = value.language;
  if (value.goal) video.goal = value.goal;
  if (value.option) video.option = value.option;
  if (value.summary) video.summary = value.summary;
  return video;
}

function parseVideo(value: unknown): VideoData | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id) return null;
  return {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : '',
    cefr: typeof value.cefr === 'string' ? value.cefr : '',
    ...(typeof value.language === 'string' && value.language ? { language: value.language } : {}),
    ...(typeof value.goal === 'string' && value.goal ? { goal: value.goal } : {}),
    ...(typeof value.option === 'string' && value.option ? { option: value.option } : {}),
    ...(typeof value.summary === 'string' && value.summary ? { summary: value.summary } : {}),
  };
}

function parseHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const entries: HistoryEntry[] = [];
  for (const item of value) {
    const video = parseVideo(item);
    if (!video || seen.has(video.id)) continue;
    seen.add(video.id);
    const watchedAt = isRecord(item) && typeof item.watchedAt === 'number' ? item.watchedAt : undefined;
    entries.push(watchedAt === undefined ? video : { ...video, watchedAt });
  }
  return entries.slice(0, HISTORY_LIMIT);
}

function parseNotes(value: unknown): Record<string, NoteEntry> {
  const notes: Record<string, NoteEntry> = {};
  if (!isRecord(value)) return notes;
  for (const [id, item] of Object.entries(value)) {
    if (!isRecord(item) || typeof item.text !== 'string' || item.text === '') continue;
    notes[id] = {
      video: parseVideo(item.video) ?? placeholderVideo(id),
      text: item.text,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : 0,
    };
  }
  return notes;
}

function parseUi(value: unknown): LibraryUiPrefs {
  if (!isRecord(value)) return { open: false, tab: null };
  return {
    open: value.open === true,
    tab: value.tab === 'notes' || value.tab === 'history' ? value.tab : null,
  };
}

function placeholderVideo(id: string): VideoData {
  return { id, title: '', cefr: '' };
}

/** Prefer metadata that actually has a title; never overwrite real metadata with a placeholder. */
function mergeVideo(existing: VideoData | undefined, incoming: VideoData): VideoData {
  if (incoming.title || !existing) return toVideoData(incoming);
  return existing;
}

// ---------------------------------------------------------------------------
// Legacy migration: `notes_<videoId>` (plain text) -> `linguloop_notes`
// ---------------------------------------------------------------------------

/**
 * Imports legacy per-video note keys that have not been imported before.
 * Legacy keys are left in place; the list of imported ids is remembered so a
 * note the user later deletes is not resurrected on the next visit.
 */
function migrateLegacyNotes(history: HistoryEntry[], notes: Record<string, NoteEntry>): Record<string, NoteEntry> {
  const legacyKeys = listLegacyNoteKeys();
  if (legacyKeys.length === 0) return notes;

  const migratedRaw = readJson(LEGACY_MIGRATED_KEY);
  const migrated = new Set(Array.isArray(migratedRaw) ? migratedRaw.filter((id): id is string => typeof id === 'string') : []);

  const historyIndex = new Map(history.map((entry, index) => [entry.id, index]));
  const pending = legacyKeys
    .map((key) => key.slice(LEGACY_NOTES_PREFIX.length))
    .filter((id) => id && !migrated.has(id))
    // Keep the most recently watched first; unknown videos go last.
    .sort((a, b) => (historyIndex.get(a) ?? Infinity) - (historyIndex.get(b) ?? Infinity));
  if (pending.length === 0) return notes;

  const next = { ...notes };
  for (const id of pending) {
    const text = readRaw(LEGACY_NOTES_PREFIX + id);
    // The new store wins if it already has this note; empty legacy notes are skipped.
    if (!text || next[id]) continue;
    const historyEntry = history.find((entry) => entry.id === id);
    next[id] = {
      video: historyEntry ? toVideoData(historyEntry) : placeholderVideo(id),
      text,
      updatedAt: historyEntry?.watchedAt ?? 0,
    };
  }

  // Only mark as migrated once the notes are safely stored.
  if (writeJson(NOTES_KEY, next)) {
    for (const id of pending) migrated.add(id);
    writeJson(LEGACY_MIGRATED_KEY, Array.from(migrated));
    return next;
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Store plumbing
// ---------------------------------------------------------------------------

function emit() {
  for (const listener of listeners) listener();
}

function ensureLoaded() {
  if (snapshot.loaded || typeof window === 'undefined') return;
  const history = parseHistory(readJson(HISTORY_KEY));
  const notes = migrateLegacyNotes(history, parseNotes(readJson(NOTES_KEY)));
  snapshot = { loaded: true, history, notes, ui: parseUi(readJson(UI_KEY)) };
}

/** Keep tabs in sync: another tab rewrote history or notes. UI prefs stay per-tab while open. */
function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== HISTORY_KEY && event.key !== NOTES_KEY) return;
  snapshot = {
    ...snapshot,
    history: parseHistory(readJson(HISTORY_KEY)),
    notes: parseNotes(readJson(NOTES_KEY)),
  };
  emit();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', handleStorageEvent);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', handleStorageEvent);
  };
}

function update(next: Partial<LibrarySnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

export function useLibrary(): LibrarySnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY_SNAPSHOT);
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function hasNoteContent(note: NoteEntry | undefined): note is NoteEntry {
  return !!note && note.text.trim().length > 0;
}

/** Notes with visible content, most recently updated first. */
export function getSortedNotes(notes: Record<string, NoteEntry>): NoteEntry[] {
  return Object.values(notes)
    .filter(hasNoteContent)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---------------------------------------------------------------------------
// Mutations (call from event handlers / async callbacks only)
// ---------------------------------------------------------------------------

/** Adds a freshly watched video to the top of history and refreshes metadata on its note, if any. */
export function recordWatch(video: VideoData) {
  ensureLoaded();
  const entry: HistoryEntry = { ...toVideoData(video), watchedAt: Date.now() };
  const history = [entry, ...snapshot.history.filter((item) => item.id !== video.id)].slice(0, HISTORY_LIMIT);
  writeJson(HISTORY_KEY, history);

  const existingNote = snapshot.notes[video.id];
  if (existingNote) {
    const notes = { ...snapshot.notes, [video.id]: { ...existingNote, video: mergeVideo(existingNote.video, video) } };
    writeJson(NOTES_KEY, notes);
    update({ history, notes });
  } else {
    update({ history });
  }
}

export function removeFromHistory(videoId: string) {
  ensureLoaded();
  const history = snapshot.history.filter((item) => item.id !== videoId);
  writeJson(HISTORY_KEY, history);
  update({ history });
}

/** Clears watch history only; notes are stored separately and are kept. */
export function clearHistory() {
  ensureLoaded();
  writeJson(HISTORY_KEY, []);
  update({ history: [] });
}

/** Saves the note text for a video. An empty text removes the note. */
export function setNoteText(video: VideoData, text: string) {
  ensureLoaded();
  const notes = { ...snapshot.notes };
  if (text === '') {
    delete notes[video.id];
  } else {
    notes[video.id] = {
      video: mergeVideo(notes[video.id]?.video, video),
      text,
      updatedAt: Date.now(),
    };
  }
  writeJson(NOTES_KEY, notes);
  update({ notes });
}

export function deleteNote(videoId: string) {
  ensureLoaded();
  const notes = { ...snapshot.notes };
  delete notes[videoId];
  writeJson(NOTES_KEY, notes);
  update({ notes });
}

export function setLibraryOpen(open: boolean) {
  ensureLoaded();
  const ui = { ...snapshot.ui, open };
  writeJson(UI_KEY, ui);
  update({ ui });
}

export function setLibraryTab(tab: LibraryTab) {
  ensureLoaded();
  const ui = { ...snapshot.ui, tab };
  writeJson(UI_KEY, ui);
  update({ ui });
}
