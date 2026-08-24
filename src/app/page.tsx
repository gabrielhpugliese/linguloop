'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, 
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  FormGroup, Checkbox, ToggleButton, ToggleButtonGroup, Button,
  TextField, Switch, Grid
} from '@mui/material';
const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const grammarTopics = ['Passive Voice', 'Connectors', 'Cases', 'Modal Verbs'];
const videoFormats = ['Tutorials', 'Street Interviews', 'Vlogs'];

interface VideoData {
  id: string;
  title: string;
  cefr: string;
  grammar: string[];
  format: string;
}

export default function Home() {
  const [cefr, setCefr] = useState<string>('');
  const [grammar, setGrammar] = useState<string[]>([]);
  const [format, setFormat] = useState<string>('');
  
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [blindCorrection, setBlindCorrection] = useState<boolean>(false);

  // Load random video initially or when 'Next Random Video' is clicked
  const loadRandomVideo = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cefr) params.append('cefr', cefr);
      if (grammar.length > 0) params.append('grammar', grammar.join(' '));
      if (format) params.append('format', format);

      const res = await fetch(`/api/videos?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setCurrentVideo(data);
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

  const handleFormatChange = (
    event: React.MouseEvent<HTMLElement>,
    newFormat: string | null,
  ) => {
    if (newFormat !== null) {
      setFormat(newFormat);
    } else {
      setFormat('');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 4, lg: 3.6 }}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Paper className="glass-panel" sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }} color="primary">
                LinguLoop Filters
              </Typography>

              {/* CEFR Level */}
              <FormControl component="fieldset" sx={{ mt: 2, display: 'block' }}>
                <FormLabel component="legend" color="secondary">CEFR Level</FormLabel>
                <RadioGroup
                  row
                  value={cefr}
                  onChange={(e) => setCefr(e.target.value)}
                >
                  <FormControlLabel value="" control={<Radio size="small" />} label="Any" />
                  {cefrLevels.map(level => (
                    <FormControlLabel key={level} value={level} control={<Radio size="small" />} label={level} />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Grammar Topics */}
              <FormControl component="fieldset" sx={{ mt: 3, display: 'block' }}>
                <FormLabel component="legend" color="secondary">Grammar Topics</FormLabel>
                <FormGroup>
                  {grammarTopics.map(topic => (
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

              {/* Video Format */}
              <FormControl component="fieldset" sx={{ mt: 3, display: 'block' }}>
                <FormLabel component="legend" color="secondary" sx={{ mb: 1 }}>Video Format</FormLabel>
                <ToggleButtonGroup
                  value={format}
                  exclusive
                  onChange={handleFormatChange}
                  aria-label="video format"
                  size="small"
                  fullWidth
                >
                  {videoFormats.map(f => (
                    <ToggleButton key={f} value={f} aria-label={f}>
                      {f}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </FormControl>

              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 4, py: 1.5, fontWeight: 'bold' }}
                onClick={loadRandomVideo}
                disabled={isLoading}
              >
                {isLoading ? 'Searching YouTube...' : 'Next Random Video'}
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
    </Container>
  );
}
