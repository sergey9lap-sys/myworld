// Static HTML remains visible if either local animation dependency fails.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  const sequences = [];
  const defaults = { duration: .7, ease: 'power3.out', clearProps: 'opacity,visibility,transform' };
  const enter = (tl, target, time, vars = {}) => {
    if (target && (typeof target !== 'string' || document.querySelector(target)))
      tl.from(target, { autoAlpha: 0, y: 22, ...vars }, time);
    return tl;
  };
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = gsap.timeline({ defaults });
    enter(hero, '.hero h1', 0, { y: 18, duration: .8 });
    enter(hero, '.hero-copy > p', .24);
    enter(hero, '.hero-copy > .button', .46, { y: 14 });
    enter(hero, '.hero-photo', .6, { y: 0, duration: 1 });
    enter(hero, '.hero-audience', .74, { y: 10 });
    sequences.push({ root: document.querySelector('.hero'), tl: hero });
    const sectionSequence = (root, heading, description, rest) => {
      const tl = gsap.timeline({ defaults, scrollTrigger: {
        trigger: root, start: 'top 78%', once: true,
        onLeave: self => self.animation?.progress(1)
      }});
      enter(tl, heading, 0);
      enter(tl, description, .22, { y: 16 });
      rest.forEach((target, i) => enter(tl, target, .42 + i * .13, { y: 16 }));
      sequences.push({ root: document.querySelector(root), tl });
    };
    sectionSequence('#materials', '#materials h2', '.materials-copy > p:not(.fine-print)',
      ['.deliverables', '.material-visual', '.materials-copy .fine-print']);
    sectionSequence('#clients', '#clients h2', '.clients-intro > p',
      ['.client-list', '.clients .cases-button']);
    sectionSequence('#formats', '#formats h2', '#formats .section-heading > p', []);
    document.querySelectorAll('.offer').forEach(offer => {
      const tl = gsap.timeline({ defaults, scrollTrigger: {
        trigger: offer, start: 'top 90%', once: true,
        onLeave: self => self.animation?.progress(1)
      }});
      enter(tl, offer.querySelector('h3'), .1);
      enter(tl, offer.querySelector('.offer-question'), .25);
      enter(tl, offer.querySelector(':scope > p:not(.offer-question)'), .35);
      enter(tl, offer.querySelector('.offer-result'), .45);
      enter(tl, offer.querySelector('.offer-bottom'), .6);
      sequences.push({ root: offer, tl });
    });

    sectionSequence('#contact', '#contact h2', '.contact-copy > p',
      ['.contact-copy .button', '.contact-image']);
    return () => { sequences.length = 0; };
  });
  document.addEventListener('focusin', e => sequences.forEach(({root,tl}) => {
    if (root.contains(e.target)) tl.progress(1);
  }));
  const revealAnchor = () => {
    const id = location.hash.slice(1);
    if (!id || id === 'main') return;
    sequences.forEach(({root,tl}) => { if (root.id === id) tl.progress(1); });
  };
  window.addEventListener('hashchange', revealAnchor);
  window.addEventListener('pageshow', () => { ScrollTrigger.refresh(); revealAnchor(); });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
