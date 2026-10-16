// utils/date.js

function formatDate(iso) {
  if (!iso) return { y: 0, m: 0, day: 0, weekday: '' };
  const d = new Date(iso + 'T00:00:00');
  return {
    y: d.getFullYear(),
    m: d.getMonth() + 1,
    day: d.getDate(),
    weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
  };
}

function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function annotateEventStatus(event, today = todayISO()) {
  const date = event.date || '';
  const _status = date < today ? 'past' : event.status === 'past' ? 'past' : 'upcoming';
  return { ...event, _status };
}

function weatherEmoji(w) {
  const map = { 晴: '☀️', 多云: '⛅', 阴: '☁️', 雨: '🌧️', 雪: '❄️' };
  return map[w] || '🌤️';
}

module.exports = { formatDate, todayISO, annotateEventStatus, weatherEmoji };