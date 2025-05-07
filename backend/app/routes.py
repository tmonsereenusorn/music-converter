from flask import Flask, request, send_file
from flask_cors import CORS
from yt_dlp import YoutubeDL
import tempfile
import os
import tempfile

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def hello():
    return "Backend is working!"

@app.route("/convert", methods=["POST"])
def convert():
    data = request.get_json()
    url = data.get("url")
    title = data.get("title", "").strip()
    artist = data.get("artist", "").strip()
    album = data.get("album", "").strip()

    file_title = f"{artist + ' - ' if artist else ''}{title}" if title else None

    if not file_title:
        with YoutubeDL() as ydl:
            info = ydl.extract_info(url, download=False)
            file_title = info.get('title', 'Unknown Title')

    temp_dir = tempfile.gettempdir()
    raw_mp3_path = os.path.join(temp_dir, f"{file_title}_raw.mp3")
    final_mp3_path = os.path.join(temp_dir, f"{file_title}.mp3")

    ydl_opts = {
        'outtmpl': os.path.join(temp_dir, f"{file_title}_raw.%(ext)s"),
        'format': 'bestaudio/best',
        'postprocessors': [
            {
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }
        ],
        'noplaylist': True,
        'quiet': True,
        'nocheckcertificate': True,
    }

    try:
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        return {"error": str(e)}, 500

    # Build ffmpeg command to inject only provided metadata
    cmd = ["ffmpeg", "-y", "-i", raw_mp3_path]

    if title:
        cmd += ["-metadata", f"title={title}"]
    if artist:
        cmd += ["-metadata", f"artist={artist}"]
    if album:
        cmd += ["-metadata", f"album={album}"]

    cmd += ["-codec", "copy", final_mp3_path]

    try:
        subprocess.run(cmd, check=True)
        os.remove(raw_mp3_path)
    except subprocess.CalledProcessError as e:
        return {"error": f"Metadata injection failed: {e}"}, 500

    return send_file(final_mp3_path, as_attachment=True, download_name=f"{file_title}.mp3")

if __name__ == "__main__":
  app.run()