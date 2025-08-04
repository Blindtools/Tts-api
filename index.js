const express = require('express');
const googleTTS = require('google-tts-api');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Free Google TTS API is running. Use /tts?text=YourText');
});

app.get('/tts', async (req, res) => {
  const text = req.query.text || 'Hello from your TTS API!';
  const lang = req.query.lang || 'en';

  try {
    const url = googleTTS.getAudioUrl(text, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).send('❌ Error generating TTS: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
