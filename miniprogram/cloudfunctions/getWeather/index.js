// 云函数 getWeather
// 代理高德天气 API（前端无需配域名白名单）
// 🆕 顺带：1 小时缓存（多用户共享）

const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const AMAP_KEY = 'daa291695ce6f29af3b05436ab1122da';
const CITY = '310000';

// 缓存：1 小时内不重复请求
let cache = null;
const CACHE_TTL = 60 * 60 * 1000;

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON 解析失败: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

exports.main = async (event, context) => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return { code: 0, data: cache.data, cached: true };
  }
  try {
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${CITY}&extensions=all`;
    const res = await httpsGet(url);
    if (res.status === '1' && res.forecasts && res.forecasts.length > 0) {
      const casts = res.forecasts[0].casts;
      cache = { fetchedAt: Date.now(), data: casts };
      return { code: 0, data: casts, cached: false };
    }
    return { code: -1, msg: res.info || '高德 API 返回错误' };
  } catch (err) {
    console.error('getWeather 失败', err);
    return { code: -1, msg: err.message || '请求失败' };
  }
};
