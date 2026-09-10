// Native accessible image viewer; independent of the animation library.
(() => {
  const samples = [
    {key:'map',title:'Визуальная карта стратегии',caption:'Продукты, идеи и каналы продвижения собраны в одну систему.'},
    {key:'document',title:'Рабочий документ и план действий',caption:'Решения, гипотезы и ближайшие шаги после стратегической сессии.'},
    {key:'recording',title:'Запись стратегической сессии',caption:'Пример записи встречи. Это кадр из материалов Эльмиры, не видеоплеер.'}
  ];
  let active=0;
  const tabs=[...document.querySelectorAll('[data-material]')];
  const dialog=document.querySelector('#material-dialog');
  const opener=document.querySelector('[data-open-material]');
  const panel=document.querySelector('#material-panel');
  let previousOverflow='';
  function select(index){
    active=(index+samples.length)%samples.length;
    const sample=samples[active];
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===active));tab.tabIndex=i===active?0:-1});
    panel.setAttribute('aria-labelledby',`tab-${sample.key}`);
    document.querySelector('#preview-title').textContent=sample.title;
    document.querySelector('#preview-caption').textContent=sample.caption;
    document.querySelector('#dialog-title').textContent=sample.title;
    document.querySelector('#material-counter').textContent=`${active+1} / ${samples.length}`;
    for(const id of ['preview-crop','dialog-crop']){
      const crop=document.getElementById(id);crop.className=`source-crop ${sample.key}`;
      crop.querySelector('img').alt=sample.title;
    }
    opener.setAttribute('aria-label',`Увеличить: ${sample.title}`);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      panel.getAnimations().forEach(a=>a.cancel());
      panel.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    window.ScrollTrigger?.refresh();
  }
  document.querySelector('.material-tabs').hidden=false;
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(i));
    tab.addEventListener('keydown',event=>{
      let index;
      if(event.key==='ArrowRight')index=active+1;
      if(event.key==='ArrowLeft')index=active-1;
      if(event.key==='Home')index=0;
      if(event.key==='End')index=tabs.length-1;
      if(index!==undefined){event.preventDefault();select(index);tabs[active].focus()}
    });
  });
  opener.addEventListener('click',event=>{
    if(typeof dialog.showModal!=='function')return;
    event.preventDefault();
    previousOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    dialog.showModal();
  });
  dialog.addEventListener('close',()=>{
    document.documentElement.style.overflow=previousOverflow;
    opener.focus({preventScroll:true});
  });
  dialog.addEventListener('click',event=>{
    const rect=dialog.getBoundingClientRect();
    if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();
  });
  document.querySelector('[data-material-prev]').addEventListener('click',()=>select(active-1));
  document.querySelector('[data-material-next]').addEventListener('click',()=>select(active+1));
})();
