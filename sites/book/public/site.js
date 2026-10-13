document.querySelectorAll('input[name="country"]').forEach(input=>input.addEventListener('change',()=>{
  document.getElementById('country-status').textContent=`Ваш выбор — ${input.value}. Он не отправляется организатору: предзапись ещё не открыта.`;
}));

const reel = document.querySelector('.photo-reel');
if (reel) {
  const previous = document.querySelector('[data-gallery-prev]');
  const next = document.querySelector('[data-gallery-next]');
  const update = () => {
    previous.disabled = reel.scrollLeft < 5;
    next.disabled = reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 5;
  };
  const move = direction => {
    const shot = reel.querySelector('figure');
    reel.scrollBy({left: direction * (shot.getBoundingClientRect().width + parseFloat(getComputedStyle(reel).gap)), behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  previous.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
  reel.addEventListener('scroll',update,{passive:true});
  reel.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}});
  new ResizeObserver(update).observe(reel); update();
}
document.querySelectorAll('video').forEach(video=>{
  video.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();}));
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});

const album = document.querySelector('.memory-album');
if (album) {
  const spreads = [...album.querySelectorAll('.album-spread')];
  const shots = [...album.querySelectorAll('.instant-shot')];
  const prev = document.querySelector('[data-album-prev]');
  const next = document.querySelector('[data-album-next]');
  const status = document.querySelector('#album-page-status');
  const navigation = document.querySelector('.album-navigation');
  const mobile = matchMedia('(max-width:700px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let single=mobile.matches, page=0, animation;
  const render=(direction=0, animate=false)=>{
    animation?.cancel();
    const count=single?shots.length:spreads.length;
    page=Math.max(0,Math.min(page,count-1));
    spreads.forEach((spread,i)=>spread.hidden=i!==(single?Math.floor(page/2):page));
    shots.forEach((shot,i)=>shot.hidden=single&&i!==page);
    album.dataset.layout=single?'single':'spread';
    prev.disabled=page===0;next.disabled=page===count-1;
    prev.setAttribute('aria-label',single?'Предыдущая страница':'Предыдущий разворот');
    next.setAttribute('aria-label',single?'Следующая страница':'Следующий разворот');
    const label=single?shots[page].querySelector('figcaption').textContent:spreads[page].getAttribute('aria-label').split(': ')[1];
    status.textContent=`${single?'Страница':'Разворот'} ${page+1} из ${count} · ${label}`;
    if(animate&&!reduced.matches){
      const visible=spreads[single?Math.floor(page/2):page];
      animation=visible.animate([{transform:`rotateY(${direction*7}deg)`,opacity:.8},{transform:'rotateY(0deg)',opacity:1}],{duration:260,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease').trim()||'ease-out'});
    }
  };
  const move=(direction,animate)=>{page+=direction;render(direction,animate);};
  prev.addEventListener('click',e=>move(-1,e.detail!==0));next.addEventListener('click',e=>move(1,e.detail!==0));
  album.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1,false);}});
  let touch;
  album.addEventListener('touchstart',e=>{touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
  album.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1,true);touch=null;},{passive:true});
  mobile.addEventListener('change',()=>{page=mobile.matches?page*2:Math.floor(page/2);single=mobile.matches;render();});
  render();album.classList.add('is-enhanced');
  album.before(navigation);navigation.classList.add('is-ready');
}
