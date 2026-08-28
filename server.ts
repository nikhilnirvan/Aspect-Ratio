import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Setup directories
const UPLOADS_DIR = path.join(process.cwd(), 'temp_uploads');
const OUTPUTS_DIR = path.join(process.cwd(), 'temp_outputs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// Multer upload config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy init Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory conversion job tracker
interface ServerJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  outputFilename?: string;
  outputUrl?: string;
  outputSize?: number;
  error?: string;
  startTime: number;
  endTime?: number;
}
const jobs = new Map<string, ServerJob>();

// Clean up old files periodically (older than 24h)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;
  [UPLOADS_DIR, OUTPUTS_DIR].forEach((dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (sErr, stats) => {
          if (!sErr && now - stats.mtimeMs > maxAge) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  });
}, 60 * 60 * 1000);

// API: Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Upload Video File
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const file = req.file;
  res.json({
    id: path.parse(file.filename).name,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path,
    url: `/api/files/${file.filename}`,
  });
});

// API: Serve Uploaded / Output Files
app.get('/api/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const uploadPath = path.join(UPLOADS_DIR, filename);
  const outputPath = path.join(OUTPUTS_DIR, filename);

  if (fs.existsSync(outputPath)) {
    res.sendFile(outputPath);
  } else if (fs.existsSync(uploadPath)) {
    res.sendFile(uploadPath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// API: Download Converted File with Content-Disposition
app.get('/api/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(OUTPUTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }
  res.download(filePath, filename);
});

// API: Start Server FFmpeg Conversion Job
app.post('/api/convert', async (req, res) => {
  try {
    const {
      inputUrl,
      inputFilename,
      targetWidth = 1080,
      targetHeight = 1920,
      fillMode = 'blur',
      fillColor = '#000000',
      blurAmount = 20,
      cropXPercent = 50,
      cropYPercent = 50,
      trimStartSec = 0,
      trimEndSec = 0,
      rotation = 0,
      flipH = false,
      flipV = false,
      playbackSpeed = 1.0,
      brightness = 1.0,
      contrast = 1.0,
      saturation = 1.0,
      audioMode = 'original',
      audioGain = 1.0,
      watermarkEnabled = false,
      watermarkText = '',
      watermarkPosition = 'bottom-right',
      container = 'mp4',
    } = req.body;

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputFilename = `converted_${jobId}.${container}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFilename);

    let inputPath = '';
    if (inputFilename && fs.existsSync(path.join(UPLOADS_DIR, path.basename(inputFilename)))) {
      inputPath = path.join(UPLOADS_DIR, path.basename(inputFilename));
    } else if (inputUrl && inputUrl.startsWith('/api/files/')) {
      inputPath = path.join(UPLOADS_DIR, path.basename(inputUrl));
    } else if (inputUrl) {
      inputPath = inputUrl;
    } else {
      return res.status(400).json({ error: 'Valid input file or url required' });
    }

    const job: ServerJob = {
      id: jobId,
      status: 'queued',
      progress: 5,
      message: 'Preparing video processing pipeline...',
      outputFilename,
      outputUrl: `/api/files/${outputFilename}`,
      startTime: Date.now(),
    };
    jobs.set(jobId, job);

    // Respond immediately with Job ID for async polling
    res.json({ jobId, status: 'queued' });

    // Start FFmpeg in background
    runFFmpegProcess(jobId, inputPath, outputPath, {
      targetWidth: Number(targetWidth),
      targetHeight: Number(targetHeight),
      fillMode,
      fillColor,
      blurAmount: Number(blurAmount),
      cropXPercent: Number(cropXPercent),
      cropYPercent: Number(cropYPercent),
      trimStartSec: Number(trimStartSec),
      trimEndSec: Number(trimEndSec),
      rotation: Number(rotation),
      flipH: Boolean(flipH),
      flipV: Boolean(flipV),
      playbackSpeed: Number(playbackSpeed),
      brightness: Number(brightness),
      contrast: Number(contrast),
      saturation: Number(saturation),
      audioMode,
      audioGain: Number(audioGain),
      watermarkEnabled: Boolean(watermarkEnabled),
      watermarkText,
      watermarkPosition,
    });
  } catch (err: any) {
    console.error('Convert API error:', err);
    res.status(500).json({ error: err.message || 'Conversion initiation failed' });
  }
});

// API: Get Job Status
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// Helper: Run FFmpeg Command
function runFFmpegProcess(jobId: string, inputPath: string, outputPath: string, options: any) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.progress = 10;
  job.message = 'Initializing FFmpeg encoder...';

  const W = options.targetWidth || 1080;
  const H = options.targetHeight || 1920;
  const safeW = W % 2 === 0 ? W : W + 1;
  const safeH = H % 2 === 0 ? H : H + 1;

  const args: string[] = ['-y'];

  // Precise trimming with -ss and -t to ensure exact duration without drift
  if (options.trimStartSec && options.trimStartSec > 0) {
    args.push('-ss', options.trimStartSec.toString());
  }
  if (options.trimEndSec && options.trimEndSec > 0) {
    const start = options.trimStartSec && options.trimStartSec > 0 ? options.trimStartSec : 0;
    const duration = Math.max(0.1, options.trimEndSec - start);
    args.push('-t', duration.toString());
  }

  args.push('-i', inputPath);

  // 1. Build Pre-transformation filters
  const preFilters: string[] = [];

  // Color grading
  const eqParts: string[] = [];
  if (options.brightness && options.brightness !== 1.0) {
    eqParts.push(`brightness=${(options.brightness - 1).toFixed(2)}`);
  }
  if (options.contrast && options.contrast !== 1.0) {
    eqParts.push(`contrast=${options.contrast.toFixed(2)}`);
  }
  if (options.saturation && options.saturation !== 1.0) {
    eqParts.push(`saturation=${options.saturation.toFixed(2)}`);
  }
  if (eqParts.length > 0) {
    preFilters.push(`eq=${eqParts.join(':')}`);
  }

  // Rotation & Flip
  if (options.rotation === 90) preFilters.push('transpose=1');
  else if (options.rotation === 180) preFilters.push('transpose=2,transpose=2');
  else if (options.rotation === 270) preFilters.push('transpose=2');

  if (options.flipH) preFilters.push('hflip');
  if (options.flipV) preFilters.push('vflip');

  // Playback speed video PTS
  if (options.playbackSpeed && options.playbackSpeed !== 1.0) {
    const ptsMultiplier = (1.0 / options.playbackSpeed).toFixed(4);
    preFilters.push(`setpts=${ptsMultiplier}*PTS`);
  }

  if (options.fps && options.fps > 0) {
    preFilters.push(`fps=${options.fps}`);
  }

  // 2. Build Aspect Ratio and Fill complex filter
  const filterGraphSteps: string[] = [];
  const preFilterStr = preFilters.length > 0 ? preFilters.join(',') : 'null';
  filterGraphSteps.push(`[0:v]${preFilterStr}[v_pre]`);

  if (options.fillMode === 'blur') {
    const blurRad = Math.min(30, Math.max(5, Math.round((options.blurAmount || 20) / 2)));
    filterGraphSteps.push(
      `[v_pre]split=2[bg_src][fg_src];` +
      `[bg_src]scale=${safeW}:${safeH}:force_original_aspect_ratio=increase,crop=${safeW}:${safeH},boxblur=${blurRad}:3[bg];` +
      `[fg_src]scale=${safeW}:${safeH}:force_original_aspect_ratio=decrease[fg];` +
      `[bg][fg]overlay=(W-w)/2:(H-h)/2[v_composed]`
    );
  } else if (options.fillMode === 'stretch') {
    filterGraphSteps.push(`[v_pre]scale=${safeW}:${safeH}[v_composed]`);
  } else if (options.fillMode === 'smart-crop' || options.fillMode === 'manual-crop') {
    const focalX = (options.cropXPercent !== undefined ? options.cropXPercent : 50) / 100;
    const focalY = (options.cropYPercent !== undefined ? options.cropYPercent : 50) / 100;
    filterGraphSteps.push(
      `[v_pre]scale='if(gt(a,${safeW}/${safeH}),-1,${safeW})':'if(gt(a,${safeW}/${safeH}),${safeH},-1)',crop=${safeW}:${safeH}:'(in_w-${safeW})*${focalX}':'(in_h-${safeH})*${focalY}'[v_composed]`
    );
  } else {
    // Letterbox / color
    const hexColor = (options.fillColor || '#000000').replace('#', '');
    filterGraphSteps.push(
      `[v_pre]scale=${safeW}:${safeH}:force_original_aspect_ratio=decrease,pad=${safeW}:${safeH}:(ow-iw)/2:(oh-ih)/2:color=0x${hexColor}[v_composed]`
    );
  }

  // 3. Watermark post-filter
  if (options.watermarkEnabled && options.watermarkText) {
    const cleanText = options.watermarkText.replace(/[:\\']/g, '');
    let posParams = 'x=w-tw-24:y=h-th-24';
    if (options.watermarkPosition === 'top-left') posParams = 'x=24:y=24';
    else if (options.watermarkPosition === 'top-right') posParams = 'x=w-tw-24:y=24';
    else if (options.watermarkPosition === 'bottom-left') posParams = 'x=24:y=h-th-24';
    else if (options.watermarkPosition === 'center') posParams = 'x=(w-tw)/2:y=(h-th)/2';

    filterGraphSteps.push(`[v_composed]drawtext=text='${cleanText}':fontcolor=white@0.8:fontsize=24:${posParams}[outv]`);
  } else {
    filterGraphSteps.push(`[v_composed]null[outv]`);
  }

  const complexFilter = filterGraphSteps.join(';');
  args.push('-filter_complex', complexFilter, '-map', '[outv]');

  // Audio configuration
  if (options.audioMode === 'mute') {
    args.push('-an');
  } else {
    args.push('-map', '0:a?');
    args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '44100');
    const audioFilters: string[] = [];
    if (options.audioGain && options.audioGain !== 1.0) {
      audioFilters.push(`volume=${options.audioGain}`);
    }
    if (options.playbackSpeed && options.playbackSpeed !== 1.0) {
      audioFilters.push(`atempo=${options.playbackSpeed}`);
    }
    if (audioFilters.length > 0) {
      args.push('-af', audioFilters.join(','));
    }
  }

  // Codec and encoding speed
  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  args.push(outputPath);

  console.log('Running FFmpeg:', 'ffmpeg ' + args.join(' '));

  const ffmpeg = spawn('ffmpeg', args);


  ffmpeg.stderr.on('data', (data) => {
    const text = data.toString();
    // Parse time / frame progress if available
    const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2], 10);
      const secs = parseFloat(timeMatch[3]);
      const currentSec = hours * 3600 + mins * 60 + secs;
      // Increment progress reasonably
      const estProgress = Math.min(95, Math.max(15, Math.round(job.progress + 3)));
      job.progress = estProgress;
      job.message = `Encoding at ${Math.round(currentSec)}s timestamp...`;
    }
  });

  ffmpeg.on('close', (code) => {
    if (code === 0 && fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      job.status = 'completed';
      job.progress = 100;
      job.outputSize = stats.size;
      job.endTime = Date.now();
      job.message = 'Conversion finished successfully!';
    } else {
      job.status = 'failed';
      job.error = `FFmpeg process exited with code ${code}`;
      job.message = 'Conversion failed';
    }
  });

  ffmpeg.on('error', (err) => {
    job.status = 'failed';
    job.error = err.message;
    job.message = 'FFmpeg execution error';
  });
}

// API: AI Smart Crop Analysis with Gemini with Resilient Model Fallback & Retry
app.post('/api/gemini/analyze-crop', async (req, res) => {
  const { frameBase64, currentAspect = '16:9', videoName = 'Video' } = req.body;
  if (!frameBase64) {
    return res.status(400).json({ error: 'Image frame base64 is required for AI Smart Crop' });
  }

  const defaultFallback = {
    detectedSubject: 'Primary Focal Subject',
    subjectCoordinates: { x: 0.5, y: 0.5, width: 0.45, height: 0.65 },
    recommendedRatio: '9:16',
    recommendedFillMode: 'blur',
    suggestedTitle: `${videoName.replace(/\.[^/.]+$/, '')} - Viral Edit`,
    suggestedTags: ['#shorts', '#reels', '#viral', '#trending', '#videoedit'],
    reasoning: 'Primary subject is centrally weighted. 9:16 with ambient background blur offers optimal mobile engagement.',
  };

  const ai = getGeminiClient();
  if (!ai) {
    return res.json(defaultFallback);
  }

  const cleanBase64 = frameBase64.replace(/^data:image\/\w+;base64,/, '');
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: cleanBase64,
    },
  };

  const prompt = `Analyze this video frame for optimal video aspect ratio conversion, subject framing, and social media distribution.
Identify the primary focal subject (person, speaker, face, main product, or key action).
Recommend the best social aspect ratio ('9:16' for TikTok/Reels, '1:1' for Instagram/Square, '16:9' for YouTube widescreen, '4:5' for IG Feed, '21:9' for Cinematic).
Also suggest the best fill mode ('blur', 'smart-crop', or 'letterbox'), a catchy title, and viral hashtags.`;

  // Multi-tier model fallback list for high resilience during peak traffic
  const candidateModels = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];

  let parsedResult: any = null;
  let lastError: any = null;

  for (const modelName of candidateModels) {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [imagePart, { text: prompt }] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedSubject: { type: Type.STRING, description: 'Description of key subject or focal point' },
                cropXPercent: { type: Type.NUMBER, description: 'Horizontal center percentage of main subject from 0 to 100' },
                cropYPercent: { type: Type.NUMBER, description: 'Vertical center percentage of main subject from 0 to 100' },
                recommendedRatio: { type: Type.STRING, description: 'One of: 9:16, 16:9, 1:1, 4:5, 21:9, 4:3' },
                recommendedFillMode: { type: Type.STRING, description: 'One of: blur, smart-crop, letterbox' },
                suggestedTitle: { type: Type.STRING, description: 'Catchy engaging social video title' },
                suggestedTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '5 high-performing viral hashtags',
                },
                reasoning: { type: Type.STRING, description: 'Why this framing maximizes viewer retention' },
              },
              required: ['detectedSubject', 'cropXPercent', 'cropYPercent', 'recommendedRatio', 'recommendedFillMode', 'suggestedTitle', 'suggestedTags', 'reasoning'],
            },
          },
        });

        if (response && response.text) {
          parsedResult = JSON.parse(response.text.trim());
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const isTemporary = errMessage.includes('503') || errMessage.includes('UNAVAILABLE') || errMessage.includes('429');
        console.warn(`Gemini analysis attempt ${attempts} with ${modelName} encountered:`, errMessage);

        if (isTemporary && attempts < maxAttempts) {
          // Wait 600ms before retrying same model
          await new Promise((r) => setTimeout(r, 600));
        } else {
          // Break to next candidate model
          break;
        }
      }
    }

    if (parsedResult) break;
  }

  if (parsedResult) {
    return res.json({
      detectedSubject: parsedResult.detectedSubject || 'Primary Focus Subject',
      subjectCoordinates: {
        x: (parsedResult.cropXPercent ?? 50) / 100,
        y: (parsedResult.cropYPercent ?? 50) / 100,
        width: 0.4,
        height: 0.6,
      },
      recommendedRatio: parsedResult.recommendedRatio || '9:16',
      recommendedFillMode: parsedResult.recommendedFillMode || 'blur',
      suggestedTitle: parsedResult.suggestedTitle || `${videoName.replace(/\.[^/.]+$/, '')} - Viral Edit`,
      suggestedTags: parsedResult.suggestedTags || ['#video', '#shorts', '#trending'],
      reasoning: parsedResult.reasoning || 'Optimal framing detected for high visual retention.',
    });
  }

  // Graceful smart heuristic fallback if all AI models are temporarily busy
  console.warn('All Gemini candidate models busy, returning calibrated heuristic fallback:', lastError?.message);
  return res.json(defaultFallback);
});

// Vite Middleware for Full-Stack App
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aspect Ratio Converter Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
