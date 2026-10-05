import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/temporal-field-scan
// Analyzes a historical portal site + optical stock calibration and returns structured archival continuity notes
app.post('/api/temporal-field-scan', async (req, res) => {
  try {
    const { siteTitle, locationName, pastYear, archivalSummary, stockName, splitPercent } = req.body;

    const ai = getGenAIClient();
    const prompt = `You are the Chief Optical Historian and Spatial Archaeologist for ChronoLens AR.
Analyze the following Augmented-Reality Time-Capsule portal alignment:
- Site: ${siteTitle} (${locationName})
- Historical Plate Year: ${pastYear} vs Present Baseline: 2026
- Archival Context: ${archivalSummary}
- Active Emulsion Stock: ${stockName}
- Temporal Split Curtain: ${splitPercent}%

Provide a concise, authoritative field report with:
1. architecturalContinuity: 2 sentences detailing specific structural fiducials (cornices, stone plinths, rooflines, or steel towers) that anchor the ${pastYear} frame to 2026 reality.
2. opticalNotes: 2 sentences on how the ${stockName} spectral curve and dynamic range reveal texture differences between the historical emulsion and modern digital optics.
3. suggestedCapsuleNote: A poetic yet precise 2-sentence inscription suitable for sealing inside a geo-anchored time capsule at this exact coordinate.
4. narrationScript: A vivid 2-sentence spoken field dispatch (under 45 words) written to be read aloud over the camera viewfinder.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            architecturalContinuity: { type: Type.STRING },
            opticalNotes: { type: Type.STRING },
            suggestedCapsuleNote: { type: Type.STRING },
            narrationScript: { type: Type.STRING },
          },
          required: ['architecturalContinuity', 'opticalNotes', 'suggestedCapsuleNote', 'narrationScript'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini model.');
    }
    const parsed = JSON.parse(text.trim());
    res.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run temporal field scan.';
    res.status(500).json({ error: message });
  }
});

// POST /api/temporal-tts
// Generates a spoken WAV audio dispatch for the sonic time-capsule narration using gemini-3.8-flash-lite-tts
app.post('/api/temporal-tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Narration text is required.' });
      return;
    }

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Measured, documentary archival historian and optical field engineer',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio data returned from TTS model.');
    }

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to synthesize field audio.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChronoLens AR server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
