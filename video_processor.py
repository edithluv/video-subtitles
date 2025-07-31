import os
import subprocess
import requests
import time
import tempfile
import json
import sys
from pathlib import Path

def extract_audio(video_path, audio_path):
    """Extract audio from video using ffmpeg"""
    print(f"Progress: Extracting audio from video...")
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "mp3", "-ar", "16000", audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Audio extraction failed: {result.stderr}")
    
    if not os.path.exists(audio_path):
        raise Exception(f"Audio file was not created: {audio_path}")
    
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
    print("Progress: Uploading audio to AssemblyAI...")
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
    print("Progress: Transcribing audio...")
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
        status = transcription_result['status']
        
        if status == 'completed':
            break
        elif status == 'error':
            raise Exception(f"Transcription failed: {transcription_result.get('error', 'Unknown error')}")
        else:
            time.sleep(3)
    
    return transcription_result

def export_subtitles(api_token, transcript_id, subtitle_format):
    """Export subtitles from AssemblyAI"""
    print("Progress: Exporting subtitles...")
    url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}/{subtitle_format}"
    headers = {"authorization": api_token}
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"Subtitle export failed: {response.text}")

def burn_subtitles(video_path, subtitle_path, output_path):
    """Burn subtitles into video using ffmpeg"""
    print("Progress: Burning subtitles into video...")
    
    cmd = [
        "ffmpeg", "-y", 
        "-i", video_path,
        "-vf", f"subtitles={subtitle_path}:force_style='FontSize=24'",
        "-c:a", "copy",
        "-preset", "fast",
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise Exception(f"Subtitle burning failed: {result.stderr}")
    
    if not os.path.exists(output_path):
        raise Exception(f"Output video file was not created: {output_path}")
    
    return output_path

def main():
    try:
        if len(sys.argv) < 4:
            print("Usage: python video_processor.py <input_video> <output_video> <settings_json>")
            sys.exit(1)
        
        input_video = sys.argv[1]
        output_video = sys.argv[2]  # This is the EXACT path where the API expects the file
        settings = json.loads(sys.argv[3])
        
        if not os.path.exists(input_video):
            raise Exception(f"Input video file does not exist: {input_video}")
        
        api_token = os.getenv("ASSEMBLYAI_API_KEY")
        if not api_token:
            raise Exception("ASSEMBLYAI_API_KEY environment variable not set")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Step 1: Extract audio
            audio_path = temp_path / "audio.mp3"
            extract_audio(input_video, str(audio_path))
            
            # Step 2: Upload to AssemblyAI
            upload_url = upload_file(api_token, str(audio_path))
            
            # Step 3: Create transcript
            transcript = create_transcript(api_token, upload_url)
            
            # Step 4: Export subtitles
            subtitle_format = settings.get('subtitleFormat', 'srt')
            subtitle_content = export_subtitles(api_token, transcript['id'], subtitle_format)
            subtitle_path = temp_path / f"subtitles.{subtitle_format}"
            
            with open(subtitle_path, 'wb') as f:
                f.write(subtitle_content)
            
            # Step 5: Process video - SAVE TO THE EXACT PATH THE API EXPECTS
            if settings.get('burnSubtitles', True):
                burn_subtitles(input_video, str(subtitle_path), output_video)
            else:
                import shutil
                shutil.copy2(input_video, output_video)
            
            # Verify the file was created at the expected location
            if os.path.exists(output_video):
                file_size = os.path.getsize(output_video)
                print(f"Success! Output saved as: {output_video} ({file_size} bytes)")
            else:
                raise Exception(f"Failed to create output file at: {output_video}")
                    
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
