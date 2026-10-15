from pathlib import Path
import subprocess

source = Path('C:/Users/User/Downloads/Telegram Desktop/ChatExport_2026-10-15/video_files')
target = Path(__file__).resolve().parent / 'public/assets/live'
ff = 'C:/Users/User/AppData/Roaming/Python/Python312/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
for i, name in enumerate(['IMG_7485.MOV', 'IMG_7486.MOV'], 1):
    src = source / name
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(src), '-vf', "scale='min(640,iw)':-2", '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(target / f'review-{i}.mp4')], check=True)
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.7', '-i', str(src), '-frames:v', '1', '-vf', 'scale=480:-2', str(target / f'review-{i}-poster.jpg')], check=True)
src = Path('C:/Users/User/Downloads/Telegram Desktop/IMG_7484.MOV')
subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(src), '-vf', "scale='min(640,iw)':-2", '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(target / 'review-3.mp4')], check=True)
subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.7', '-i', str(src), '-frames:v', '1', '-vf', 'scale=480:-2', str(target / 'review-3-poster.jpg')], check=True)
print('Prepared three genuine testimonial videos and posters')
