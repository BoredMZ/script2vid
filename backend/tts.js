const fs = require('fs');
const { exec } = require('child_process');

function generateTTS(text, outputPath, accent) {
  return new Promise((resolve, reject) => {
    // Write text to temp file
    const tempTextPath = outputPath.replace(/\.mp3$/, '.txt');
    require('fs').writeFileSync(tempTextPath, text, 'utf8');
    const safeOutputPath = outputPath.replace(/\\/g, "\\\\");
    const safeTextPath = tempTextPath.replace(/\\/g, "\\\\");
    // Python command reads text from file
    const pyCmd = `"E:\\python\\python" -c "from gtts import gTTS; t=open('${safeTextPath}', encoding='utf8').read(); gTTS(text=t, lang='${accent}').save('${safeOutputPath}')"`;
    exec(pyCmd, (error) => {
      // Clean up temp file
      require('fs').unlinkSync(tempTextPath);
      if (error) return reject(error);
      resolve(outputPath);
    });
  });
}

module.exports = { generateTTS };
