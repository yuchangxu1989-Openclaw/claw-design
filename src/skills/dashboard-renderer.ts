import type { ThemePack } from '../types.js';
import type { DashboardConfig, DashboardRow, DashboardTheme, DashboardWidget } from './dashboard-types.js';

interface DashPalette {
  bg: string; surface: string; border: string; text: string;
  muted: string; accent: string; success: string; warning: string;
  shadow: string;
}

/** Professional multi-color palette for chart series */
const CHART_PALETTE = [
  '#4f6df5', '#22c997', '#f5a623', '#e8556d', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

function getSeriesColor(index: number, fallback?: string): string {
  return fallback || CHART_PALETTE[index % CHART_PALETTE.length];
}

export function renderDashboardHtml(config: DashboardConfig, theme: ThemePack): string {
  const palette = resolvePalette(config.theme, theme);
  const cssVars = buildCssVariables(theme);
  const rowsHtml = config.rows.map(row => renderRow(row, palette)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${config.theme}" data-layout="${config.layout}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(config.title)} — Dashboard</title>
  <style>
    :root {
      ${cssVars}
      --dash-bg: ${palette.bg};
      --dash-surface: ${palette.surface};
      --dash-border: ${palette.border};
      --dash-text: ${palette.text};
      --dash-muted: ${palette.muted};
      --dash-accent: ${palette.accent};
      --dash-success: ${palette.success};
      --dash-warning: ${palette.warning};
      --dash-shadow: ${palette.shadow};
      --dash-radius: 14px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; padding: 28px;
      background: var(--dash-bg);
      font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
      color: var(--dash-text);
    }
    .dash-shell { max-width: 1320px; margin: 0 auto; }
    .dash-header { margin-bottom: 24px; }
    .dash-header__title { margin: 0 0 6px; font-size: 1.5rem; font-family: var(--cd-font-heading, 'Inter', sans-serif); }
    .dash-header__summary { margin: 0; color: var(--dash-muted); font-size: 0.92rem; }
    .dash-header__meta { display: flex; gap: 8px; margin-top: 10px; }
    .dash-badge {
      padding: 4px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
      background: var(--dash-accent); color: var(--dash-surface); text-transform: uppercase;
    }
    .dash-row {
      display: grid; gap: 16px; margin-bottom: 16px;
    }
    .dash-widget {
      background: var(--dash-surface);
      border: 1px solid var(--dash-border);
      border-radius: var(--dash-radius);
      padding: 20px;
      box-shadow: 0 4px 16px var(--dash-shadow);
    }
    .dash-widget__title {
      margin: 0 0 8px; font-size: 0.82rem; font-weight: 600;
      color: var(--dash-muted); text-transform: uppercase; letter-spacing: 0.04em;
    }
    .dash-widget__value {
      font-size: 2rem; font-weight: 800; color: var(--dash-accent); line-height: 1.1;
    }
    .dash-widget__subtitle { font-size: 0.8rem; color: var(--dash-muted); margin-top: 4px; }
    .dash-widget--trend, .dash-widget--bar, .dash-widget--pie {
      min-height: 120px; display: flex; flex-direction: column;
    }
    .dash-svg-trend, .dash-svg-bar { width: 100%; height: 110px; display: block; margin-top: 8px; }
    .dash-svg-pie { width: 160px; height: 160px; display: block; margin: 8px auto 0; }
    .dash-pie-legend { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 12px; font-size: 0.78rem; color: var(--dash-muted); }
    .dash-pie-dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; vertical-align: middle; }
    @media (max-width: 768px) {
      .dash-row { grid-template-columns: 1fr !important; }
      .dash-widget { padding: 16px; }
      .dash-widget__value { font-size: 1.6rem; }
    }
    .dash-widget--table table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
    .dash-widget--table th, .dash-widget--table td {
      padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--dash-border);
    }
    .dash-widget--table th { color: var(--dash-muted); font-weight: 600; }
    .dash-widget--status .status-item {
      display: flex; justify-content: space-between; padding: 6px 0;
      border-bottom: 1px solid var(--dash-border); font-size: 0.85rem;
    }
    .dash-widget--status .status-item:last-child { border-bottom: none; }
    .dash-widget--progress .progress-bar {
      height: 8px; border-radius: 4px; background: var(--dash-border); overflow: hidden; margin-top: 8px;
    }
    .dash-widget--progress .progress-fill {
      height: 100%; border-radius: 4px; background: var(--dash-accent);
    }
    .dash-widget--filter {
      display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
    }
    .dash-filter-chip {
      padding: 6px 14px; border-radius: 999px; font-size: 0.78rem;
      border: 1px solid var(--dash-border); background: var(--dash-surface); color: var(--dash-muted);
    }
    .dash-widget--kpi { display: flex; flex-direction: column; }
    .dash-kpi-trend { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 0.82rem; font-weight: 600; }
    .dash-kpi-trend--up { color: var(--dash-success); }
    .dash-kpi-trend--down { color: var(--dash-warning); }
    .dash-kpi-trend--flat { color: var(--dash-muted); }
    .dash-widget--time-range { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .dash-time-chip {
      padding: 6px 14px; border-radius: 999px; font-size: 0.78rem; cursor: pointer;
      border: 1px solid var(--dash-border); background: var(--dash-surface); color: var(--dash-muted);
    }
    .dash-time-chip--active { background: var(--dash-accent); color: var(--dash-surface); border-color: var(--dash-accent); }
    .dash-svg-sparkline { width: 100%; height: 40px; display: block; margin-top: 8px; }
    .dash-widget--sparkline { display: flex; flex-direction: column; }
  </style>
</head>
<body>
  <main class="dash-shell">
    <header class="dash-header">
      <h1 class="dash-header__title">${esc(config.title)}</h1>
      <p class="dash-header__summary">${esc(config.summary)}</p>

    </header>
${rowsHtml}
  </main>
</body>
</html>`;
}

function renderRow(row: DashboardRow, _palette: DashPalette): string {
  const widgetsHtml = row.widgets.map(w => renderWidget(w)).join('\n');
  return `    <div class="dash-row" style="grid-template-columns: repeat(${row.columns}, 1fr);" data-row="${row.id}">
${widgetsHtml}
    </div>`;
}

function renderWidget(w: DashboardWidget): string {
  const spanStyle = w.span && w.span > 1 ? ` style="grid-column: span ${w.span}"` : '';
  const title = `<h3 class="dash-widget__title">${esc(w.title)}</h3>`;

  switch (w.type) {
    case 'metric-card':
      return `      <div class="dash-widget" data-widget="${w.id}"${spanStyle}>
        ${title}
        <div class="dash-widget__value">${esc(w.value ?? '--')}</div>
        ${w.subtitle ? `<div class="dash-widget__subtitle">${esc(w.subtitle)}</div>` : ''}
      </div>`;
    case 'trend-chart':
      return renderTrendChart(w, title, spanStyle);
    case 'bar-chart':
      return renderBarChart(w, title, spanStyle);
    case 'pie-chart':
      return renderPieChart(w, title, spanStyle);
    case 'table':
      return `      <div class="dash-widget dash-widget--table" data-widget="${w.id}"${spanStyle}>
        ${title}
        <table><thead><tr><th>指标</th><th>数值</th></tr></thead>
        <tbody>${(w.items ?? []).map(i => `<tr><td>${esc(i.label)}</td><td>${esc(i.value)}</td></tr>`).join('')}</tbody></table>
      </div>`;
    case 'status-list':
      return `      <div class="dash-widget dash-widget--status" data-widget="${w.id}"${spanStyle}>
        ${title}
        ${(w.items ?? []).map(i => `<div class="status-item"><span>${esc(i.label)}</span><span>${esc(i.status ?? i.value)}</span></div>`).join('\n        ')}
      </div>`;
    case 'progress':
      return `      <div class="dash-widget dash-widget--progress" data-widget="${w.id}"${spanStyle}>
        ${title}
        <div class="dash-widget__value">${esc(w.value ?? '0%')}</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${esc(w.value ?? '0%')}"></div></div>
      </div>`;
    case 'filter-bar':
      return `      <div class="dash-widget dash-widget--filter" data-widget="${w.id}"${spanStyle}>
        ${(w.items ?? []).map(i => `<span class="dash-filter-chip">${esc(i.label)}</span>`).join('\n        ')}
      </div>`;
    case 'area-chart':
      return renderAreaChart(w, title, spanStyle);
    case 'multi-line-chart':
      return renderMultiLineChart(w, title, spanStyle);
    case 'kpi-card': {
      const arrow = w.trend === 'up' ? '↑' : w.trend === 'down' ? '↓' : '→';
      return `      <div class="dash-widget dash-widget--kpi" data-widget="${w.id}"${spanStyle}>
        ${title}
        <div class="dash-widget__value">${esc(w.value ?? '--')}</div>
        ${w.subtitle ? `<div class="dash-widget__subtitle">${esc(w.subtitle)}</div>` : ''}
        <div class="dash-kpi-trend dash-kpi-trend--${w.trend ?? 'flat'}">${arrow} ${esc(w.trendValue ?? '')}</div>
      </div>`;
    }
    case 'time-range-selector': {
      const ranges = w.items ?? [{ label: '7D', value: '7d' }, { label: '30D', value: '30d' }, { label: '90D', value: '90d' }];
      return `      <div class="dash-widget dash-widget--time-range" data-widget="${w.id}"${spanStyle}>
        ${ranges.map((r, i) => `<span class="dash-time-chip${i === 0 ? ' dash-time-chip--active' : ''}">${esc(r.label)}</span>`).join('\n        ')}
      </div>`;
    }
    case 'sparkline-card':
      return renderSparklineCard(w, title, spanStyle);
    default:
      return `      <div class="dash-widget" data-widget="${w.id}"${spanStyle}>${title}<p>${esc(w.value ?? '')}</p></div>`;
  }
}

function renderTrendChart(w: DashboardWidget, title: string, spanStyle: string): string {
  const series = w.series ?? [{ name: 'default', data: [72, 58, 65, 42, 48, 30, 35, 18, 25, 12, 20] }];
  const svgW = 320;
  const svgH = 100;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = w.xLabels ? 18 : 4;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  let gridLines = '';
  if (w.showGrid !== false) {
    for (let i = 0; i <= 3; i++) {
      const gy = padT + (chartH * i) / 3;
      const label = Math.round(maxVal - (range * i) / 3);
      gridLines += `<line x1="${padL}" y1="${gy}" x2="${svgW - padR}" y2="${gy}" stroke="var(--dash-border)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
      gridLines += `<text x="${padL - 4}" y="${gy + 3}" text-anchor="end" fill="var(--dash-muted)" font-size="8">${label}</text>`;
    }
  }

  let xLabelsSvg = '';
  if (w.xLabels) {
    const step = chartW / Math.max(w.xLabels.length - 1, 1);
    xLabelsSvg = w.xLabels.map((l, i) =>
      `<text x="${padL + i * step}" y="${svgH - 2}" text-anchor="middle" fill="var(--dash-muted)" font-size="8">${esc(l)}</text>`
    ).join('');
  }

  const seriesSvg = series.map((s, si) => {
    const color = getSeriesColor(si, s.color);
    const pts = s.data.map((v, i) => {
      const x = padL + (chartW * i) / Math.max(s.data.length - 1, 1);
      const y = padT + chartH - ((v - minVal) / range) * chartH;
      return `${x},${y}`;
    });
    const polyline = `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    const area = si === 0
      ? `<defs><linearGradient id="tg-${w.id}-${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.2"/><stop offset="100%" stop-color="${color}" stop-opacity="0.02"/></linearGradient></defs><path d="M${pts[0]} ${pts.join(' ')} ${padL + chartW},${padT + chartH} ${padL},${padT + chartH}Z" fill="url(#tg-${w.id}-${si})"/>`
      : '';
    const lastPt = pts[pts.length - 1].split(',');
    const dot = `<circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="3" fill="${color}"/>`;
    let labels = '';
    if (w.showDataLabels) {
      labels = s.data.map((v, i) => {
        const x = padL + (chartW * i) / Math.max(s.data.length - 1, 1);
        const y = padT + chartH - ((v - minVal) / range) * chartH;
        return `<text x="${x}" y="${y - 6}" text-anchor="middle" fill="${color}" font-size="7" font-weight="600">${v}</text>`;
      }).join('');
    }
    return `${area}${polyline}${dot}${labels}`;
  }).join('');

  return `      <div class="dash-widget dash-widget--trend" data-widget="${w.id}"${spanStyle}>
        ${title}
        <svg viewBox="0 0 ${svgW} ${svgH}" class="dash-svg-trend" preserveAspectRatio="none">
          ${gridLines}${xLabelsSvg}${seriesSvg}
        </svg>
      </div>`;
}

function renderBarChart(w: DashboardWidget, title: string, spanStyle: string): string {
  const series = w.series ?? [{ name: 'default', data: [40, 65, 80, 55, 73, 87, 60] }];
  const labels = w.xLabels ?? series[0].data.map((_, i) => `${i + 1}`);
  const svgW = 320;
  const svgH = 110;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals, 1);
  const nGroups = labels.length;
  const nSeries = series.length;
  const groupW = chartW / nGroups;
  const barGap = 2;
  const groupPad = Math.max(groupW * 0.15, 4);
  const barW = Math.max((groupW - groupPad * 2 - barGap * (nSeries - 1)) / nSeries, 4);

  let gridLines = '';
  if (w.showGrid !== false) {
    for (let i = 0; i <= 4; i++) {
      const gy = padT + (chartH * i) / 4;
      const label = Math.round(maxVal - (maxVal * i) / 4);
      gridLines += `<line x1="${padL}" y1="${gy}" x2="${svgW - padR}" y2="${gy}" stroke="var(--dash-border)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
      gridLines += `<text x="${padL - 4}" y="${gy + 3}" text-anchor="end" fill="var(--dash-muted)" font-size="8">${label}</text>`;
    }
  }

  const barsSvg = series.map((s, si) => {
    const color = getSeriesColor(si, s.color);
    return s.data.map((v, gi) => {
      if (gi >= nGroups) return '';
      const barH = (v / maxVal) * chartH;
      const x = padL + gi * groupW + groupPad + si * (barW + barGap);
      const y = padT + chartH - barH;
      let label = '';
      if (w.showDataLabels) {
        label = `<text x="${x + barW / 2}" y="${y - 3}" text-anchor="middle" fill="${color}" font-size="7" font-weight="600">${v}</text>`;
      }
      return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${color}"/>${label}`;
    }).join('');
  }).join('');

  const xLabelsSvg = labels.map((l, i) => {
    const x = padL + i * groupW + groupW / 2;
    const truncated = l.length > 6 ? l.slice(0, 5) + '…' : l;
    return `<text x="${x}" y="${svgH - 4}" text-anchor="middle" fill="var(--dash-muted)" font-size="9">${esc(truncated)}</text>`;
  }).join('');

  const baseline = `<line x1="${padL}" y1="${padT + chartH}" x2="${svgW - padR}" y2="${padT + chartH}" stroke="var(--dash-border)" stroke-width="1"/>`;

  return `      <div class="dash-widget dash-widget--bar" data-widget="${w.id}"${spanStyle}>
        ${title}
        <svg viewBox="0 0 ${svgW} ${svgH}" class="dash-svg-bar">
          ${gridLines}${baseline}${barsSvg}${xLabelsSvg}
        </svg>
      </div>`;
}

