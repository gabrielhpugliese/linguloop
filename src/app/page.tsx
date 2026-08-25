'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, 
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  FormGroup, Checkbox, ToggleButton, ToggleButtonGroup, Button,
  TextField, Switch, Grid, Chip, Tabs, Tab, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemButton, Divider
} from '@mui/material';
const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const supportedLanguages = ['German', 'English', 'Spanish', 'Portuguese'];
const languageFlags: Record<string, string> = {
  German: '🇩🇪',
  English: '🇬🇧',
  Spanish: '🇪🇸',
  Portuguese: '🇧🇷'
};

const grammarTopicsByLanguage: Record<string, Record<string, string[]>> = {
  German: {
    'A1': ['Articles (Der, Die, Das, ein, eine)', 'Personal Pronouns', 'Present Tense (Präsens)', 'Separable Verbs (Trennbare Verben)', 'Modal Verbs (können, müssen, wollen)', 'Possessive Articles (mein, dein)', 'Negation (nicht, kein)', 'Basic Imperative (Imperativ)', 'W-Questions'],
    'A2': ['Perfect Tense (Perfekt)', 'Preterite (Präteritum)', 'Dative Case (Dativ)', 'Accusative Case (Akkusativ)', 'Two-Way Prepositions (Wechselpräpositionen)', 'Adjective Declension (Adjektivdeklination)', 'Reflexive Verbs', 'Subordinate Clauses (weil, dass, wenn)', 'Comparison (Komparativ & Superlativ)'],
    'B1': ['Passive Voice (Passiv - Präsens & Perfekt)', 'Subjunctive II (Konjunktiv II - Höflichkeit, Irrealis)', 'Relative Clauses (Relativsätze)', 'Infinitive with "zu"', 'Future Tense (Futur I)', 'Genitive Case (Genitiv)', 'n-Declension (n-Deklination)', 'Past Perfect (Plusquamperfekt)', 'Multi-part Connectors (entweder...oder)'],
    'B2': ['Participles as Adjectives (Partizip I & II)', 'Passive Alternatives (sich lassen, sein zu)', 'Subjective Use of Modals', 'Subjunctive I (Konjunktiv I - Indirekte Rede)', 'Noun-Verb Connections (Nomen-Verb-Verbindungen)', 'Advanced Prepositions (wegen, trotz)', 'Future II (Futur II)'],
    'C1': ['Extended Adjective Modifiers (Erweiterte Adjektivattribute)', 'Nominalization & Verbalization', 'Complex Sentence Structures (Schachtelsätze)', 'Stylistic Devices (Stilmittel)', 'Idioms and Phrasal Verbs'],
    'C2': ['Extended Adjective Modifiers (Erweiterte Adjektivattribute)', 'Nominalization & Verbalization', 'Complex Sentence Structures (Schachtelsätze)', 'Stylistic Devices (Stilmittel)', 'Idioms and Phrasal Verbs']
  },
  English: {
    'A1': ['To be', 'Present Simple', 'Pronouns', 'Articles (a/an/the)', 'Plurals', 'There is / There are'],
    'A2': ['Past Simple', 'Present Continuous', 'Comparatives / Superlatives', 'Future (will / going to)', 'Modal Verbs (can, must, should)'],
    'B1': ['Present Perfect', 'First Conditional', 'Passive Voice (Present / Past)', 'Relative Clauses'],
    'B2': ['Second / Third Conditional', 'Past Perfect', 'Reported Speech', 'Phrasal Verbs'],
    'C1': ['Mixed Conditionals', 'Inversion', 'Advanced Passives', 'Participle Clauses', 'Advanced Phrasal Verbs'],
    'C2': ['Mixed Conditionals', 'Inversion', 'Advanced Passives', 'Participle Clauses', 'Advanced Phrasal Verbs']
  },
  Spanish: {
    'A1': ['Ser / Estar', 'Presente de Indicativo', 'Artículos y Género', 'Pronombres Personales', 'Verbos Reflexivos', 'Gustar'],
    'A2': ['Pretérito Indefinido', 'Pretérito Imperfecto', 'Futuro Próximo', 'Imperativo Afirmativo', 'Comparativos'],
    'B1': ['Subjuntivo (Presente)', 'Pretérito Perfecto', 'Condicional Simple', 'Por vs Para', 'Voz Pasiva'],
    'B2': ['Subjuntivo (Imperfecto)', 'Pluscuamperfecto', 'Oraciones de Relativo', 'Estilo Indirecto'],
    'C1': ['Subjuntivo Avanzado', 'Perífrasis Verbales', 'Expresiones Idiomáticas', 'Conectores Complejos', 'Verbos de Cambio'],
    'C2': ['Subjuntivo Avanzado', 'Perífrasis Verbales', 'Expresiones Idiomáticas', 'Conectores Complejos', 'Verbos de Cambio']
  },
  Portuguese: {
    'A1': ['Ser / Estar / Ter', 'Presente do Indicativo', 'Artigos', 'Contrações', 'Verbos Regulares', 'Pronomes'],
    'A2': ['Pretérito Perfeito', 'Pretérito Imperfeito', 'Futuro do Presente', 'Imperativo', 'Comparativos'],
    'B1': ['Subjuntivo (Presente)', 'Pretérito Mais-Que-Perfeito', 'Futuro do Subjuntivo', 'Voz Passiva', 'Pronomes Relativos'],
    'B2': ['Subjuntivo (Imperfeito)', 'Infinitivo Pessoal', 'Discurso Indireto', 'Conjunções'],
    'C1': ['Tempos Compostos', 'Subjuntivo Avançado', 'Expressões Idiomáticas', 'Colocação Pronominal Avançada'],
    'C2': ['Tempos Compostos', 'Subjuntivo Avançado', 'Expressões Idiomáticas', 'Colocação Pronominal Avançada']
  }
};
const videoFormats = [
  'Tutorials', 'Street Interviews', 'Vlogs', 
  'Podcasts', 'News & Documentaries', 'Cartoons / Stories', 
  'Music / Lyrics', 'Shadowing (Pronunciation)', 'Movies & TV Shows', 'Shorts',
  'Exam Prep / Mock Tests'
];

