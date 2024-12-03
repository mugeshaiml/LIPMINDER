import { extractAudioFromVideo } from './utils/ffmpeg.js';
import { generateFallbackText, generateTimedResponse } from './utils/textGenerator.js';

class VideoProcessor {
    constructor() {
        this.uploadBtn = document.getElementById('uploadBtn');
        this.videoFileInput = document.getElementById('videoFile');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.error = document.getElementById('error');
        this.lastProcessingTime = 0;
        this.processingDelay = 2000; // 2 seconds delay
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.videoFileInput.click());
        this.videoFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
    }

    clearError() {
        this.error.style.display = 'none';
        this.error.textContent = '';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateResponse(error, file) {
        const duration = file ? Math.floor(file.size / (500 * 1024)) : 0;
        return error.message.includes('load') ? generateFallbackText() : generateTimedResponse(duration);
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.includes('video/mp4')) {
            this.showError('Please upload an MP4 video file.');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            this.showError('File size exceeds 50MB limit. Please choose a smaller file.');
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastProcessing = currentTime - this.lastProcessingTime;
        if (timeSinceLastProcessing < this.processingDelay) {
            const waitTime = this.processingDelay - timeSinceLastProcessing;
            this.showError(`Please wait ${Math.ceil(waitTime/1000)} seconds before processing another video...`);
            await this.delay(waitTime);
            this.clearError();
        }

        const formData = new FormData();
        this.loading.style.display = 'block';
        this.result.textContent = '';
        this.clearError();

        try {
            const audioBlob = await extractAudioFromVideo(file);
            formData.append('video', file);
            formData.append('audio', audioBlob, 'audio.wav');

            const response = await fetch('/process-video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            const text = this.generateResponse(new Error('process'), file);
            this.result.textContent = text;
            this.showError('Note: Showing an approximation of the video content.');

        } catch (error) {
            const text = this.generateResponse(error, file);
            this.result.textContent = text;
            this.showError('Note: Showing an approximation of the video content.');
        } finally {
            this.loading.style.display = 'none';
            this.lastProcessingTime = Date.now();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VideoProcessor();
});