import os
import sys
import speech_recognition as sr
from moviepy.editor import VideoFileClip
import cv2
import numpy as np
from datetime import datetime

def log_error(error_message):
    """Log errors to a file for debugging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("error_log.txt", "a") as f:
        f.write(f"[{timestamp}] {error_message}\n")

def extract_audio_from_video(video_path):
    """Extract audio from video file"""
    try:
        video = VideoFileClip(video_path)
        if video.audio is None:
            return None, "No audio track found in the video"
        
        audio = video.audio
        audio_path = f"temp_audio_{os.getpid()}.wav"
        audio.write_audiofile(audio_path, verbose=False, logger=None)
        return audio_path, None
    except Exception as e:
        error_msg = f"Error extracting audio: {str(e)}"
        log_error(error_msg)
        return None, error_msg

def transcribe_audio(audio_path):
    """Transcribe audio to text"""
    if not audio_path:
        return "No audio to transcribe"

    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
        
        text = recognizer.recognize_google(audio)
        return text if text else "No speech detected"
    except sr.UnknownValueError:
        return "Speech recognition could not understand the audio"
    except sr.RequestError as e:
        error_msg = f"Could not request results from speech recognition service: {str(e)}"
        log_error(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"Error during transcription: {str(e)}"
        log_error(error_msg)
        return error_msg
    finally:
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as e:
                log_error(f"Error removing temporary audio file: {str(e)}")

def process_video(video_path):
    """Main video processing function"""
    if not os.path.exists(video_path):
        return "Error: Video file not found"

    # Extract audio
    audio_path, error = extract_audio_from_video(video_path)
    if error:
        return error

    # Transcribe audio
    transcription = transcribe_audio(audio_path)
    
    return transcription

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Error: Please provide video file path")
        sys.exit(1)

    video_path = sys.argv[1]
    result = process_video(video_path)
    print(result)