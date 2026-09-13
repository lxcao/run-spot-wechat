// utils/weather.js
// 拉取天气预报（通过云函数代理，避开域名白名单限制）

const CACHE_TTL = 60 * 60 * 1000; // 1 小时缓存
let cache = null;
let cacheTime = 0;

function emoji(w) {
  const m = {
    晴: '☀️', 多云: '⛅', 阴: '☁️', 小雨: '🌦️', 中雨: '🌧️', 大雨: '⛈️',
    雷阵雨: '⛈️', 雨夹雪: '🌨️', 雪: '❄️', 雾: '🌫️', 霾: '😷', 沙尘暴: '🌪️',
  };
  return m[w] || '🌤️';
}

// 🆕 改为调云函数
async function fetchForecast() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }
  const res = await new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getWeather',
      success: (r) => resolve(r),
      fail: reject,
    });
  });
  if (res.result && res.result.code === 0 && res.result.data) {
    cache = res.result.data;
    cacheTime = Date.now();
    return cache;
  }
  throw new Error('getWeather 云函数错误: ' + JSON.stringify(res.result));
}

function toWeather(c, label) {
  if (!c) return null;
  return {
    date: c.date,
    label,
    weather: c.dayweather,
    emoji: emoji(c.dayweather),
    dayTemp: c.daytemp,
    nightTemp: c.nighttemp,
    wind: `${c.daywind}风 ${c.daypower}级`,
  };
}

async function getWeekendWeather() {
  try {
    const casts = await fetchForecast();
    if (!casts || casts.length === 0) {
      return { sat: null, sun: null, available: false };
    }

    // 智能选最近两天：
    //   - 周日（0）：今天 + 明天
    //   - 周五（5）/周六（6）：今天 + 明天
    //   - 周一~四：找最近的周六 + 周日
    const todayWeek = new Date().getDay();

    let day1, day2, label1, label2;
    if (todayWeek === 5 || todayWeek === 6 || todayWeek === 0) {
      day1 = casts[0];
      day2 = casts[1];
      label1 = '今天';
      label2 = '明天';
    } else {
      // 周一~四：找最近的周六 + 周日
      const sat = casts.find((c) => String(c.week) === '6');
      const sun = casts.find((c) => String(c.week) === '7');
      day1 = sat;
      day2 = sun;
      label1 = '周六';
      label2 = '周日';
    }

    const sat = toWeather(day1, label1);
    const sun = toWeather(day2, label2);

    return {
      sat,
      sun,
      available: !!(sat || sun),
    };
  } catch (err) {
    console.error('getWeekendWeather 失败', err);
    return { sat: null, sun: null, available: false, error: true };
  }
}

module.exports = { getWeekendWeather, emoji };