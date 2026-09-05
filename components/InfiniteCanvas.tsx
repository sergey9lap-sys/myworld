'use client';
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {items,zones,WORLD, type WorldItem,type Zone} from '../lib/world';
type Camera={x:number;y:number;s:number};
type Rect={x:number;y:number;w:number;h:number};
type Commands={go:(id:Zone)=>void;zoom:(factor:number)=>void;overview:()=>void;back:()=>void;focus:(item:WorldItem)=>void;detail:(index:number)=>void};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function Icon({name}:{name:string}) { const paths:Record<string,React.ReactNode>={plus:<path d="M12 5v14M5 12h14"/>,minus:<path d="M5 12h14"/>,arrow:<path d="m6 18 12-12M6 6h12v12"/>,back:<path d="m10 5-7 7 7 7M3 12h18"/>,map:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v18m8-18v18M3 8h18M3 16h18"/></>,home:<><path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-8h6v8"/></>,close:<path d="m5 5 14 14M5 19 19 5"/>,hand:<path d="M8 12V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 4-3 7-7 7-3 0-5-2-6-4l-4-5a2 2 0 0 1 3-2l2 1Z"/>,play:<path d="m8 4 12 8-12 8Z"/>};return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.arrow}</svg> }
export default function InfiniteCanvas(){
 const viewport=useRef<HTMLDivElement>(null),world=useRef<HTMLDivElement>(null),mapBox=useRef<SVGRectElement>(null),zoomLabel=useRef<HTMLSpanElement>(null);
 const commands=useRef<Commands|null>(null),cam=useRef<Camera>({x:0,y:0,s:1}),suppress=useRef(false);
 const [active,setActive]=useState<string|null>(null),[zone,setZone]=useState<Zone>('home'),[help,setHelp]=useState(false),[hint,setHint]=useState(true),[ready,setReady]=useState(false),[overview,setOverview]=useState(false),[reaction,setReaction]=useState(''),[mapOpen,setMapOpen]=useState(false);
 const [playing,setPlaying]=useState(false),[detail,setDetail]=useState<number|null>(null);
 const playingRef=useRef<HTMLVideoElement>(null);
 useEffect(()=>{
  const el=viewport.current!,plane=world.current!,c=cam.current;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=el.clientWidth,height=el.clientHeight,frame=0,animation:gsap.core.Tween|null=null,activeItem:WorldItem|null=null;
  let saved:Camera|null=null,detailSaved:Camera|null=null,isOverview=false,lastPaint=0,dragged=false;
  const pointers=new Map<number,{x:number;y:number}>();
  let last={x:0,y:0},start={x:0,y:0},velocity={x:0,y:0},lastTime=0,pinchDistance=0,pinchCenter={x:0,y:0};
  const nodes=Array.from(plane.querySelectorAll<HTMLElement>('[data-item]'));
  const fit=(r:Rect,pad=70)=>{const s=clamp(Math.min((width-pad*2)/r.w,(height-pad*2)/r.h),0.07,2);return{x:width/2-(r.x+r.w/2)*s,y:height/2-(r.y+r.h/2)*s,s}};
  const bound=(v:number,total:number,view:number,s:number)=>{const start=total===WORLD.w?3400:1700,end=total===WORLD.w?8500:6000;return (end-start)*s<=view?view/2-(start+end)*s/2:clamp(v,view-end*s,-start*s)};
  const paint=()=>{
   plane.style.transform=`translate3d(${c.x}px,${c.y}px,0) scale(${c.s})`;
   if(zoomLabel.current)zoomLabel.current.textContent=`${Math.round(c.s*100)}%`;
   if(mapBox.current){mapBox.current.setAttribute('x',String(-c.x/c.s));mapBox.current.setAttribute('y',String(-c.y/c.s));mapBox.current.setAttribute('width',String(width/c.s));mapBox.current.setAttribute('height',String(height/c.s));}
   if(performance.now()-lastPaint>100){
    lastPaint=performance.now(); const left=-c.x/c.s,top=-c.y/c.s;
    for(const node of nodes){const item=items.find(i=>i.id===node.dataset.item)!; const visible=item.id===activeItem?.id||(item.x+item.w+450>left&&item.x-450<left+width/c.s&&item.y+item.h+450>top&&item.y-450<top+height/c.s);node.style.visibility=visible?'visible':'hidden';node.inert=!visible;}
   }
  };
  const stop=()=>{animation?.kill();animation=null;cancelAnimationFrame(frame);frame=0};
  const move=(target:Camera,duration=.8)=>{stop();animation=gsap.to(c,{...target,duration:reduced.matches?0:duration,ease:'power3.inOut',onUpdate:paint,onComplete:()=>{lastPaint=0;paint()}})};
  const homeRect=()=>width<600?{x:5160,y:3370,w:850,h:1180}:zones[0];
  const homeTarget=()=>{const target=fit(homeRect(),width<600?20:64);if(width<600)target.y=170-3450*target.s;return target};
  const clearFocus=()=>{activeItem=null;saved=null;detailSaved=null;setActive(null);setDetail(null);setPlaying(false)};
  const back=()=>{if(detailSaved){move(detailSaved);detailSaved=null;setDetail(null);return}if(saved){const target=saved;clearFocus();move(target);return}isOverview=false;setOverview(false);move(homeTarget());setZone('home')};
  const zoomAt=(factor:number,x:number,y:number)=>{stop();const s=clamp(c.s*factor,.07,2);const wx=(x-c.x)/c.s,wy=(y-c.y)/c.s;c.x=x-wx*s;c.y=y-wy*s;c.s=s;c.x=bound(c.x,WORLD.w,width,s);c.y=bound(c.y,WORLD.h,height,s);paint()};
  commands.current={
   go(id){clearFocus();setZone(id);setHint(false);isOverview=false;setOverview(false);move(id==='home'?homeTarget():fit(zones.find(z=>z.id===id)!,width<600?20:70));},
   zoom(factor){zoomAt(factor,width/2,height/2)},
   overview(){clearFocus();isOverview=!isOverview;setOverview(isOverview);move(fit(isOverview?{x:3700,y:1900,w:4540,h:3900}:homeRect(),width<600?24:85));},back,
   focus(item){if(dragged||suppress.current||activeItem?.id===item.id)return;stop();saved??={...c};detailSaved=null;activeItem=item;setActive(item.id);setDetail(null);setPlaying(false);setHint(false);isOverview=false;setOverview(false);move(fit({x:item.x,y:item.y,w:item.gallery?1510:item.type==='project'?1100:item.w,h:item.type==='project'?(item.gallery?850:760):item.h},width<600?18:70));},
   detail(index){if(!activeItem?.gallery)return;detailSaved??={...c};setDetail(index);move(fit({x:activeItem.x+30+(index%2)*535,y:activeItem.y+235+Math.floor(index/2)*282,w:505,h:260},width<600?18:80));}
  };
  const down=(e:PointerEvent)=>{
   if(e.button!==0&&e.button!==1)return;
   if((e.target as HTMLElement).closest('video, .media-play, .detail-close'))return;
   e.preventDefault();window.getSelection()?.removeAllRanges();
   stop();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   dragged=false;suppress.current=false;last=start={x:e.clientX,y:e.clientY};velocity={x:0,y:0};lastTime=performance.now();
   if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);pinchCenter={x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
  };
  const drag=(e:PointerEvent)=>{
   if(!pointers.has(e.pointerId))return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size>=2){const[a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y),center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(pinchDistance>0)zoomAt(dist/pinchDistance,pinchCenter.x,pinchCenter.y);c.x+=center.x-pinchCenter.x;c.y+=center.y-pinchCenter.y;pinchDistance=dist;pinchCenter=center;dragged=true;suppress.current=true;paint();return;}
   if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>5){dragged=true;suppress.current=true;el.setPointerCapture(e.pointerId);setHint(false);el.classList.add('dragging')}
   if(!dragged)return;
   const now=performance.now(),dt=Math.max(8,now-lastTime),dx=e.clientX-last.x,dy=e.clientY-last.y;
   const bx=bound(c.x+dx,WORLD.w,width,c.s),by=bound(c.y+dy,WORLD.h,height,c.s);
   c.x+=dx*(Math.abs(c.x+dx-bx)>1?.22:1);c.y+=dy*(Math.abs(c.y+dy-by)>1?.22:1);
   velocity={x:dx/dt,y:dy/dt};last={x:e.clientX,y:e.clientY};lastTime=now;paint();
  };
  const up=(e:PointerEvent)=>{
   pointers.delete(e.pointerId);if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
   if(pointers.size){last=start=[...pointers.values()][0];pinchDistance=0;velocity={x:0,y:0};return}
   el.classList.remove('dragging');
   if(dragged){const age=performance.now()-lastTime;const vx=age<90?velocity.x:0,vy=age<90?velocity.y:0;move({x:bound(c.x+(reduced.matches?0:vx*140),WORLD.w,width,c.s),y:bound(c.y+(reduced.matches?0:vy*140),WORLD.h,height,c.s),s:c.s},.45)}
   // Capture-phase click suppression remains active through the generated click.
   requestAnimationFrame(()=>{dragged=false});
  };
  const wheel=(e:WheelEvent)=>{e.preventDefault();setHint(false);const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);zoomAt(Math.exp(-delta*(e.ctrlKey?.008:.002)),e.clientX,e.clientY)};
  const clickCapture=(e:MouseEvent)=>{if(suppress.current){e.preventDefault();e.stopPropagation();suppress.current=false}};
  const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('input,textarea,video'))return;if(e.key==='Escape'){back();setHelp(false)}if(e.key==='Home'){e.preventDefault();commands.current?.go('home')}if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.2,width/2,height/2)}if(e.key==='-'){e.preventDefault();zoomAt(1/1.2,width/2,height/2)}const offsets:Record<string,[number,number]>={ArrowLeft:[160,0],ArrowRight:[-160,0],ArrowUp:[0,160],ArrowDown:[0,-160]};if(offsets[e.key]){e.preventDefault();const [dx,dy]=offsets[e.key];move({...c,x:bound(c.x+dx,WORLD.w,width,c.s),y:bound(c.y+dy,WORLD.h,height,c.s)},.18)}};
  const resize=()=>{const oldW=width,oldH=height;width=el.clientWidth;height=el.clientHeight;c.x+=(width-oldW)/2;c.y+=(height-oldH)/2;paint()};
  Object.assign(c,homeTarget());paint();setReady(true);
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',drag);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('click',clickCapture,true);window.addEventListener('keydown',key);window.addEventListener('resize',resize);
  return()=>{stop();commands.current=null;el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',drag);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel);el.removeEventListener('click',clickCapture,true);window.removeEventListener('keydown',key);window.removeEventListener('resize',resize)};
 },[]);
 useEffect(()=>{if(!playing&&playingRef.current)playingRef.current.pause()},[playing]);
 const activate=(item:WorldItem)=>{if(item.type==='sticker'){setReaction(item.title||'');setTimeout(()=>setReaction(''),1800);return}commands.current?.focus(item)};
 return <main className="canvas-app">
  <div className="topbar"><button className="identity" onClick={()=>commands.current?.go('home')}><span className="identity-dot"/>Сергей<span className="identity-sub">Личное пространство</span></button><button className="help-button" aria-label="Как исследовать пространство" onClick={()=>setHelp(!help)}>?</button></div>
  <nav className="navigation" aria-label="Области мира">{zones.map(z=><button key={z.id} className={zone===z.id&&!overview?'selected':''} onClick={()=>commands.current?.go(z.id)}>{z.label}</button>)}</nav>
  <div ref={viewport} onDragStart={e=>e.preventDefault()} className={`viewport ${ready?'ready':''}`} aria-label="Личный мир. Перетаскивайте фон или выбирайте область в навигации" tabIndex={0}>
   <div ref={world} className="world" style={{width:WORLD.w,height:WORLD.h}}>
    <svg className="paths" width="12000" height="8000" aria-hidden="true"><path d="M5660 3310 C5630 3090 5680 3000 5800 3000M6390 3910 C6610 3910 6630 3620 6820 3650M5540 4220 C5500 4390 5320 4450 5300 4590M5160 3560 C5000 3600 4950 3490 4770 3490M6440 4180 C6600 4460 6600 4600 6830 4660"/></svg>
    {items.map(item=>{
     const opened=active===item.id; const style={left:item.x,top:item.y,width:opened&&item.type==='project'?1100:item.w,height:opened&&item.type==='project'?(item.gallery?850:760):item.h,transform:`rotate(${opened?0:item.rotation||0}deg)`,zIndex:opened?30:item.type==='sticker'?5:2};
     return <article key={item.id} data-item={item.id} className={`world-item ${item.type} ${item.accent||''} ${opened?'opened':''}`} style={style}>
      {item.type==='intro'?<><h1>{item.title}</h1><p>{item.body}</p><button className="explore" onClick={()=>commands.current?.go('works')}>Посмотреть работы <Icon name="arrow"/></button></>:null}
      {item.type==='text'?<><h2>{item.title}</h2><p>{item.body}</p></>:null}
      {item.type==='note'?<><h3>{item.title}</h3><p>{item.body}</p></>:null}
      {item.type==='photo'||item.type==='sticker'?<button className="image-object" onClick={()=>activate(item)} aria-label={item.type==='photo'?`Приблизить: ${item.title}`:item.title}><img draggable="false" src={`/media/${item.src}`} alt={item.title||''} loading={item.zone==='home'?'eager':'lazy'}/>{item.type==='photo'&&<span className="photo-caption">{item.title} <Icon name="arrow"/></span>}</button>:null}
      {item.type==='project'&&!opened?<button className="project-cover" onClick={()=>activate(item)} aria-label={`Открыть проект ${item.title}`}><div className="project-image"><img draggable="false" src={`/media/${item.src}`} alt={`Сайт ${item.title}`} loading={item.zone==='home'?'eager':'lazy'}/></div><div className="project-label"><h3>{item.title}</h3><span>{item.gallery?'Войти внутрь':'Посмотреть'} <Icon name="arrow"/></span></div></button>:null}
      {item.type==='project'&&opened?<div className="project-inside"><div className="inside-title"><div><h2>{item.title}</h2><p>{item.body}</p></div><button className="detail-close" onClick={()=>commands.current?.back()} aria-label="Вернуться к доске"><Icon name="close"/></button></div>
       {item.gallery?<div className="barca-gallery">{item.gallery.map((src,index)=><button key={src} onClick={()=>commands.current?.detail(index)} aria-label={`Приблизить экран: ${['Обзор платформы','Расстановка игроков','Состав команды','Статистика'][index]}`}><img src={`/media/${src}`} alt={['Обзор платформы','Расстановка игроков','Состав команды','Статистика'][index]} draggable="false"/><span>{['Обзор платформы','На поле','Состав','Детали'][index]} <Icon name="arrow"/></span></button>)}</div>:<div className="video-stage">{playing?<video ref={playingRef} src={`/media/${item.video}`} controls autoPlay playsInline preload="none" aria-label={`Запись сайта ${item.title}`}/>:<><img src={`/media/${item.src}`} alt={`Превью сайта ${item.title}`} draggable="false"/><button className="media-play" onClick={()=>setPlaying(true)}><Icon name="play"/>Смотреть запись</button></>}</div>}
      </div>:null}
     </article>
    })}
   </div>
  </div>
  {active&&<button className="back-button" onClick={()=>commands.current?.back()}><Icon name="back"/>{detail!==null?'Все экраны':'Назад к миру'}<kbd>Esc</kbd></button>}
  {hint&&!active&&<div className="drag-hint"><Icon name="hand"/><span>Потяни за свободное место.<br/><b>Здесь можно в любую сторону.</b></span></div>}
  <div className="bottom-controls"><button onClick={()=>commands.current?.overview()} aria-label="Показать весь мир" title="Весь мир"><Icon name="map"/></button><span className="control-divider"/><button onClick={()=>commands.current?.zoom(1/1.2)} aria-label="Отдалить"><Icon name="minus"/></button><span ref={zoomLabel} className="zoom-label">100%</span><button onClick={()=>commands.current?.zoom(1.2)} aria-label="Приблизить"><Icon name="plus"/></button><button className="mobile-home" onClick={()=>commands.current?.go('home')} aria-label="Вернуться в начало"><Icon name="home"/></button></div>
  <button className="map-toggle" onClick={()=>setMapOpen(!mapOpen)}>{mapOpen?'Скрыть карту':'Карта мира'} <Icon name="map"/></button>
  {mapOpen&&<div className="minimap"><svg viewBox="3400 1700 5200 4300" aria-label="Карта областей">{zones.map(z=><g key={z.id} onClick={()=>commands.current?.go(z.id)}><rect x={z.x} y={z.y} width={z.w} height={z.h} rx="80"/><text x={z.x+z.w/2} y={z.y+z.h/2}>{z.label}</text></g>)}<rect ref={mapBox} className="camera-box" x={-cam.current.x/cam.current.s} y={-cam.current.y/cam.current.s} width={typeof window!=='undefined'?window.innerWidth/cam.current.s:1500} height={typeof window!=='undefined'?window.innerHeight/cam.current.s:1000}/></svg></div>}
  {help&&<aside className="help-panel"><h2>Осмотрись.</h2><p>Тяни фон мышкой или одним пальцем. Колесо, прокрутка трекпада и жест двумя пальцами меняют масштаб.</p><p>Нажми на работу или фото, чтобы приблизиться. В Барселоне можно войти ещё глубже — в отдельный экран.</p><p><kbd>← ↑ ↓ →</kbd> — двигаться · <kbd>+ −</kbd> — масштаб · <kbd>Home</kbd> — начало · <kbd>Esc</kbd> — назад.</p><button onClick={()=>setHelp(false)}>Понятно, исследую <Icon name="arrow"/></button></aside>}
  <div className={`reaction-toast ${reaction?'visible':''}`} role="status">{reaction}</div>
 </main>
}
