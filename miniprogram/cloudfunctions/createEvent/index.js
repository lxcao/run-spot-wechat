// 云函数 createEvent
// 通过表单数据创建活动（自动调高德 geocode + 写数据库）
// 🆕 用 Node.js https 模块，不用 wx

const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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

async function geocode(name) {
  if (!name) return null;
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(name)}&city=${encodeURIComponent(CITY)}`;
    const res = await httpsGet(url);
    if (res.status === '1' && res.geocodes && res.geocodes.length > 0) {
      const g = res.geocodes[0];
      const [lng, lat] = g.location.split(',');
      return {
        name,
        address: g.formatted_address || name,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
      };
    }
  } catch (e) {
    console.warn('geocode 失败', e);
  }
  return null;
}

function generateId(date) {
  return date;
}

function calcWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
}

exports.main = async (event, context) => {
  const {
    date, time, meet, starbucks, route, note, status,
  } = event || {};

  // 🔐 权限检查
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();
  const admins = teamRes.data[0]?.admins || [];
  if (!Array.isArray(admins) || !admins.includes(OPENID)) {
    return { code: -1, msg: '未授权：请联系群主把你加入管理员列表' };
  }

  if (!date || !time) {
    return { code: -1, msg: '请填写日期和时间' };
  }
  if (!meet || !meet.name) {
    return { code: -1, msg: '请填写集合点' };
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  if (date < todayISO) {
    return { code: -1, msg: '日期不能是过去' };
  }

  const id = generateId(date);
  const existing = await db.collection('events').where({ id }).limit(1).get();
  if (existing.data.length > 0) {
    return { code: -1, msg: `${date} 已经有活动了，请删除原活动或换日期` };
  }

  try {
    // 集合点：优先用前端传入的精确坐标（来自 inputtips），没有才 geocode
    let meetObj = { name: meet.name, address: meet.address || '', lng: null, lat: null };
    if (meet.lng && meet.lat) {
      // ✅ 用前端 inputtips 给的精确坐标
      meetObj.lng = meet.lng;
      meetObj.lat = meet.lat;
    } else {
      // ❌ 没有坐标 → 降级用 geocode
      const geo = await geocode(meet.name);
      if (geo) {
        meetObj = geo;
      } else {
        // ⚠️ geocode 也失败 → 还是写入（lng/lat = null，详情页只显示名称不显示地图）
        meetObj.lng = null;
        meetObj.lat = null;
      }
    }

    // 星巴克：同样逻辑
    let sbuxObj = null;
    if (starbucks && starbucks.name) {
      sbuxObj = { name: starbucks.name, address: starbucks.address || '', lng: null, lat: null };
      if (starbucks.lng && starbucks.lat) {
        // ✅ 用前端 inputtips 给的精确坐标
        sbuxObj.lng = starbucks.lng;
        sbuxObj.lat = starbucks.lat;
      } else {
        // ❌ 降级用 geocode
        const geo = await geocode(starbucks.name);
        if (geo) {
          sbuxObj.lng = geo.lng;
          sbuxObj.lat = geo.lat;
          sbuxObj.address = geo.address || starbucks.address || '';
        }
        // geocode 失败也保留 name/address（lng/lat = null）
      }
    }

    const newEvent = {
      id,
      title: meet.name,
      date,
      weekday: calcWeekday(date),
      time,
      status: status || 'upcoming',
      meet: {
        name: meetObj.name,
        address: meetObj.address,
        lng: meetObj.lng,
        lat: meetObj.lat,
        poiid: null,
      },
      starbucks: sbuxObj
        ? {
            name: sbuxObj.name,
            address: sbuxObj.address,
            lng: sbuxObj.lng,
            lat: sbuxObj.lat,
            poiid: null,
          }
        : null,
      route: route || null,
      note: note || null,
      attendees: null,
      weather: null,
      photos: [],
    };

    await db.collection('events').add({ data: newEvent });

    return {
      code: 0,
      msg: 'ok',
      data: { event: newEvent },
    };
  } catch (err) {
    console.error('createEvent 失败', err);
    return { code: -1, msg: err.message || '创建失败' };
  }
};
