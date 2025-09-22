
const { exec } = require('child_process');
const path = require('path');

// Helper: Split script into sentences (basic)
function splitScript(script) {
  return script.match(/[^.!?]+[.!?]+/g) || [script];
}

async function combineVideoAudioText(videoPath, audioPath, text, outputPath) {
  // Accept arrays of video/audio paths and segments
  // Save lists to temp files for Python
  const tempVideosPath = path.join(__dirname, 'uploads', `videos_${Date.now()}.txt`);
  const tempAudiosPath = path.join(__dirname, 'uploads', `audios_${Date.now()}.txt`);
  const tempScriptPath = path.join(__dirname, 'uploads', `segments_${Date.now()}.txt`);
  require('fs').writeFileSync(tempVideosPath, videoPath.join('\n'));
  require('fs').writeFileSync(tempAudiosPath, audioPath.join('\n'));
  require('fs').writeFileSync(tempScriptPath, text.join('\n'));
  // Escape paths
  const safeVideosPath = tempVideosPath.replace(/\\/g, "\\\\");
  const safeAudiosPath = tempAudiosPath.replace(/\\/g, "\\\\");
  const safeScriptPath = tempScriptPath.replace(/\\/g, "\\\\");
  const safeOutputPath = outputPath.replace(/\\/g, "\\\\");
  // Call Python script with lists
  const pyCmd = `"E:\\python\\python" video_edit.py "${safeVideosPath}" "${safeAudiosPath}" "${safeScriptPath}" "${safeOutputPath}"`;
  return new Promise((resolve, reject) => {
    exec(pyCmd, { cwd: __dirname }, (error, stdout, stderr) => {
      // Clean up temp files
      require('fs').unlinkSync(tempVideosPath);
      require('fs').unlinkSync(tempAudiosPath);
      require('fs').unlinkSync(tempScriptPath);
      if (error) return reject(stderr || error);
      resolve(outputPath);
    });
  });
}

module.exports = { combineVideoAudioText };