interface VideoData {
  id: string;
  title: string;
  cefr: string;
  grammar: string[];
  format: string;
  language?: string;
}

export default function Home() {
  const [language, setLanguage] = useState<string>('German');
  const [cefr, setCefr] = useState<string>('');
  const [grammar, setGrammar] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<number>(0);

  const currentGrammarTopics = grammarTopicsByLanguage[language];
  const allGrammarTopics = Array.from(new Set(Object.values(currentGrammarTopics).flat()));
  
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [blindCorrection, setBlindCorrection] = useState<boolean>(false);
  const [watchHistory, setWatchHistory] = useState<VideoData[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('linguloop_history');
    if (savedHistory) {
      try {
        setWatchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  // Load random video initially or when 'Next Random Video' is clicked
  const loadRandomVideo = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('language', language);
      if (cefr) params.append('cefr', cefr);
      if (grammar.length > 0) params.append('grammar', grammar.join(' '));
      if (formats.length > 0) params.append('format', formats.join(','));

      const res = await fetch(`/api/videos?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setCurrentVideo(data);
      
      setWatchHistory(prev => {
        const newHistory = [data, ...prev.filter(v => v.id !== data.id)].slice(0, 50); // Keep last 50
        localStorage.setItem('linguloop_history', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      console.error(error);
      alert("No videos match the selected filters or there was an error fetching from YouTube.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRandomVideo();
  }, []);

  // Handle local storage for notes
  useEffect(() => {
    if (currentVideo) {
      const savedNotes = localStorage.getItem(`notes_${currentVideo.id}`);
      if (savedNotes) {
        setNotes(savedNotes);
      } else {
        setNotes('');
      }
    }
  }, [currentVideo]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (currentVideo) {
      localStorage.setItem(`notes_${currentVideo.id}`, newNotes);
    }
  };

  const handleGrammarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const topic = event.target.name;
    setGrammar(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };



  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 4, lg: 3.6 }}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Paper className="glass-panel" sx={{ p: 2, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }} color="primary">
                LinguLoop Filters
              </Typography>

              {/* Target Language */}
              <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                <FormLabel color="secondary">Target Language</FormLabel>
                <Select
                  value={language}
                  size="small"
                  onChange={(e) => {
                    setLanguage(e.target.value as string);
                    setCefr('');
                    setGrammar([]);
                    setFormats([]);
                  }}
                  sx={{ mt: 1 }}
                >
                  {supportedLanguages.map(lang => (
                    <MenuItem key={lang} value={lang}>
                      <span style={{ marginRight: '8px' }}>{languageFlags[lang]}</span> {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* CEFR Level - Always Visible */}
              <FormControl component="fieldset" sx={{ mt: 1, display: 'block' }}>
                <FormLabel component="legend" color="secondary">CEFR Level</FormLabel>
                <RadioGroup
                  row
                  value={cefr}
                  onChange={(e) => {
                    setCefr(e.target.value);
                    setGrammar([]);
                  }}
                >
                  <FormControlLabel value="" control={<Radio size="small" />} label="Any" />
                  {cefrLevels.map(level => (
                    <FormControlLabel key={level} value={level} control={<Radio size="small" />} label={level} />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Tabs for Grammar and Format */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1, mb: 1 }}>
                <Tabs value={filterTab} onChange={(e, val) => setFilterTab(val)} variant="fullWidth">
                  <Tab label={`Grammar ${grammar.length > 0 ? `(${grammar.length})` : ''}`} sx={{ fontWeight: 'bold' }} />
                  <Tab label={`Format ${formats.length > 0 ? `(${formats.length})` : ''}`} sx={{ fontWeight: 'bold' }} />
                </Tabs>
              </Box>

              {/* Scrollable Tab Content */}
              <Box sx={{ 
                maxHeight: 295, 
                overflowY: 'auto', 
                pr: 1, 
                mb: 2,
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' },
                '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '10px' },
                '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
              }}>
                {filterTab === 0 && (
                  <FormControl component="fieldset" sx={{ display: 'block' }}>
                    <FormGroup>
                      {(cefr ? currentGrammarTopics[cefr] : allGrammarTopics).map(topic => (
                        <FormControlLabel
                          key={topic}
                          control={
                            <Checkbox 
                              checked={grammar.includes(topic)} 
                              onChange={handleGrammarChange} 
                              name={topic} 
                              size="small"
                            />
                          }
                          label={topic}
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                )}

                {filterTab === 1 && (
                  <FormControl component="fieldset" sx={{ display: 'block' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {videoFormats.map(f => (
                        <Chip
                          key={f}
                          label={f}
                          clickable
                          color={formats.includes(f) ? "primary" : "default"}
                          onClick={() => {
                            setFormats(prev => 
                              prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
                            );
                          }}
                        />
                      ))}
                    </Box>
                  </FormControl>
                )}
              </Box>

              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
                onClick={loadRandomVideo}
                disabled={isLoading}
              >
                {isLoading ? 'Searching YouTube...' : 'Next Random Video'}
              </Button>

              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth 
                sx={{ mt: 1, py: 1, fontWeight: 'bold' }}
                onClick={() => setIsLibraryOpen(true)}
              >
                My Library & Notes ({watchHistory.length})
              </Button>
            </Paper>

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
          {currentVideo ? (
            <Box>
              <Paper className="glass-panel" sx={{ overflow: 'hidden', mb: 4 }}>
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <iframe
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={`https://www.youtube.com/embed/${currentVideo.id}`}
                    title={currentVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
                <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold' }}>[{currentVideo.cefr}]</Typography>
                  <Typography variant="body2">{currentVideo.title}</Typography>
                </Box>
              </Paper>

              <Paper className="glass-panel" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>My Notes</Typography>
                  <FormControlLabel
                    control={<Switch checked={blindCorrection} onChange={(e) => setBlindCorrection(e.target.checked)} color="secondary" />}
                    label="Blind Correction"
                  />
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
                      filter: blindCorrection ? 'blur(8px)' : 'none',
                      transition: 'filter 0.3s ease, opacity 0.3s ease',
                      opacity: blindCorrection ? 0.3 : 1,
                    }
                  }}
                />
              </Paper>
            </Box>
          ) : (
            <Typography>Loading video...</Typography>
          )}
        </Grid>
      </Grid>
      
      {/* Library Modal */}
      <Dialog open={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>My Library & Notes</DialogTitle>
        <DialogContent dividers>
          {watchHistory.length === 0 ? (
            <Typography color="text.secondary">You haven't watched any videos yet.</Typography>
          ) : (
            <List>
              {watchHistory.map((video) => {
                const hasNotes = !!localStorage.getItem(`notes_${video.id}`);
                return (
                  <React.Fragment key={video.id}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => {
                        setCurrentVideo(video);
                        setIsLibraryOpen(false);
                      }}>
                        <ListItemText 
                          primary={video.title} 
                          secondary={`Language: ${video.language || 'German'} | CEFR: ${video.cefr || 'Any'}`} 
                        />
                        {hasNotes && (
                          <Chip label="📝 Notes" size="small" color="primary" variant="outlined" />
                        )}
                      </ListItemButton>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => {
            if(window.confirm('Are you sure you want to clear your history? This will NOT delete your notes.')) {
              setWatchHistory([]);
              localStorage.removeItem('linguloop_history');
            }
          }}>
            Clear History
          </Button>
          <Button onClick={() => setIsLibraryOpen(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
