const cloud = require('wx-server-sdk');
const https = require('https');
const { assertAdmin } = require('./assertAdmin');

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
        poiid: null,
      };
    }
  } catch (e) {
    console.warn('geocode 失败', e);
  }
  return null;
}

async function resolvePlace(place) {
  if (place === null) return null;
  if (!place || !place.name) return undefined;
  if (place.lng && place.lat) {
    return {
      name: place.name,
      address: place.address || '',
      lng: place.lng,
      lat: place.lat,
      poiid: place.poiid || null,
    };
  }
  const geo = await geocode(place.name);
  return geo || {
    name: place.name,
    address: place.address || '',
    lng: null,
    lat: null,
    poiid: null,
  };
}

function pickEventPatch(input) {
  const patch = {};
  if (typeof input.time === 'string' && input.time) patch.time = input.time;
  if (input.status === 'upcoming' || input.status === 'past') patch.status = input.status;
  if (typeof input.title === 'string') patch.title = input.title;
  if (input.route === null || typeof input.route === 'string') patch.route = input.route || null;
  if (input.note === null || typeof input.note === 'string') patch.note = input.note || null;
  if (input.meet !== undefined) patch.meet = input.meet;
  if (input.starbucks !== undefined) patch.starbucks = input.starbucks;
  return patch;
}

exports.pickEventPatch = pickEventPatch;

exports.main = async (event) => {
  const { id } = event || {};
  if (typeof id !== 'string' || !id) return { code: -1, msg: '缺少 id 参数' };

  const gate = await assertAdmin(cloud, db);
  if (!gate.ok) return { code: gate.code, msg: gate.msg };

  try {
    const existing = await db.collection('events').where({ id }).limit(1).get();
    if (existing.data.length === 0) return { code: -1, msg: '活动不存在' };

    const patch = pickEventPatch(event);
    if (patch.meet !== undefined) {
      const meet = await resolvePlace(patch.meet);
      if (meet === undefined || meet === null) delete patch.meet;
      else patch.meet = meet;
    }
    if (patch.starbucks !== undefined) {
      const sbux = await resolvePlace(patch.starbucks);
      if (sbux === undefined) delete patch.starbucks;
      else patch.starbucks = sbux;
    }

    if (Object.keys(patch).length === 0) {
      return { code: -1, msg: '没有可更新的字段' };
    }

    await db.collection('events').where({ id }).update({ data: patch });
    const updated = await db.collection('events').where({ id }).limit(1).get();
    return { code: 0, msg: 'ok', data: { event: updated.data[0] } };
  } catch (err) {
    console.error('updateEvent 失败', err);
    return { code: -1, msg: err.message || '更新失败' };
  }
};