function renderPieChart(w: DashboardWidget, title: string, spanStyle: string): string {
  const series = w.series ?? [{ name: 'default', data: [50, 25, 15, 10] }];
  const data = series[0].data;
  const pieLabels = w.xLabels ?? data.map((_, i) => series.length > 1 ? series[i]?.name ?? `S${i + 1}` : `S${i + 1}`);
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const cx = 80;
  const cy = 80;
  const r = 56;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map((v, i) => {
    const pct = v / total;
    const dashLen = pct * circumference;
    const color = getSeriesColor(i, series[i]?.color);
    const slice = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="22" stroke-dasharray="${dashLen} ${circumference - dashLen}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dashLen;
    return slice;
  }).join('\n          ');

  const legendItems = data.map((v, i) => {
    const color = getSeriesColor(i, series[i]?.color);
    const pct = Math.round((v / total) * 100);
    const label = i < pieLabels.length ? pieLabels[i] : `S${i + 1}`;
    return `<span><span class="dash-pie-dot" style="background:${color}"></span>${esc(label)} ${pct}%</span>`;
  }).join('\n          ');

  return `      <div class="dash-widget dash-widget--pie" data-widget="${w.id}"${spanStyle}>
        ${title}
        <svg viewBox="0 0 160 160" class="dash-svg-pie">
          ${slices}
        </svg>
        <div class="dash-pie-legend">
          ${legendItems}
        </div>
      </div>`;
}

