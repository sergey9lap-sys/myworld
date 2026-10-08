import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('./public/index.html',import.meta.url),'utf8');
const text=html.replaceAll('&nbsp;',' ').replaceAll('&#8209;','-').replace(/<[^>]*>/g,'');
test('work page preserves all five supplied author outcomes',()=>{
  const author=html.match(/id="author"[\s\S]*?<\/section>/)?.[0].replaceAll('&nbsp;',' ').replace(/<[^>]*>/g,'');
  assert.ok(author);
  for(const [heading,description] of [
    ['Проект выглядит сильнее своего бюджета','Детали, подача и анимация помогают создать впечатление уровня крупной студии даже для небольших и средних проектов.'],
    ['Пользователь дольше остаётся на сайте','Интерактив, движение и внимание к деталям удерживают внимание и проводят человека по нужному сценарию.'],
    ['Проект запоминается','Когда дизайн, структура и анимация работают вместе, сайт перестаёт быть ещё одной страницей среди сотен похожих.'],
    ['Сайт создаётся вокруг задачи','Структура, визуал и взаимодействие подстраиваются под проект, а не под готовый шаблон.'],
    ['Первое впечатление работает на вас','Пользователь получает ощущение качества ещё до того, как начинает читать текст или изучать предложение.'],
  ]) { assert.ok(author.includes(heading)); assert.ok(author.includes(description)); }
});
test('services are explained, while enquiries and portfolio stay in place',()=>{
  const services=html.match(/id="services"[\s\S]*?<\/section>/)?.[0];
  assert.equal((services.match(/<dt>/g)||[]).length,7);
  for(const phrase of ['веб-сервисы','Телеграм-боты','Мини-приложения','Автоворонки','PDF','Монтаж видео и анимация графики']) assert.ok(text.includes(phrase));
  for(const marker of ['id="lead-form"','name="consent"','id="privacy"','href="/#works"','src="/work/media/portrait.jpg"','id="success"']) assert.ok(html.includes(marker));
  assert.ok(text.includes('съёмку и сценарий не включаю в монтаж по умолчанию'));
});
test('layout and public labels follow the revised brief',()=>{
  assert.ok(!text.includes('Привет, я Сергей'));
  assert.ok(!text.includes('мир Сергея'));
  assert.ok(!text.includes('Сначала сохраним заявку'));
  assert.ok(!text.includes('О вашей заявке'));
  assert.ok(text.includes('Написать мне'));assert.ok(!text.includes('Написать Сергею'));
  for(const phrase of ['Ценю ваше время','Вовлекаюсь в','Делаю общение комфортным','Отправить заявку']) assert.ok(text.includes(phrase));
  for(const path of ['/work/privacy/','/work/consent/','/work/cookies/']) assert.ok(html.includes(path));
  assert.ok(html.includes('class="author-photo tsuba-portrait"'));
  assert.ok(html.includes('src="/work/media/sergey-japan.png"'));
  assert.equal((html.match(/class="album-leaf"/g)||[]).length,7);
  const script=readFileSync(new URL('./public/page.js',import.meta.url),'utf8');assert.ok(script.includes('disableVerticalSwipes'));
});
