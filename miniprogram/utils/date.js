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

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function weatherEmoji(w) {
  const map = { 晴: '☀️', 多云: '⛅', 阴: '☁️', 雨: '🌧️', 雪: '❄️' };
  return map[w] || '🌤️';
}

module.exports = { formatDate, todayISO, weatherEmoji };