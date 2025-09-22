const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PEXELS_API_KEY = 'hUG0ebo78PSNT8LMoYsJpdBEcv9reJe0UtlXggTQ2XYrLRQgmP9G2Kvb';

async function downloadFile(url, outputPath) {
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    response.data.pipe(stream);
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

async function generateAIVideo(script, outputPath) {
  // Use first 3 words of script as search keywords
  const keywords = script.split(' ').slice(0, 3).join(' ');
  const apiUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=1`;
  let videoUrl = null;
  try {
    const response = await axios.get(apiUrl, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    if (response.data.videos && response.data.videos.length > 0) {
      const videoFile = response.data.videos[0].video_files.find(f => f.quality === 'sd' || f.quality === 'hd') || response.data.videos[0].video_files[0];
      videoUrl = videoFile.link;
    }
  } catch (err) {
    // Log error but continue
    console.error('Pexels API error:', err.message);
  }
  // Fallback video if no result
  if (!videoUrl) {
    // Use a local sample video as fallback
    const fallbackPath = path.join(__dirname, 'sample.mp4');
    fs.copyFileSync(fallbackPath, outputPath);
    return outputPath;
  }
  await downloadFile(videoUrl, outputPath);
  return outputPath;
}

module.exports = { generateAIVideo };
