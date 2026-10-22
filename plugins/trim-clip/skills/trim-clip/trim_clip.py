"""Keep the last N seconds of a video, compressed, as a new file on the Desktop.

The original is never touched: ffmpeg reads it and writes a separate MP4.

    python trim_clip.py "Videos/clip.mp4"
    python trim_clip.py --latest 2 --match Minecraft --list   # show the pick only
    python trim_clip.py --latest 2 --match Minecraft --seconds 45
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

VIDEO_EXTS = {".mp4", ".mkv", ".mov", ".webm", ".flv", ".avi"}


def shell_folder(name, fallback):
    """A Windows known folder from the registry, so a moved Desktop or Videos folder is followed."""
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                             r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders")
        value, _ = winreg.QueryValueEx(key, name)
        return Path(os.path.expandvars(value))
    except (ImportError, OSError):
        return Path.home() / fallback


def find_tool(name):
    """ffmpeg or ffprobe from PATH, else from the winget install (its PATH entry only reaches new shells)."""
    found = shutil.which(name)
    if found:
        return found
    pattern = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages",
                           "Gyan.FFmpeg*", "*", "bin", name + ".exe")
    hits = sorted(glob.glob(pattern))
    if hits:
        return hits[-1]
    sys.exit(f"{name} not found. Install ffmpeg (Windows: winget install --id Gyan.FFmpeg --exact, macOS: brew install ffmpeg, Linux: sudo apt install ffmpeg)")


def probe(ffprobe, path):
    out = subprocess.run([ffprobe, "-v", "error", "-show_entries",
                          "format=duration:stream=codec_type,height:stream_disposition=attached_pic",
                          "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    data = json.loads(out)
    streams = data.get("streams", [])
    video = [s for s in streams
             if s["codec_type"] == "video" and not s.get("disposition", {}).get("attached_pic")]
    audio = [s for s in streams if s["codec_type"] == "audio"]
    return float(data["format"]["duration"]), (video[0].get("height") if video else None), len(audio)


def latest_videos(root, count, match):
    files = [p for p in root.rglob("*") if p.suffix.lower() in VIDEO_EXTS and p.is_file()]
    if match:
        files = [p for p in files if match.lower() in str(p.relative_to(root)).lower()]
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return files[:count]


def free_path(folder, stem, seconds):
    base = f"{stem} - last {seconds:g}s"
    path = folder / f"{base}.mp4"
    n = 2
    while path.exists():
        path = folder / f"{base} ({n}).mp4"
        n += 1
    return path


def trim(ffmpeg, src, dst, seconds, duration, height, audio_tracks, max_height, crf):
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostats"]
    if duration > seconds:
        cmd += ["-sseof", f"-{seconds}"]
    cmd += ["-i", str(src)]

    graph = []
    vmap = "0:v:0"
    if height and max_height and height > max_height:
        graph.append(f"[0:v:0]scale=-2:{max_height}[v]")
        vmap = "[v]"
    amap = "0:a:0" if audio_tracks == 1 else None
    if audio_tracks > 1:
        # NVIDIA can save game and mic as separate tracks; most players only play the first.
        inputs = "".join(f"[0:a:{i}]" for i in range(audio_tracks))
        graph.append(f"{inputs}amix=inputs={audio_tracks}:normalize=0[a]")
        amap = "[a]"
    if graph:
        cmd += ["-filter_complex", ";".join(graph)]

    cmd += ["-map", vmap, "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p"]
    if amap:
        cmd += ["-map", amap, "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-movflags", "+faststart", "-n", str(dst)]
    subprocess.run(cmd, check=True)


def mb(path):
    return f"{path.stat().st_size / 1024 / 1024:,.1f} MB"


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("videos", nargs="*", type=Path, help="video files (leave empty with --latest)")
    ap.add_argument("--latest", type=int, help="take the N newest videos under the Videos folder")
    ap.add_argument("--match", help="with --latest: only paths containing this text, e.g. Minecraft")
    ap.add_argument("--seconds", type=float, default=30, help="how much of the end to keep (default 30)")
    ap.add_argument("--out", type=Path, help="output folder (default: Desktop)")
    ap.add_argument("--max-height", type=int, default=1080,
                    help="downscale anything taller than this (default 1080, 0 keeps full resolution)")
    ap.add_argument("--crf", type=int, default=23, help="x264 quality: lower is sharper and bigger (default 23)")
    ap.add_argument("--list", action="store_true", help="print what would be trimmed, encode nothing")
    args = ap.parse_args()

    videos = list(args.videos)
    if args.latest:
        root = shell_folder("My Video", "Videos")
        videos += latest_videos(root, args.latest, args.match)
    if not videos:
        sys.exit("No videos given. Pass file paths, or --latest N (with --match TEXT).")
    missing = [v for v in videos if not v.is_file()]
    if missing:
        sys.exit("Not found: " + ", ".join(str(m) for m in missing))

    ffmpeg, ffprobe = find_tool("ffmpeg"), find_tool("ffprobe")
    out_dir = args.out or shell_folder("Desktop", "Desktop")
    out_dir.mkdir(parents=True, exist_ok=True)

    for src in videos:
        duration, height, audio_tracks = probe(ffprobe, src)
        saved = datetime.fromtimestamp(src.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
        print(f"{src}\n  saved {saved}, {duration:.1f}s, {height}p, {mb(src)}, {audio_tracks} audio track(s)")
        if args.list:
            continue
        if duration <= args.seconds:
            print(f"  shorter than {args.seconds:g}s: keeping all of it, compressed")
        dst = free_path(out_dir, src.stem, args.seconds)
        trim(ffmpeg, src, dst, args.seconds, duration, height, audio_tracks, args.max_height, args.crf)
        out_duration, out_height, _ = probe(ffprobe, dst)
        print(f"  -> {dst}\n     {out_duration:.1f}s, {out_height}p, {mb(dst)}")


if __name__ == "__main__":
    main()
