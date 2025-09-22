const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Script2Vid backend running');
});

const path = require('path');
const { generateTTS } = require('./tts');

app.post('/api/tts', async (req, res) => {
  const { script, accent } = req.body;
  if (!script) return res.status(400).json({ error: 'No script provided' });
  const filename = `tts_${Date.now()}.mp3`;
  const outputPath = path.join(__dirname, 'uploads', filename);
  try {
    await generateTTS(script, outputPath, accent); // Pass accent if needed
    res.json({ audioUrl: `/uploads/${filename}` });
  } catch (err) {
    console.error('TTS generation error:', err); // <-- Add this line
    res.status(500).json({ error: 'TTS generation failed', details: err.message });
  }
});

const { generateAIVideo } = require('./video');

app.post('/api/generate-video', async (req, res) => {
  const prompt = req.body.prompt || req.body.script;
  if (!prompt) return res.status(400).json({ error: 'No video prompt provided' });
  const filename = `ai_video_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, 'uploads', filename);
  try {
    await generateAIVideo(prompt, outputPath);
    res.json({ videoUrl: `/uploads/${filename}` });
  } catch (err) {
    res.status(500).json({ error: 'AI video generation failed', details: err.message });
  }
});

// Video upload endpoint
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  res.json({ videoUrl: `/uploads/${req.file.filename}` });
});


const { combineVideoAudioText } = require('./combine');

app.post('/api/combine', async (req, res) => {
  const { script, accent } = req.body;
  if (!script) return res.status(400).json({ error: 'Missing script' });
  // Split script into segments
  const segments = script.match(/[^.!?]+[.!?]+/g) || [script];
  const videoPaths = [];
  const audioPaths = [];
  // Generate TTS and video for each segment
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (!seg) continue;
    // TTS
    const ttsFilename = `tts_seg${i}_${Date.now()}.mp3`;
    const ttsPath = path.join(__dirname, 'uploads', ttsFilename);
    await generateTTS(seg, ttsPath, accent || 'en');
    audioPaths.push(ttsPath);
    // Video
    const vidFilename = `ai_video_seg${i}_${Date.now()}.mp4`;
    const vidPath = path.join(__dirname, 'uploads', vidFilename);
    await generateAIVideo(seg, vidPath);
    videoPaths.push(vidPath);
  }
  // Combine all segments
  const filename = `final_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, 'uploads', filename);
  try {
    // Pass all video/audio paths and segments to combineVideoAudioText for full multi-segment video
    await combineVideoAudioText(videoPaths, audioPaths, segments, outputPath);
    // Delete temp segment files
    const fs = require('fs');
    for (const p of [...videoPaths, ...audioPaths]) {
      try { fs.unlinkSync(p); } catch (e) { /* ignore */ }
    }
    res.json({ finalVideoUrl: `/uploads/${filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Video combining failed', details: err.toString() });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
