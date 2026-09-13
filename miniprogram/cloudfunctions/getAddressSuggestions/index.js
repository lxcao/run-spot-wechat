// 云函数 getAddressSuggestions
// 高德地址联想 API 代理（避免 key 暴露给前端）
// 🆕 用 Node.js https 模块，不用 wx（云函数无 wx 全局对象）

const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const AMAP_KEY = 'daa291695ce6f29af3b05436ab1122da';
const CITY = '上海';

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
  const { keyword } = event || {};
  if (!keyword || keyword.length < 1) {
    return { code: 0, data: [] };
  }
  try {
    const url = `https://restapi.amap.com/v3/assistant/inputtips?key=${AMAP_KEY}&keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(CITY)}&citylimit=true`;
    const res = await httpsGet(url);
    if (res.status === '1') {
      const tips = (res.tips || []).slice(0, 10).map((t) => ({
        name: t.name,
        address: t.address,
        location: t.location,
        district: t.district,
      }));
      return { code: 0, data: tips };
    }
    return { code: 0, data: [] };
  } catch (err) {
    console.error('getAddressSuggestions 失败', err);
    return { code: -1, msg: err.message, data: [] };
  }
};
