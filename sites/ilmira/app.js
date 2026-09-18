const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const form = document.querySelector('#request-form');
const serviceInput = document.querySelector('#service-select');
const formStatus = document.querySelector('#form-status');

document.querySelectorAll('.service-cta[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    serviceInput.value = link.dataset.service;
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const message = [
    'Здравствуйте, Ильмира! Хочу записаться.',
    `Формат: ${data.get('service')}`,
    `Имя: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Телефон: ${data.get('phone')}`
  ].join('\n');
  const telegramUrl = `https://t.me/Ilmirakirim?text=${encodeURIComponent(message)}`;
  formStatus.innerHTML = `Открываю Telegram. Если переход не сработал, <a href="${telegramUrl}" target="_blank" rel="noopener">нажмите здесь</a>.`;
  window.open(telegramUrl, '_blank', 'noopener');
});

const dialog = document.querySelector('#lightbox');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    const img = document.querySelector('#lightbox-image');
    img.src = button.dataset.image;
    img.alt = button.dataset.caption;
    document.querySelector('#lightbox-caption').textContent = button.dataset.caption;
    dialog.showModal();
  });
});
document.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});

// Preserve wording; bind only short prepositions.
const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
const nodes = [];
while (walker.nextNode()) nodes.push(walker.currentNode);
for (const node of nodes) {
  if (node.parentElement.closest('script,style,textarea,option,select')) continue;
  node.textContent = node.textContent.replace(/(^|[\s(])(в|к|с|у|о|и|а|на|по|из|от|до|за|не|но|для|без|или|я) /giu, '$1$2\u00a0');
}

// Native scrolling keeps swipe, keyboard, and the no-JS fallback.
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const controls = carousel.querySelector('.carousel-controls');
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const count = carousel.querySelector('.carousel-count');
  controls.hidden = false;
  const measure = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = slides[0].getBoundingClientRect().width + gap;
    const visible = Math.max(1, Math.round((track.clientWidth + gap) / step));
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const index = Math.min(slides.length - visible, Math.max(0, Math.round(track.scrollLeft / step)));
    return {step, visible, max, index};
  };
  let lastLabel = '';
  const refresh = () => {
    const {visible, max, index} = measure();
    const label = visible > 1 ? (index + 1) + '–' + Math.min(index + visible, slides.length) + ' / ' + slides.length : (index + 1) + ' / ' + slides.length;
    if (label !== lastLabel) { count.textContent = label; lastLabel = label; }
    prev.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft >= max - 2;
    carousel.querySelectorAll('.quote-body').forEach(body => {
      body.parentElement.querySelector('.quote-hint').hidden = body.scrollHeight <= body.clientHeight + 2;
    });
  };
  const move = (direction, keyboard) => {
    const {step, visible, max, index} = measure();
    track.scrollTo({left: Math.max(0, Math.min(max, (index + direction * visible) * step)), behavior: reduceMotion.matches || keyboard ? 'instant' : 'smooth'});
  };
  prev.addEventListener('click', event => move(-1, event.detail === 0));
  next.addEventListener('click', event => move(1, event.detail === 0));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') {
      track.scrollTo({left: event.key === 'Home' ? 0 : measure().max, behavior: 'instant'});
    } else move(event.key === 'ArrowLeft' ? -1 : 1, true);
  });
  let frame;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(refresh);
  }, {passive: true});
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(track);
  document.fonts.ready.then(refresh);
  refresh();
});

// One-time hierarchy reveal; nothing is hidden before the observer runs.
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (reduceMotion.matches) return;
      const targets = entry.target.matches('.perspectives') ? Array.from(entry.target.children) : [entry.target];
      targets.forEach((target, index) => {
        target.animate(
          [{opacity: .45, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}],
          {duration: 500, delay: index * 50, easing: 'cubic-bezier(.23,1,.32,1)'}
        );
      });
    });
  }, {threshold: .06, rootMargin: '0px 0px -24px 0px'});
  document.querySelectorAll('main h2, .biography-list, .strategy-intro, .perspectives, .benefit-list, .source-service, [data-carousel], .paris-copy, .signup-panel, .source-contacts').forEach(el => observer.observe(el));
  reduceMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    document.getAnimations().forEach(animation => animation.cancel());
  });
}
