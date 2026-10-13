from pathlib import Path
from PIL import Image, ImageOps
import subprocess, json

source=Path('C:/Users/User/Downloads/Telegram Desktop/ChatExport_2026-10-13 (2)')
target=Path(__file__).resolve().parent/'public/assets/live'
target.mkdir(parents=True,exist_ok=True)
manifest=[]
for number in range(89,99):
    p=next(p for p in (source/'photos').glob(f'photo_{number}@*.jpg') if '_thumb' not in p.name)
    image=ImageOps.exif_transpose(Image.open(p)).convert('RGB')
    for size in [480,1200]:
        im=image.copy(); im.thumbnail((size,size*2))
        im.save(target/f'italy-{number}-{size}.webp',quality=85,method=6)
    manifest.append({'source':p.name,'asset':f'italy-{number}','width':image.width,'height':image.height})
ff='C:/Users/User/AppData/Roaming/Python/Python312/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
for i,name in enumerate(['IMG_8862.MOV','IMG_8863.MOV'],1):
    src=source/'video_files'/name
    subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-i',str(src),'-vf',"scale='min(720,iw)':-2",'-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(target/f'italy-film-{i}.mp4')],check=True)
    subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-ss','0.5','-i',str(src),'-frames:v','1','-vf','scale=480:-2',str(target/f'italy-film-{i}-poster.jpg')],check=True)
(target/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(manifest),'photos and 2 films')
