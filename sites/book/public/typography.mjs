// Bind short Russian words to what they introduce, without hard line breaks.
export function russianTypography(text) {
  const short=/([А-Яа-яЁё]+)([ \t\u00a0]+)(?=[А-Яа-яЁёA-Za-z0-9«„(])/gu;
  const words=new Set('в к с о а и у на по за из до от не но об со во ко без при для или над под про через перед между после ещё кто что чтобы же бы ли'.split(' '));
  return text.replace(short,(all,word)=>words.has(word.toLowerCase())?word+'\u00a0':all)
    .replace(/(\d+)[ \t]+(?=(?:минут(?:а|ы)?|час(?:а|ов)?|дней|дня|день|лет|год(?:а|ов)?|октября|ноября|декабря|из)(?=[\s.,:;!?]|$))/gu,'$1\u00a0')
    .replace(/(?<=\p{L})-(?=\p{L})/gu,'\u2011');
}
