(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const PERIOD_NAMES = { today: 'Today', week: 'Last 7 days', month: 'Last 30 days', all: 'Last 7 months' };
  const PERIOD_SCOPES = { today: 'today', week: 'this week', month: 'this month', all: 'along the way' };
  const STORAGE_KEYS = { snapshot: 'gratitude.snapshot', wins: 'gratitude.saved-wins', journal: 'gratitude.journal' };

  function readStorage(storage, key, fallback) {
    try {
      return JSON.parse(window[storage].getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      window[storage].setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function icon(name, extraClass = '') {
    return `<svg class="icon ${extraClass}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  function announce(message) {
    $('#announcement').textContent = message;
  }

  const storedWins = readStorage('localStorage', STORAGE_KEYS.wins, []);
  const savedWins = new Set(Array.isArray(storedWins) ? storedWins.filter((win) => typeof win === 'string') : []);
  const storedEntries = readStorage('localStorage', STORAGE_KEYS.journal, []);
  const entries = Array.isArray(storedEntries) ? storedEntries.filter((entry) => entry && typeof entry.text === 'string' && !Number.isNaN(Date.parse(entry.date))).slice(0, 60) : [];
  const previous = readStorage('sessionStorage', STORAGE_KEYS.snapshot, null);
  let snapshot = GratitudeData.createSnapshot('week', previous);

  function sparkline(metric) {
    const minimum = Math.min(...metric.points) - 2;
    const maximum = Math.max(...metric.points) + 2;
    const points = metric.points.map((value, index) => `${(index / (metric.points.length - 1)) * 80},${26 - ((value - minimum) / (maximum - minimum)) * 24}`).join(' ');
    return `<svg class="sparkline" viewBox="0 0 80 30" aria-hidden="true"><defs><linearGradient id="spark-${metric.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".2"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><polygon points="0,30 ${points} 80,30" fill="url(#spark-${metric.id})"/><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderMetrics() {
    $('#metrics').innerHTML = snapshot.metrics.map((metric) => `<article class="metric ${metric.color}"><div class="metric-icon">${icon(metric.icon)}</div><div class="metric-content"><h2>${escapeHTML(metric.label)}</h2><div class="metric-value-line"><strong class="metric-value">${escapeHTML(metric.value)}</strong><span class="metric-change"><span aria-hidden="true">↗</span> +${metric.change}%<span class="sr-only"> positive trend</span></span></div><p class="metric-detail">${escapeHTML(metric.detail)}</p></div>${sparkline(metric)}</article>`).join('');
  }

  function renderMoments() {
    const { values, labels } = snapshot.moments;
    const total = values.at(-1);
    const growth = Math.round(((total - values[0]) / values[0]) * 100);
    $('#moments-total').textContent = total;
    $('#moments-scope').textContent = PERIOD_SCOPES[snapshot.period];
    $('#moments-growth').textContent = `↗ +${growth}% more noticed`;
    $('#chart-period').textContent = PERIOD_NAMES[snapshot.period];

    const container = $('#moments-chart');
    const width = Math.max(container.clientWidth, 280);
    const height = container.clientHeight;
    const padding = { top: 12, right: 16, bottom: 26, left: 30 };
    const bottom = height - padding.bottom;
    const maximum = Math.ceil(total / 20) * 20;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = bottom - padding.top;
    const points = values.map((value, index) => ({ x: padding.left + (index / (values.length - 1)) * chartWidth, y: bottom - (value / maximum) * chartHeight }));
    let line = `M${points[0].x},${points[0].y}`;
    points.slice(1).forEach((point, index) => {
      const midpoint = (points[index].x + point.x) / 2;
      line += ` C${midpoint},${points[index].y} ${midpoint},${point.y} ${point.x},${point.y}`;
    });
    const grid = Array.from({ length: 5 }, (_, index) => {
      const value = (maximum / 4) * index;
      const y = bottom - (index / 4) * chartHeight;
      return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/><text class="chart-axis-label" x="${padding.left - 9}" y="${y + 3}" text-anchor="end">${value}</text>`;
    }).join('');
    const ticks = points.map((point, index) => `<text class="chart-axis-label" x="${point.x}" y="${height - 7}" text-anchor="middle">${escapeHTML(labels[index])}</text>`).join('');
    const dots = points.map((point, index) => `<g class="chart-point" tabindex="0" role="img" aria-label="${escapeHTML(labels[index])}: ${values[index]} good moments" data-index="${index}" data-x="${point.x}" data-y="${point.y}"><circle cx="${point.x}" cy="${point.y}" r="12" fill="transparent"/><circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="4"/></g>`).join('');
    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="Good moments noticed, growing from ${values[0]} to ${total}. ${PERIOD_NAMES[snapshot.period]}."><defs><linearGradient id="moments-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#58a0f5" stop-opacity=".29"/><stop offset="100%" stop-color="#58a0f5" stop-opacity=".03"/></linearGradient></defs>${grid}<path d="${line} L${points.at(-1).x},${bottom} L${points[0].x},${bottom} Z" fill="url(#moments-fill)"/><path d="${line}" fill="none" stroke="#2980f5" stroke-width="2.4" stroke-linecap="round"/>${ticks}${dots}</svg><div class="chart-tooltip" hidden></div>`;
  }

  function renderNeeds() {
    const total = Math.round(snapshot.needs.reduce((sum, need) => sum + need.value, 0) / snapshot.needs.length);
    const circumference = 2 * Math.PI * 78;
    const segment = circumference / snapshot.needs.length;
    const arcs = snapshot.needs.map((need, index) => {
      const length = (segment - 2) * need.value / 100;
      return `<circle cx="100" cy="100" r="78" fill="none" stroke="${need.color}" stroke-width="29" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-segment * index}"/>`;
    }).join('');
    $('#needs-chart').innerHTML = `<circle cx="100" cy="100" r="78" fill="none" stroke="#eef2f7" stroke-width="29"/>${arcs}`;
    $('#needs-chart').setAttribute('aria-label', `${total}% of core needs met. ${snapshot.needs.map((need) => `${need.label}: ${need.value}%`).join(', ')}.`);
    $('#needs-total').textContent = `${total}%`;
    $('#needs-legend').innerHTML = snapshot.needs.map((need) => `<li><span class="legend-dot" style="--segment-color: ${need.color}" aria-hidden="true"></span><span>${escapeHTML(need.label)}</span><strong>${need.value}%</strong></li>`).join('');
  }

  function renderWins() {
    $('#wins-list').innerHTML = snapshot.wins.map((win, index) => {
      const saved = savedWins.has(win.title);
      return `<tr><td>${index + 1}</td><td>${escapeHTML(win.title)}</td><td class="win-detail">${escapeHTML(win.detail)}</td><td><button class="favorite-button" type="button" data-win="${escapeHTML(win.title)}" aria-pressed="${saved}" aria-label="${saved ? 'Unsave' : 'Save'} win: ${escapeHTML(win.title)}">${icon('heart')}</button></td></tr>`;
    }).join('');
  }

  function renderActivity() {
    const filter = $('#activity-filter').value;
    const activity = snapshot.activity.filter((item) => filter === 'all' || item.category === filter);
    $('#activity-list').innerHTML = activity.length ? activity.map((item) => {
      const time = new Date(new Date(snapshot.timestamp).getTime() - item.minutesAgo * 60000);
      const label = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `<li class="activity-item" data-category="${item.category}"><time class="activity-time" datetime="${time.toISOString()}">${escapeHTML(label)}</time>${icon(item.icon, item.color)}<div class="activity-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.detail)}</p></div><span class="logged">${icon('check')}Logged</span></li>`;
    }).join('') : '<li class="activity-empty">Choose All activity to see today’s good moments.</li>';
  }

  function renderReasons() {
    $('#reasons-list').innerHTML = snapshot.reasons.map((reason) => `<li><span>${escapeHTML(reason.label)}</span><span class="reason-track" aria-hidden="true"><span class="reason-fill" style="width:${reason.value}%;--segment-color:${reason.color}"></span></span><span class="reason-value">${reason.value}%</span></li>`).join('');
  }

  function renderJournal() {
    const container = $('#journal-entries');
    container.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Save a good moment above to start your journal.';
      container.append(empty);
    }
    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'journal-entry';
      const date = document.createElement('time');
      date.dateTime = entry.date;
      date.textContent = new Date(entry.date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      const text = document.createElement('p');
      text.textContent = entry.text;
      article.append(date, text);
      container.append(article);
    });
    $('#journal-count').textContent = entries.length;
    $('#journal-count').hidden = !entries.length;
  }

  function renderDashboard() {
    renderMetrics();
    renderMoments();
    renderNeeds();
    renderWins();
    renderActivity();
    renderReasons();
    $('#perspective-quote').textContent = snapshot.quote.text;
    const date = new Date(snapshot.timestamp);
    $('#current-date').dateTime = date.toISOString();
    $('#current-date').textContent = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    $('#updated').textContent = `Updated at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
    document.querySelectorAll('[data-period]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.period === snapshot.period)));
    writeStorage('sessionStorage', STORAGE_KEYS.snapshot, snapshot);
  }

  $('#refresh').addEventListener('click', () => {
    snapshot = GratitudeData.createSnapshot(snapshot.period, snapshot);
    renderDashboard();
    $('#main').classList.remove('refreshed');
    requestAnimationFrame(() => $('#main').classList.add('refreshed'));
    announce('A fresh perspective. Every metric updated, and more good things to notice.');
  });

  document.querySelectorAll('[data-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const period = button.dataset.period;
      if (snapshot.period === period) return;
      snapshot = { ...snapshot, period, moments: GratitudeData.createSnapshot(period).moments };
      renderMoments();
      document.querySelectorAll('[data-period]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      writeStorage('sessionStorage', STORAGE_KEYS.snapshot, snapshot);
      announce(`Showing good moments for ${PERIOD_NAMES[period].toLowerCase()}.`);
    });
  });

  $('#activity-filter').addEventListener('change', () => {
    renderActivity();
    announce(`Showing ${$('#activity-filter').selectedOptions[0].textContent.toLowerCase()}.`);
  });

  $('#wins-list').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-win]');
    if (!button) return;
    const title = button.dataset.win;
    if (savedWins.has(title)) savedWins.delete(title);
    else savedWins.add(title);
    const persisted = writeStorage('localStorage', STORAGE_KEYS.wins, [...savedWins]);
    const saved = savedWins.has(title);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Unsave' : 'Save'} win: ${title}`);
    announce(saved ? `${title}. Saved${persisted ? '' : ' for this visit'}.` : `${title}. Removed from saved wins.`);
  });

  const dialog = $('#journal-dialog');
  $('#open-journal').addEventListener('click', () => { renderJournal(); dialog.showModal(); });
  $('#close-journal').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  $('#journal-entry').addEventListener('input', () => { $('#journal-entry').setCustomValidity(''); $('#journal-feedback').textContent = ''; });
  $('#journal-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('#journal-entry').value.trim();
    if (!text) {
      $('#journal-entry').setCustomValidity('Add a moment you want to remember.');
      $('#journal-entry').reportValidity();
      return;
    }
    entries.unshift({ text, date: new Date().toISOString() });
    entries.splice(60);
    const persisted = writeStorage('localStorage', STORAGE_KEYS.journal, entries);
    $('#journal-entry').value = '';
    $('#journal-feedback').textContent = persisted ? 'A good moment, saved.' : 'Saved for this visit.';
    renderJournal();
    $('#journal-entry').focus();
  });

  function showTooltip(event) {
    const point = event.target.closest('.chart-point');
    if (!point) return;
    const index = Number(point.dataset.index);
    const tooltip = $('#moments-chart .chart-tooltip');
    tooltip.textContent = `${snapshot.moments.labels[index]} · ${snapshot.moments.values[index]} good moments`;
    tooltip.hidden = false;
    const halfWidth = tooltip.offsetWidth / 2;
    tooltip.style.left = `${Math.max(halfWidth, Math.min($('#moments-chart').clientWidth - halfWidth, Number(point.dataset.x)))}px`;
    tooltip.style.top = `${Number(point.dataset.y) - 13}px`;
  }
  $('#moments-chart').addEventListener('pointerover', showTooltip);
  $('#moments-chart').addEventListener('focusin', showTooltip);
  ['pointerleave', 'focusout'].forEach((eventName) => $('#moments-chart').addEventListener(eventName, () => { $('#moments-chart .chart-tooltip').hidden = true; }));

  const navLinks = document.querySelectorAll('a.nav-link');
  function activateNavigation(id) {
    navLinks.forEach((link) => {
      const active = link.hash === `#${id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  navLinks.forEach((link) => link.addEventListener('click', () => activateNavigation(link.hash.slice(1))));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((records) => {
      const visible = records.find((record) => record.isIntersecting);
      if (visible) activateNavigation(visible.target.id);
    }, { rootMargin: '-5% 0px -70% 0px', threshold: 0 });
    ['overview', 'trends', 'needs', 'wins', 'activity'].forEach((id) => observer.observe(document.getElementById(id)));
  }

  renderDashboard();
  renderJournal();
  let lastChartWidth = $('#moments-chart').clientWidth;
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const nextWidth = $('#moments-chart').clientWidth;
      if (nextWidth !== lastChartWidth) {
        lastChartWidth = nextWidth;
        renderMoments();
      }
    }).observe($('#moments-chart'));
  } else {
    window.addEventListener('resize', renderMoments);
  }
})();
