const express = require('express');
const googleTTS = require('google-tts-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Unlimited Google TTS API is running. Use /tts?text=YourText&lang=en');
});

app.get('/tts', async (req, res) => {
  const text = req.query.text || 'Hello from your Unlimited TTS API!';
  const lang = req.query.lang || 'en';

  try {
    // 1. Split into chunks of ≤200 characters
    const chunkSize = 200;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    // 2. Download each chunk as an mp3
    const tempFiles = [];
    for (let i = 0; i < chunks.length; i++) {
      const url = googleTTS.getAudioUrl(chunks[i], {
        lang,
        slow: false,
        host: 'https://translate.google.com',
      });

      const tempPath = path.join(__dirname, `temp_${i}.mp3`);
      const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, response.data);
      tempFiles.push(tempPath);
    }

    // 3. Merge all mp3 files
    const outputPath = path.join(__dirname, 'output.mp3');
    await new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg();
      tempFiles.forEach(file => ffmpegCommand.input(file));
      ffmpegCommand
        .on('error', reject)
        .on('end', resolve)
        .mergeToFile(outputPath, __dirname);
    });

    // 4. Send merged mp3 to user
    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(outputPath).pipe(res).on('finish', () => {
      // Cleanup
      tempFiles.forEach(file => fs.unlinkSync(file));
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });

  } catch (err) {
    res.status(500).send('❌ Error generating TTS: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Unlimited TTS Server running on http://localhost:${PORT}`);
});

