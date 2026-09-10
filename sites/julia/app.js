const form = document.querySelector('#lesson-brief');
const result = document.querySelector('.brief-result');
const message = document.querySelector('#brief-message');
const sendLink = document.querySelector('#brief-send');
const copyButton = document.querySelector('#brief-copy');
const copyStatus = document.querySelector('#copy-status');
const progress = [...document.querySelectorAll('.brief-progress i')];

const fields = ['goal', 'experience', 'format'];
const prompts = {
  goal: 'Сначала выберите, зачем хотите заниматься.',
  experience: 'Теперь укажите свой опыт занятий вокалом.',
  format: 'Осталось выбрать удобный формат занятий.'
};

function selectedValue(name) {
  return form.elements[name].value;
}

function composeMessage() {
  return `Здравствуйте, Юлия! Хочу ${selectedValue('goal')}. Мой опыт: ${selectedValue('experience')}. Удобнее заниматься ${selectedValue('format')}. Подскажите, пожалуйста, условия пробного урока.`;
}

function animateResult() {
  result.classList.remove('is-updating');
  requestAnimationFrame(() => result.classList.add('is-updating'));
}

function updateBrief() {
  const completed = fields.filter(selectedValue).length;
  progress.forEach((segment, index) => segment.classList.toggle('is-complete', index < completed));

  if (completed < fields.length) {
    const nextField = fields.find(name => !selectedValue(name));
    message.textContent = completed ? prompts[nextField] : 'Ответьте на три вопроса — здесь появится готовое сообщение, которое можно отправить мне.';
    sendLink.classList.add('is-disabled');
    sendLink.setAttribute('aria-disabled', 'true');
    sendLink.href = 'https://t.me/spitsina_julia';
    copyButton.disabled = true;
    copyStatus.textContent = `${completed} из 3 ответов выбрано.`;
    animateResult();
    return;
  }

  const text = composeMessage();
  message.textContent = text;
  sendLink.href = `https://t.me/spitsina_julia?text=${encodeURIComponent(text)}`;
  sendLink.classList.remove('is-disabled');
  sendLink.removeAttribute('aria-disabled');
  copyButton.disabled = false;
  copyStatus.textContent = 'Запрос готов — его можно отправить или скопировать.';
  animateResult();
}

form.addEventListener('change', updateBrief);

sendLink.addEventListener('click', event => {
  if (sendLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(composeMessage());
    copyStatus.textContent = 'Текст скопирован.';
    copyButton.textContent = 'Скопировано';
    setTimeout(() => {
      copyButton.textContent = 'Скопировать текст';
      copyStatus.textContent = 'Запрос готов — его можно отправить или скопировать.';
    }, 1800);
  } catch {
    copyStatus.textContent = 'Не удалось скопировать. Выделите текст сообщения вручную.';
  }
});

updateBrief();

const methodTabs = document.querySelector('[data-method-tabs]');

if (methodTabs) {
  const tabs = [...methodTabs.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function activateMethodTab(nextIndex, focus = false) {
    tabs.forEach((tab, index) => {
      const selected = index === nextIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
    });

    const panel = panels[nextIndex];
    if (!reduceMotion) {
      panel.animate(
        [{ opacity: .35, transform: 'translateY(8px)', clipPath: 'inset(0 0 12% 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0)' }],
        { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' }
      );
    }
    if (focus) tabs[nextIndex].focus();
  }

  methodTabs.classList.add('is-enhanced');
  activateMethodTab(0);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateMethodTab(index));
    tab.addEventListener('keydown', event => {
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      activateMethodTab(nextIndex, true);
    });
  });
}

// The page reveals each section in reading order: promise, context, then proof/action.
// Content remains visible when JavaScript is unavailable; these styles exist only after setup.
const reducePageMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealSequences = [
  {
    root: '.hero',
    items: ['h1', '.hero-copy > p', '.hero-photo', '.hero .button', '.scroll-cue'],
    immediate: true,
    focal: true
  },
  {
    root: '.request-lab',
    items: ['.request-heading h2', '.request-heading p', '.request-builder']
  },
  {
    root: '.method',
    items: ['.section-title h2', '.section-title p', '.method-tabs']
  },
  {
    root: '.destinations',
    items: ['.destinations-copy h2', '.destinations-copy p', '.destination-stage', '.fact-line']
  },
  {
    root: '.proof',
    items: ['.proof-copy h2', '.proof-copy > p', '.stories', 'blockquote', '.reviews-panel']
  },
  {
    root: '.contact',
    items: ['h2', 'p', '.button']
  }
];

function prepareSequence(sequence) {
  const root = document.querySelector(sequence.root);
  if (!root) return null;

  const elements = sequence.items
    .map(selector => root.querySelector(selector))
    .filter(Boolean);

  elements.forEach(element => {
    element.style.opacity = '0';
    if (!reducePageMotion) {
      element.style.transform = element.matches('.hero-photo')
        ? 'translateX(18px) scale(.985)'
        : 'translateY(14px)';
      if (element.matches('.hero-photo')) element.style.clipPath = 'inset(0 0 0 16%)';
    }
  });

  return { ...sequence, root, elements };
}

function playSequence(sequence) {
  const step = sequence.focal ? 95 : 78;
  const duration = sequence.focal ? 620 : 480;

  sequence.elements.forEach((element, index) => {
    const isPortrait = element.matches('.hero-photo');
    const keyframes = reducePageMotion
      ? [{ opacity: 0 }, { opacity: 1 }]
      : isPortrait
        ? [
            { opacity: 0, transform: 'translateX(18px) scale(.985)', clipPath: 'inset(0 0 0 16%)' },
            { opacity: 1, transform: 'none', clipPath: 'inset(0)' }
          ]
        : [
            { opacity: 0, transform: 'translateY(14px)' },
            { opacity: 1, transform: 'none' }
          ];

    const animation = element.animate(keyframes, {
      duration: reducePageMotion ? 220 : duration,
      delay: index * step,
      easing: 'cubic-bezier(.23,1,.32,1)',
      fill: 'forwards'
    });

    animation.addEventListener('finish', () => {
      element.style.removeProperty('opacity');
      element.style.removeProperty('transform');
      element.style.removeProperty('clip-path');
      animation.cancel();
    }, { once: true });
  });
}

const preparedSequences = revealSequences.map(prepareSequence).filter(Boolean);
const heroSequence = preparedSequences.find(sequence => sequence.immediate);
if (heroSequence) requestAnimationFrame(() => playSequence(heroSequence));

const observedSequences = preparedSequences.filter(sequence => !sequence.immediate);
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const sequence = observedSequences.find(item => item.root === entry.target);
      if (sequence) playSequence(sequence);
      sectionObserver.unobserve(entry.target);
    });
  }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });

  observedSequences.forEach(sequence => sectionObserver.observe(sequence.root));
} else {
  observedSequences.forEach(playSequence);
}
