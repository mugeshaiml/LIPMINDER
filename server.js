import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configure CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Configure headers for SharedArrayBuffer
app.use((req, res, next) => {
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

app.use(express.static('dist'));

app.post('/process-video', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
    }

    const pythonProcess = spawn('python3', ['main.py', req.file.path]);
    let result = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`Processing error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        // Clean up the uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        if (code !== 0) {
            return res.status(500).json({ 
                error: 'Error processing video',
                details: errorOutput
            });
        }

        const processedResult = result.trim();
        if (!processedResult) {
            return res.json({ 
                text: 'No speech detected in the video. Please try a video with clear speech.'
            });
        }

        res.json({ text: processedResult });
    });

    // Handle timeout after 5 minutes
    setTimeout(() => {
        pythonProcess.kill();
        res.status(504).json({ 
            error: 'Processing timeout. Please try a shorter video.'
        });
    }, 300000); // 5 minutes timeout
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});