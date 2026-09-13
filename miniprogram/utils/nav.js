// utils/nav.js
// 唤起系统地图（高德/百度/腾讯 取决于用户手机）

function openInMap(poi) {
  if (!poi || !poi.lng || !poi.lat) {
    wx.showToast({ title: '暂无坐标', icon: 'none' });
    return;
  }
  wx.openLocation({
    latitude: Number(poi.lat),
    longitude: Number(poi.lng),
    name: poi.name || '',
    address: poi.address || '',
    scale: 18,
  });
}

module.exports = { openInMap };