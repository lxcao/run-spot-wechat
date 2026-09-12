/* ============================================================
   甲骨文魔都跑团 · 主应用
   单页应用：URL hash 路由（#/event/<id>）
   数据：data/events.json
   ============================================================ */

const App = (() => {
  let DATA = null;

  // 工具
  const $ = (sel, root = document) => root.querySelector(sel);
  const escapeHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return {
      y: d.getFullYear(),
      m: d.getMonth() + 1,
      day: d.getDate(),
      weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()],
    };
  };

  const todayISO = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  };

  // 数据加载
  async function loadData() {
    if (DATA) return DATA;
    const res = await fetch("./data/events.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`events.json 加载失败: ${res.status}`);
    DATA = await res.json();
    const today = todayISO();
    DATA.events.forEach((e) => {
      e._date = formatDate(e.date);
      e._isToday = e.date === today;
      // 优先用 events.json 里手设的 status，没设才按日期自动判断
      if (e.status === "upcoming" || e.status === "past") {
        e._status = e.status;
      } else {
        e._status = e.date >= today ? "upcoming" : "past";
      }
    });
    return DATA;
  }

  // 排序：即将开始在前（按日期升序），历史在后（按日期倒序）
  function sortedEvents(events) {
    const upcoming = events
      .filter((e) => e._status === "upcoming")
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = events
      .filter((e) => e._status === "past")
      .sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming, past };
  }

  // ---------- 渲染：主页 ----------
  function renderHome(team, events) {
    const { upcoming, past } = sortedEvents(events);
    const hero = upcoming[0];
    const upcomingList = upcoming.slice(1); // 其余即将活动

    return `
      <div class="app home">
        <header class="brand-header">
          <div class="logo">
            <span class="logo-emoji">🏃‍♂️</span>
            <span class="brand-name">${escapeHtml(team.name)}</span>
          </div>
          <div class="slogan">${escapeHtml(team.slogan)}</div>
          <div class="city-tag">📍 ${escapeHtml(team.city || "上海")}</div>
        </header>

        ${
          hero
            ? `
        <section class="section">
          <div class="section-title">本周集合 <span class="count">${hero._date.weekday} ${hero._date.m}/${hero._date.day}</span></div>
          ${renderUpcomingHero(hero)}
        </section>
        `
            : `
        <section class="section">
          <div class="empty">暂无即将开始的活动<br>等群主发布下一场吧~</div>
        </section>
        `
        }

        ${
          upcomingList.length > 0
            ? `
        <section class="section">
          <div class="section-title">后续活动 <span class="count">${upcomingList.length} 场</span></div>
          <div class="history-list">
            ${upcomingList.map((e) => renderHistoryCard(e)).join("")}
          </div>
        </section>
        `
            : ""
        }

        <section class="section">
          <div class="section-title">历史活动 <span class="count">共 ${past.length} 场</span></div>
          ${
            past.length > 0
              ? `<div class="history-list">${past.map((e) => renderHistoryCard(e)).join("")}</div>`
              : `<div class="empty">还没有历史活动</div>`
          }
        </section>

        <footer class="footer">
          <div class="footer-line">${escapeHtml(team.name)}</div>
          <div class="footer-line">每个周末做回自己，八卦别人 ☕</div>
        </footer>
      </div>
    `;
  }

  function renderUpcomingHero(e) {
    return `
      <article class="upcoming-card">
        <div class="badge">${e._isToday ? "今天" : "本周"}</div>
        <h3 class="title">${escapeHtml(e.title || e.meet.name)}</h3>
        <div class="when">
          <span class="weekday">${e._date.weekday}</span>
          <span>${e._date.m} 月 ${e._date.day} 日 · ${escapeHtml(e.time || "07:00")}</span>
        </div>
        <div class="where">
          <div class="where-icon">📍</div>
          <div class="where-text">
            <div class="where-name">${escapeHtml(e.meet.name)}</div>
            <div class="where-addr">${escapeHtml(e.meet.address || "")}</div>
          </div>
        </div>
        ${
          e.starbucks && e.starbucks.name
            ? `
        <div class="where">
          <div class="where-icon">☕</div>
          <div class="where-text">
            <div class="where-name">${escapeHtml(e.starbucks.name)}</div>
            <div class="where-addr">跑完在这里吃早饭</div>
          </div>
        </div>
        `
            : ""
        }
        ${
          e.route
            ? `<div class="where"><div class="where-icon">🗺️</div><div class="where-text"><div class="where-name">路线</div><div class="where-addr">${escapeHtml(e.route)}</div></div></div>`
            : ""
        }
        ${e.note ? `<div class="note">📌 ${escapeHtml(e.note)}</div>` : ""}
        <div class="cta-row">
          <a class="btn btn-primary" href="#/event/${e.id}">📍 看地图导航</a>
        </div>
      </article>
    `;
  }

  function renderHistoryCard(e) {
    return `
      <a class="history-card" href="#/event/${e.id}">
        <div class="date-block">
          <div class="month">${e._date.m}月</div>
          <div class="day">${e._date.day}</div>
          <div class="weekday">${e._date.weekday}</div>
        </div>
        <div class="info">
          <div class="title">${escapeHtml(e.title || e.meet.name)}</div>
          <div class="meta">
            <span class="stat">🕐 ${escapeHtml(e.time || "07:00")}</span>
            <span class="stat">📍 ${escapeHtml(e.meet.name)}</span>
            ${e.attendees ? `<span class="stat">👥 ${e.attendees} 人</span>` : ""}
            ${e.weather ? `<span class="stat">${weatherEmoji(e.weather)} ${escapeHtml(e.weather)}</span>` : ""}
          </div>
        </div>
        <div class="arrow">›</div>
      </a>
    `;
  }

  function weatherEmoji(w) {
    const map = { 晴: "☀️", 多云: "⛅", 阴: "☁️", 雨: "🌧️", 雪: "❄️" };
    return map[w] || "🌤️";
  }

  // ---------- 渲染：详情页 ----------
  function renderDetail(team, e) {
    const hero = e._status === "upcoming" ? "upcoming" : "past";
    return `
      <div class="app detail-page">
        <header class="brand-header">
          <a class="back" href="#/">‹ 返回 ${escapeHtml(team.name)}</a>
          <div class="logo">
            <span class="logo-emoji">🏃‍♂️</span>
            <span class="brand-name">${escapeHtml(team.name)}</span>
          </div>
        </header>

        <div class="detail-card">
          <div class="badge ${hero}">${hero === "upcoming" ? (e._isToday ? "今天" : "即将开始") : "历史活动"}</div>
          <h2>${escapeHtml(e.title || e.meet.name)}</h2>
          <div class="subtitle">
            <span class="weekday">${e._date.weekday}</span>
            <span>${e._date.y} 年 ${e._date.m} 月 ${e._date.day} 日 · ${escapeHtml(e.time || "07:00")}</span>
          </div>

          <div class="info-row">
            <div class="icon meet">📍</div>
            <div class="body">
              <div class="label">集合点</div>
              <div class="value">${escapeHtml(e.meet.name)}</div>
              <div class="value-sub">${escapeHtml(e.meet.address || "")}</div>
            </div>
          </div>

          ${
            e.starbucks && e.starbucks.name
              ? `
          <div class="info-row">
            <div class="icon sbux">☕</div>
            <div class="body">
              <div class="label">跑完星巴克</div>
              <div class="value">${escapeHtml(e.starbucks.name)}</div>
              <div class="value-sub">${escapeHtml(e.starbucks.address || "")}</div>
            </div>
          </div>
          `
              : ""
          }

          ${
            e.route
              ? `
          <div class="info-row">
            <div class="icon">🗺️</div>
            <div class="body">
              <div class="label">路线</div>
              <div class="value">${escapeHtml(e.route)}</div>
            </div>
          </div>
          `
              : ""
          }

          ${
            e.attendees || e.weather
              ? `
          <div class="info-row">
            <div class="icon">📊</div>
            <div class="body">
              <div class="label">现场记录</div>
              <div class="value">
                ${e.attendees ? `<span>👥 ${e.attendees} 人到场</span>` : ""}
                ${e.attendees && e.weather ? " · " : ""}
                ${e.weather ? `<span>${weatherEmoji(e.weather)} ${escapeHtml(e.weather)}</span>` : ""}
              </div>
            </div>
          </div>
          `
              : ""
          }

          ${e.note ? `<div class="note-block">📌 ${escapeHtml(e.note)}</div>` : ""}
        </div>

        <div class="map-wrap">
          <div id="map"></div>
          <div class="map-actions">
            <a class="btn btn-primary" id="nav-meet">📍 导航去集合点</a>
            ${
              e.starbucks && e.starbucks.lng
                ? `<a class="btn btn-secondary" id="nav-sbux">☕ 导航去星巴克</a>`
                : ""
            }
          </div>
        </div>

        <footer class="footer">
          <div class="footer-line">${escapeHtml(team.name)}</div>
          <div class="footer-line">${escapeHtml(team.slogan)}</div>
        </footer>
      </div>
    `;
  }

  // ---------- 地图渲染（继承 amap-trip-planner）----------
  async function mountMap(e) {
    if (!window.L) {
      console.error("Leaflet 未加载");
      return;
    }
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    const meet = e.meet;
    const sbux = e.starbucks && e.starbucks.lng ? e.starbucks : null;
    const pins = [];
    if (meet && meet.lng && meet.lat) pins.push({ ...meet, kind: "meet" });
    if (sbux) pins.push({ ...sbux, kind: "sbux" });

    if (pins.length === 0) {
      mapEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px;">📍 暂无地图数据<br><span style="font-size:11px;">（群主还未填写坐标）</span></div>`;
      return;
    }

    // 默认视图中心
    const center = pins.length === 1 ? [pins[0].lat, pins[0].lng] : [
      (pins[0].lat + pins[1].lat) / 2,
      (pins[0].lng + pins[1].lng) / 2,
    ];

    const map = L.map("map", { zoomControl: true }).setView(center, pins.length === 1 ? 16 : 14);

    L.tileLayer(
      "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      { subdomains: "1234", attribution: "高德地图", maxZoom: 19 }
    ).addTo(map);

    // pins
    pins.forEach((p) => {
      const icon = pinIcon(p.kind === "meet" ? "#C74634" : "#006241", p.kind === "meet" ? "📍" : "☕", p.name);
      const marker = L.marker([p.lat, p.lng], { icon, title: p.name }).addTo(map);
      marker.bindPopup(
        `<b>${p.kind === "meet" ? "📍" : "☕"} ${escapeHtml(p.name)}</b><br>` +
          `<span style="font-size:12px;color:#666">${escapeHtml(p.address || "")}</span>`
      );
    });

    if (pins.length > 1) {
      map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])).pad(0.25));
    }

    // 导航按钮
    const navMeet = document.getElementById("nav-meet");
    if (navMeet && meet.lng && meet.lat) {
      navMeet.href = buildAmapURI({ to: meet, mode: "walk" });
    }
    const navSbux = document.getElementById("nav-sbux");
    if (navSbux && sbux && sbux.lng && sbux.lat) {
      navSbux.href = buildAmapURI({ to: sbux, mode: "walk" });
    }
  }

  function pinIcon(color, glyph, label) {
    return L.divIcon({
      className: "pin-wrap",
      html: `
        <div style="position:relative;transform:translate(-50%,-100%);text-align:center;font:600 12px/1.2 -apple-system,'PingFang SC',sans-serif;color:white;user-select:none;cursor:grab;">
          <div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;margin:0 auto;">${glyph}</div>
          <div style="position:absolute;top:32px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:2px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);font-size:11px;max-width:140px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(label || "")}</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }

  function buildAmapURI({ to, mode = "walk" }) {
    // uri.amap.com 导航：起点=我的位置（设备 GPS），终点=目标
    const toStr = `${to.lng},${to.lat},${encodeURIComponent(to.name)}`;
    return `https://uri.amap.com/navigation?to=${toStr}&mode=${mode}&src=OracleRun&coordinate=gaode&callnative=1`;
  }

  // ---------- 路由 ----------
  async function route() {
    const root = $("#app-root");
    try {
      const data = await loadData();
      const hash = location.hash || "#/";
      if (hash.startsWith("#/event/")) {
        const id = hash.replace("#/event/", "");
        const e = data.events.find((x) => x.id === id);
        if (!e) {
          root.innerHTML = `<div class="empty">活动不存在 <a href="#/">返回</a></div>`;
          return;
        }
        root.innerHTML = renderDetail(data.team, e);
        // 等 Leaflet 加载完
        if (window.L) {
          mountMap(e);
        } else {
          const timer = setInterval(() => {
            if (window.L) {
              clearInterval(timer);
              mountMap(e);
            }
          }, 50);
          setTimeout(() => clearInterval(timer), 5000);
        }
      } else {
        root.innerHTML = renderHome(data.team, data.events);
      }
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      root.innerHTML = `<div class="empty">⚠️ 加载失败：${escapeHtml(err.message)}<br><span style="font-size:12px">请检查 data/events.json 是否存在</span></div>`;
    }
  }

  // ---------- 微信内浏览器提示 ----------
  function detectWeChat() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("micromessenger") !== -1;
  }

  function showWeChatTip() {
    if (!detectWeChat()) return;
    if (sessionStorage.getItem("wx-tip-dismissed")) return;
    const tip = document.createElement("div");
    tip.className = "wechat-tip visible";
    tip.innerHTML = `
      <span>点右上角 · 选"在浏览器打开"可获得完整导航体验</span>
      <button class="close" aria-label="关闭">×</button>
    `;
    document.body.appendChild(tip);
    tip.querySelector(".close").onclick = () => {
      tip.remove();
      sessionStorage.setItem("wx-tip-dismissed", "1");
    };
    setTimeout(() => tip.remove(), 8000);
  }

  // ---------- 初始化 ----------
  function init() {
    window.addEventListener("hashchange", route);
    route();
    showWeChatTip();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { init };
})();