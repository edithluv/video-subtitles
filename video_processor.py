import os
import subprocess
import requests
import time
import tempfile
import json
from pathlib import Path

def extract_audio(video_path, audio_path):
    """Extract audio from video using ffmpeg"""
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "mp3", audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Audio extraction failed: {result.stderr}")
    return audio_path

def read_file(filename, chunk_size=5242880):
    """Read file in chunks for upload"""
    with open(filename, 'rb') as _file:
        while True:
            data = _file.read(chunk_size)
            if not data:
                break
            yield data

def upload_file(api_token, path):
    """Upload file to AssemblyAI"""
    headers = {'authorization': api_token}
    response = requests.post('https://api.assemblyai.com/v2/upload',
                             headers=headers,
                             data=read_file(path))
    if response.status_code == 200:
        return response.json()["upload_url"]
    else:
        raise Exception(f"Upload failed: {response.status_code} - {response.text}")

def create_transcript(api_token, audio_url):
    """Create transcript using AssemblyAI"""
    url = "https://api.assemblyai.com/v2/transcript"
    headers = {
        "authorization": api_token,
        "content-type": "application/json"
    }
    data = {"audio_url": audio_url}
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Transcript creation failed: {response.text}")
    
    transcript_id = response.json()['id']
    polling_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    
    while True:
        transcription_result = requests.get(polling_endpoint, headers=headers).json()
        if transcription_result['status'] == 'completed':
            break
        elif transcription_result['status'] == 'error':
            raise Exception(f"Transcription failed: {transcription_result['error']}")
        else:
            time.sleep(3)
    
    return transcription_result

def export_subtitles(api_token, transcript_id, subtitle_format):
    """Export subtitles from AssemblyAI"""
    url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}/{subtitle_format}"
    headers = {"authorization": api_token}
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"Subtitle export failed: {response.text}")

def burn_subtitles(video_path, subtitle_path, output_path):
    """Burn subtitles into video using ffmpeg"""
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"subtitles={subtitle_path}",
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Subtitle burning failed: {result.stderr}")
    return output_path

def process_video(video_file_path, settings, api_token, progress_callback=None):
    """Main video processing function"""
    try:
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Get file info
            video_path = Path(video_file_path)
            base_name = video_path.stem
            extension = video_path.suffix
            
            # Step 1: Extract audio
            if progress_callback:
                progress_callback("Extracting audio from video@.")
            
            audio_path = temp_path / f"{base_name}_audio.mp3"
            extract_audio(str(video_path), str(audio_path))
            
            # Step 2: Upload to AssemblyAI
            if progress_callback:
                progress_callback("Uploading audio to AssemblyAI@.")
            
            upload_url = upload_file(api_token, str(audio_path))
            
            # Step 3: Create transcript
            if progress_callback:
                progress_callback("Transcribing audio@.")
            
            transcript = create_transcript(api_token, upload_url)
            
            # Step 4: Export subtitles
            if progress_callback:
                progress_callback("Exporting subtitles@.")
            
            subtitle_content = export_subtitles(api_token, transcript['id'], settings.get('subtitleFormat', 'srt'))
            subtitle_path = temp_path / f"{base_name}.{settings.get('subtitleFormat', 'srt')}"
            
            with open(subtitle_path, 'wb') as f:
                f.write(subtitle_content)
            
            # Step 5: Burn subtitles (if enabled)
            output_filename = f"{base_name}_subtitled{extension}"
            
            if settings.get('burnSubtitles', True):
                if progress_callback:
                    progress_callback("Burning subtitles into video@.")
                
                output_path = temp_path / output_filename
                burn_subtitles(str(video_path), str(subtitle_path), str(output_path))
                
                # Return the processed video
                with open(output_path, 'rb') as f:
                    return f.read(), output_filename, subtitle_content
            else:
                # Return original video with separate subtitle file
                with open(video_path, 'rb') as f:
                    return f.read(), video_path.name, subtitle_content
                    
    except Exception as e:
        raise Exception(f"Video processing failed: {str(e)}")

if __name__ == "__main__":
    # CLI usage for testing
    import sys
    if len(sys.argv) < 2:
        print("Usage: python video_processor.py <video_file>")
        sys.exit(1)
    
    video_file = sys.argv[1]
    api_token = os.getenv("ASSEMBLYAI_API_KEY")
    
    if not api_token:
        print("Error: ASSEMBLYAI_API_KEY environment variable not set")
        sys.exit(1)
    
    settings = {
        'subtitleFormat': 'srt',
        'burnSubtitles': True,
        'language': 'auto',
        'fontSize': 'medium'
    }
    
    def progress_print(message):
        print(f"Progress: {message}")
    
    try:
        video_data, filename, subtitle_data = process_video(video_file, settings, api_token, progress_print)
        
        # Save output
        with open(filename, 'wb') as f:
            f.write(video_data)
        
        print(f"Success! Output saved as: {filename}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
