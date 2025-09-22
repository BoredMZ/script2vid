
function App() {
  const [script, setScript] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [video, setVideo] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accent, setAccent] = useState('en');

  const handleScriptChange = (e) => setScript(e.target.value);
  const handleVideoPromptChange = (e) => setVideoPrompt(e.target.value);
  const handleVideoChange = (e) => setVideo(e.target.files[0]);
  const handleUseAIChange = (e) => setUseAI(e.target.checked);
  const handleAccentChange = (e) => setAccent(e.target.value);

  const handleGenerate = async () => {
    setFinalVideoUrl('');
    setError('');
    setLoading(true);
    try {
      // TTS
      const ttsRes = await fetch('https://script2vid-eggb.onrender.com/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, accent })
      });
      if (!ttsRes.ok) {
        const err = await ttsRes.json();
        setError('TTS Error: ' + (err.error || ttsRes.statusText));
        setLoading(false);
        return;
      }
      const ttsData = await ttsRes.json();
      setAudioUrl(ttsData.audioUrl);

      // Video
      let vidUrl = '';
      if (useAI) {
        const vidRes = await fetch('https://script2vid-eggb.onrender.com/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: videoPrompt })
        });
        if (!vidRes.ok) {
          const err = await vidRes.json();
          setError('Video Error: ' + (err.error || vidRes.statusText));
          setLoading(false);
          return;
        }
        const vidData = await vidRes.json();
        setVideoUrl(vidData.videoUrl);
        vidUrl = vidData.videoUrl;
      } else if (video) {
        const formData = new FormData();
        formData.append('video', video);
        const uploadRes = await fetch('https://script2vid-eggb.onrender.com/api/upload-video', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        setVideoUrl(uploadData.videoUrl);
        vidUrl = uploadData.videoUrl;
      }

      // Combine video, audio, and text overlay
      if (ttsData.audioUrl && vidUrl) {
        const combineRes = await fetch('https://script2vid-eggb.onrender.com/api/combine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: vidUrl, audioUrl: ttsData.audioUrl, script })
        });
        if (!combineRes.ok) {
          const err = await combineRes.json();
          setError('Combine Error: ' + (err.error || combineRes.statusText));
          setLoading(false);
          return;
        }
        const combineData = await combineRes.json();
        if (combineData.finalVideoUrl) {
          setFinalVideoUrl(combineData.finalVideoUrl);
        } else {
          setError('No final video was generated.');
        }
      }
    } catch (err) {
      setError('Unexpected error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Script2Vid</h1>
      <div style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
        <b>Limitations & Warnings:</b>
        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
          <li>Voice options are limited to language/accent only (no gender or custom voices).</li>
          <li>AI video backgrounds are fetched from Pexels and may not always match your script perfectly. <br/>The first 3 words of your script are used as the basis for video search.</li>
          <li>Video and audio length are matched automatically; very long scripts or videos may take time to process.</li>
          <li>Text overlay uses ImageMagick and may fail if not installed/configured correctly.</li>
          <li>All generated content is for personal/non-commercial use unless you verify licensing.</li>
        </ul>
      </div>
      <textarea
        rows={6}
        style={{ width: '100%' }}
        placeholder="Enter your script here..."
        value={script}
        onChange={handleScriptChange}
      />
      <div style={{ margin: '16px 0' }}>
        <textarea
          rows={2}
          style={{ width: '100%' }}
          placeholder="Enter AI video prompt (used for video background generation)"
          value={videoPrompt}
          onChange={handleVideoPromptChange}
        />
      </div>
      <div style={{ margin: '16px 0' }}>
        <div style={{ marginBottom: 8, color: '#555' }}>
          <b>Note:</b> When "Generate video with AI" is selected, a royalty-free video background is fetched from Pexels based on your script.
        </div>
        <label>
          <input type="checkbox" checked={useAI} onChange={handleUseAIChange} />
          Generate video with AI
        </label>
        {!useAI && (
          <input type="file" accept="video/*" onChange={handleVideoChange} />
        )}
      </div>
      <div style={{ margin: '16px 0' }}>
        <label>
          Voice Accent/Language:
          <select value={accent} onChange={handleAccentChange}>
            <option value="en">English (US)</option>
            <option value="en-uk">English (UK)</option>
            <option value="en-au">English (Australia)</option>
            <option value="en-ca">English (Canada)</option>
            <option value="en-gh">English (Ghana)</option>
            <option value="en-in">English (India)</option>
            <option value="en-ie">English (Ireland)</option>
            <option value="en-nz">English (New Zealand)</option>
            <option value="en-ng">English (Nigeria)</option>
            <option value="en-ph">English (Philippines)</option>
            <option value="en-za">English (South Africa)</option>
            <option value="en-tz">English (Tanzania)</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="zh-cn">Chinese (Mandarin)</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
          </select>
        </label>
      </div>
      <button onClick={handleGenerate}>Generate</button>
      {loading && (
        <div style={{ margin: '32px 0', textAlign: 'center', color: '#007bff', fontWeight: 'bold' }}>
          Generating video and audio... Please wait.
        </div>
      )}
      {error && (
        <div style={{ margin: '16px 0', color: '#dc3545', fontWeight: 'bold', textAlign: 'center' }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        {audioUrl && <audio controls src={audioUrl} />}
        {videoUrl && <video controls src={videoUrl} style={{ width: '100%', marginTop: 16 }} />}
        {finalVideoUrl ? (
          <div style={{ marginTop: 32 }}>
            <h3>Final Video</h3>
            <video controls src={finalVideoUrl} style={{ width: '100%' }} />
            <a href={finalVideoUrl} download="final_video.mp4">
              <button style={{ marginTop: 8 }}>Download Final Video</button>
            </a>
          </div>
        ) : error && error.includes('No final video') && (
          <div style={{ marginTop: 32, color: '#dc3545', fontWeight: 'bold', textAlign: 'center' }}>
            Final video could not be generated.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