function renderAreaChart(w: DashboardWidget, title: string, spanStyle: string): string {
  const series = w.series ?? [{ name: 'default', data: [30, 50, 40, 70, 55, 80, 65] }];
  const svgW = 320;
  const svgH = 100;
  const padL = 32; const padR = 8; const padT = 8;
  const padB = w.xLabels ? 18 : 4;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const seriesSvg = series.map((s, si) => {
    const color = getSeriesColor(si, s.color);
    const pts = s.data.map((v, i) => {
      const x = padL + (chartW * i) / Math.max(s.data.length - 1, 1);
      const y = padT + chartH - ((v - minVal) / range) * chartH;
      return `${x},${y}`;
    });
    const area = `<path d="M${pts[0]} ${pts.join(' ')} ${padL + chartW},${padT + chartH} ${padL},${padT + chartH}Z" fill="${color}" fill-opacity="0.18"/>`;
    const line = `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
    return `${area}${line}`;
  }).join('');

  let xLabelsSvg = '';
  if (w.xLabels) {
    const step = chartW / Math.max(w.xLabels.length - 1, 1);
    xLabelsSvg = w.xLabels.map((l, i) =>
      `<text x="${padL + i * step}" y="${svgH - 2}" text-anchor="middle" fill="var(--dash-muted)" font-size="8">${esc(l)}</text>`
    ).join('');
  }

  return `      <div class="dash-widget dash-widget--trend" data-widget="${w.id}"${spanStyle}>
        ${title}
        <svg viewBox="0 0 ${svgW} ${svgH}" class="dash-svg-trend" preserveAspectRatio="none">
          ${seriesSvg}${xLabelsSvg}
        </svg>
      </div>`;
}

function renderMultiLineChart(w: DashboardWidget, title: string, spanStyle: string): string {
  const series = w.series ?? [
    { name: 'A', data: [20, 40, 35, 50, 45, 60] },
    { name: 'B', data: [10, 25, 30, 35, 50, 40] },
  ];
  const svgW = 320;
  const svgH = 100;
  const padL = 32; const padR = 8; const padT = 8;
  const padB = w.xLabels ? 18 : 4;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const linesSvg = series.map((s, si) => {
    const color = getSeriesColor(si, s.color);
    const pts = s.data.map((v, i) => {
      const x = padL + (chartW * i) / Math.max(s.data.length - 1, 1);
      const y = padT + chartH - ((v - minVal) / range) * chartH;
      return `${x},${y}`;
    });
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');

  const legendHtml = series.map((s, si) => {
    const color = getSeriesColor(si, s.color);
    return `<span><span class="dash-pie-dot" style="background:${color}"></span>${esc(s.name)}</span>`;
  }).join(' ');

  let xLabelsSvg = '';
  if (w.xLabels) {
    const step = chartW / Math.max(w.xLabels.length - 1, 1);
    xLabelsSvg = w.xLabels.map((l, i) =>
      `<text x="${padL + i * step}" y="${svgH - 2}" text-anchor="middle" fill="var(--dash-muted)" font-size="8">${esc(l)}</text>`
    ).join('');
  }

  return `      <div class="dash-widget dash-widget--trend" data-widget="${w.id}"${spanStyle}>
        ${title}
        <svg viewBox="0 0 ${svgW} ${svgH}" class="dash-svg-trend" preserveAspectRatio="none">
          ${linesSvg}${xLabelsSvg}
        </svg>
        <div class="dash-pie-legend">${legendHtml}</div>
      </div>`;
}

function renderSparklineCard(w: DashboardWidget, title: string, spanStyle: string): string {
  const data = w.sparkline ?? w.series?.[0]?.data ?? [10, 15, 8, 20, 14, 22, 18];
  const svgW = 120; const svgH = 32;
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  const pts = data.map((v, i) => {
    const x = (svgW * i) / Math.max(data.length - 1, 1);
    const y = svgH - ((v - minVal) / range) * svgH;
    return `${x},${y}`;
  });
  const color = 'var(--dash-accent)';

  return `      <div class="dash-widget dash-widget--sparkline" data-widget="${w.id}"${spanStyle}>
        ${title}
        <div class="dash-widget__value">${esc(w.value ?? '--')}</div>
        ${w.subtitle ? `<div class="dash-widget__subtitle">${esc(w.subtitle)}</div>` : ''}
        <svg viewBox="0 0 ${svgW} ${svgH}" class="dash-svg-sparkline" preserveAspectRatio="none">
          <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>`;
}

function resolvePalette(themeMode: DashboardTheme, theme: ThemePack): DashPalette {
  const light: DashPalette = {
    bg: '#f4f6f9', surface: '#ffffff', border: '#e3e6ec', text: '#111827',
    muted: '#6b7280', accent: '#4f46e5', success: '#10b981', warning: '#f59e0b',
    shadow: 'rgba(0,0,0,0.05)',
  };
  const dark: DashPalette = {
    bg: '#0b0f1a', surface: '#141926', border: '#252d3f', text: '#f1f3f8',
    muted: '#8892a8', accent: '#818cf8', success: '#34d399', warning: '#fbbf24',
    shadow: 'rgba(0,0,0,0.25)',
  };
  const base = themeMode === 'dark' ? dark : light;
  if (theme.colorPrimary) base.accent = theme.colorPrimary;
  return base;
}

function buildCssVariables(theme: ThemePack): string {
  return Object.entries(theme.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n      ');
}

function getLayoutLabel(layout: string): string {
  const labels: Record<string, string> = {
    'executive': '高管视图',
    'operational': '运营视图',
    'grid-2x2': '网格视图',
    'sidebar-main': '侧边栏',
    'fullscreen': '全屏视图',
  };
  return labels[layout] || layout;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
