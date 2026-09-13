// utils/weather.js
// 封装高德天气 API：拉取预报 + 缓存 + 解析

const AMAP_KEY = 'daa291695ce6f29af3b05436ab1122da';
const CITY = '310000';

const CACHE_TTL = 60 * 60 * 1000;
let cache = null;

function emoji(w) {
  const m = {
    晴: '☀️', 多云: '⛅', 阴: '☁️', 小雨: '🌦️', 中雨: '🌧️', 大雨: '⛈️',
    雷阵雨: '⛈️', 雨夹雪: '🌨️', 雪: '❄️', 雾: '🌫️', 霾: '😷', 沙尘暴: '🌪️',
  };
  return m[w] || '🌤️';
}

async function fetchForecast() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${CITY}&extensions=all`,
      success: (res) => {
        if (res.data && res.data.status === '1' && res.data.forecasts) {
          cache = { fetchedAt: Date.now(), data: res.data.forecasts[0].casts };
          resolve(res.data.forecasts[0].casts);
        } else {
          reject(new Error('weather API error: ' + JSON.stringify(res.data)));
        }
      },
      fail: reject,
    });
  });
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
      if (todayWeek === 6) {
        label1 = '今天';
        label2 = '明天';
      } else if (todayWeek === 0) {
        label1 = '今天';
        label2 = '明天';
      } else {
        label1 = '今天';
        label2 = '明天';
      }
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