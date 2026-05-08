import type { ThemePack } from '../types.js';
import { escapeHtml } from '../utils.js';
import type { MockupComponent, MockupConfig, MockupFidelity, MockupPage, MockupSection, MockupTheme } from './ui-mockup-types.js';

interface MockupPalette {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  shadow: string;
  placeholder: string;
}

export function renderMockupHtml(config: MockupConfig, theme: ThemePack): string {
  const palette = resolvePalette(config.theme, theme);
  const viewportWidth = config.viewport === 'mobile' ? '375px' : '1280px';
  const pagesHtml = config.pages.map(page => renderPage(page, config.fidelity, palette)).join('\n');
  const cssVars = buildCssVariables(theme);

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${config.theme}" data-viewport="${config.viewport}" data-fidelity="${config.fidelity}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)} — UI Mockup</title>
  <style>
    :root {
      ${cssVars}
      --mockup-bg: ${palette.bg};
      --mockup-surface: ${palette.surface};
      --mockup-border: ${palette.border};
      --mockup-text: ${palette.text};
      --mockup-muted: ${palette.muted};
      --mockup-accent: ${palette.accent};
      --mockup-shadow: ${palette.shadow};
      --mockup-placeholder: ${palette.placeholder};
      --mockup-viewport: ${viewportWidth};
      --mockup-radius: ${config.fidelity === 'high' ? '12px' : '4px'};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; padding: 32px;
      background: ${config.fidelity === 'low' ? '#f5f5f5' : 'var(--mockup-bg)'};
      font-family: ${config.fidelity === 'low' ? "'Courier New', monospace" : "var(--cd-font-body, 'Noto Sans SC', sans-serif)"};
      color: var(--mockup-text);
      display: flex; flex-direction: column; align-items: center; gap: 32px;
    }
    .mockup-header {
      width: min(100%, var(--mockup-viewport));
      text-align: center;
    }
    .mockup-header__title {
      margin: 0 0 8px;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 1.6rem;
    }
    .mockup-header__summary {
      margin: 0 0 12px; color: var(--mockup-muted); font-size: 0.95rem;
    }
    .mockup-page {
      width: min(100%, var(--mockup-viewport));
      border: 2px solid var(--mockup-border);
      border-radius: var(--mockup-radius);
      background: var(--mockup-surface);
      box-shadow: 0 8px 32px var(--mockup-shadow);
      overflow: hidden;
    }
    .mockup-page__title {
      margin: 0; padding: 16px 20px;
      font-size: 1.1rem; font-weight: 700;
      border-bottom: 1px solid var(--mockup-border);
    }
    .mockup-section { padding: 16px 20px; }
    .mockup-section + .mockup-section { border-top: 1px solid var(--mockup-border); }
    .mockup-section__title {
      margin: 0 0 12px; font-size: 0.85rem; font-weight: 600;
      color: var(--mockup-muted); text-transform: uppercase;
    }
    .mockup-layout-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .mockup-layout-column { display: flex; flex-direction: column; gap: 12px; }
    .mockup-layout-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .mockup-comp {
      border: 1px solid var(--mockup-border);
      border-radius: var(--mockup-radius);
      padding: 12px; position: relative;
      background: var(--mockup-surface);
    }
    .mockup-comp--navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; width: 100%;
    }
    .mockup-comp--card { min-width: 180px; flex: 1; }
    .mockup-comp--button {
      display: inline-flex; padding: 8px 20px; border-radius: var(--mockup-radius);
      background: var(--mockup-accent); color: #fff; font-weight: 600; font-size: 0.85rem;
    }
    .mockup-comp--input {
      padding: 8px 12px; width: 100%;
      border: 1px solid var(--mockup-border); border-radius: var(--mockup-radius);
      background: var(--mockup-bg); color: var(--mockup-text);
    }
    .mockup-comp--placeholder {
      min-height: 80px; display: grid; place-items: center;
      background: repeating-linear-gradient(45deg, var(--mockup-placeholder), var(--mockup-placeholder) 8px, transparent 8px, transparent 16px);
      color: var(--mockup-muted); font-size: 0.8rem;
    }
    .mockup-comp--stat { text-align: center; padding: 16px; }
    .mockup-comp--stat .stat-value { font-size: 1.8rem; font-weight: 800; color: var(--mockup-accent); }
    .mockup-comp--stat .stat-label { font-size: 0.78rem; color: var(--mockup-muted); }
    .mockup-comp--table { width: 100%; overflow-x: auto; }
    .mockup-comp--table table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .mockup-comp--table th, .mockup-comp--table td {
      padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--mockup-border);
    }
    .mockup-comp__label {
      font-size: 0.72rem; color: var(--mockup-muted);
      position: absolute; top: 4px; right: 8px; opacity: 0.6;
    }
    .mockup-comp__state {
      display: inline-flex; padding: 2px 8px; border-radius: 999px;
      background: color-mix(in srgb, var(--mockup-accent) 20%, transparent 80%);
      color: var(--mockup-accent); font-size: 0.68rem; font-weight: 600;
    }
    .mockup-comp__text { margin: 4px 0 0; font-size: 0.88rem; }
    /* ── New component styles ── */
    .mockup-comp--button-secondary {
      background: transparent; color: var(--mockup-accent);
      border: 1.5px solid var(--mockup-accent);
    }
    .mockup-comp--button-link {
      background: transparent; color: var(--mockup-accent);
      padding: 4px 8px; font-size: 0.82rem; text-decoration: underline;
    }
    .mockup-comp--avatar {
      display: flex; align-items: center; gap: 12px; border: none; background: transparent;
    }
    .avatar-circle {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, var(--mockup-accent), color-mix(in srgb, var(--mockup-accent) 60%, #fff));
    }
    .avatar-label { font-weight: 600; }
    .mockup-comp--toggle {
      display: flex; align-items: center; justify-content: space-between;
      border: none; background: transparent; padding: 8px 0;
    }
    .toggle-label { font-size: 0.9rem; }
    .toggle-track {
      width: 44px; height: 24px; border-radius: 12px;
      background: var(--mockup-border); position: relative; display: inline-block;
    }
    .toggle-thumb {
      width: 20px; height: 20px; border-radius: 50%; background: #fff;
      position: absolute; top: 2px; left: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .mockup-comp--search {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-radius: 999px;
      background: var(--mockup-bg); border: 1px solid var(--mockup-border);
    }
    .search-icon { font-size: 1rem; opacity: 0.5; }
    .search-text { color: var(--mockup-muted); font-size: 0.88rem; }
    .mockup-comp--image {
      min-height: 160px; display: grid; place-items: center;
      background: linear-gradient(135deg, var(--mockup-placeholder), color-mix(in srgb, var(--mockup-accent) 8%, var(--mockup-placeholder)));
      border-radius: var(--mockup-radius); overflow: hidden;
    }
    .image-placeholder { font-size: 0.85rem; color: var(--mockup-muted); }
    .mockup-comp--divider {
      display: flex; align-items: center; gap: 12px;
      border: none; background: transparent; padding: 8px 0;
    }
    .divider-line { flex: 1; height: 1px; background: var(--mockup-border); }
    .divider-text { font-size: 0.78rem; color: var(--mockup-muted); }
    .mockup-comp--breadcrumb {
      border: none; background: transparent; padding: 4px 0;
      font-size: 0.82rem; color: var(--mockup-muted);
    }
    .mockup-comp--tag {
      display: flex; flex-wrap: wrap; gap: 6px;
      border: none; background: transparent; padding: 4px 0;
    }
    .tag-item {
      display: inline-flex; padding: 3px 10px; border-radius: 999px;
      background: color-mix(in srgb, var(--mockup-accent) 12%, transparent);
      color: var(--mockup-accent); font-size: 0.75rem; font-weight: 600;
    }
    .mockup-comp--rating {
      display: flex; align-items: center; gap: 6px;
      border: none; background: transparent; padding: 4px 0;
    }
    .rating-stars { color: #f59e0b; font-size: 0.9rem; letter-spacing: 2px; }
    .rating-text { font-size: 0.82rem; color: var(--mockup-muted); }
    .mockup-comp--price {
      border: none; background: transparent; padding: 4px 0;
    }
    .price-current { font-size: 1.5rem; font-weight: 800; color: #ef4444; }
    /* ── Hi-Fi enhancements ── */
    [data-fidelity="high"] .mockup-comp {
      box-shadow: 0 1px 3px var(--mockup-shadow);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    [data-fidelity="high"] .mockup-comp--card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--mockup-shadow);
    }
    [data-fidelity="high"] .mockup-comp--button {
      box-shadow: 0 2px 8px color-mix(in srgb, var(--mockup-accent) 30%, transparent);
    }
    [data-fidelity="high"] .mockup-comp--stat {
      background: linear-gradient(135deg, var(--mockup-surface), color-mix(in srgb, var(--mockup-accent) 4%, var(--mockup-surface)));
    }
    /* ── Responsive: mobile viewport adjustments ── */
    [data-viewport="mobile"] .mockup-layout-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
    [data-viewport="mobile"] .mockup-layout-row {
      flex-direction: column;
    }
    [data-viewport="mobile"] .mockup-comp--navbar {
      padding: 10px 16px; font-size: 0.9rem;
    }
    [data-viewport="mobile"] .mockup-comp--stat .stat-value {
      font-size: 1.4rem;
    }
    @media (max-width: 480px) {
      .mockup-layout-grid { grid-template-columns: 1fr !important; }
      .mockup-layout-row { flex-direction: column; }
    }
  </style>
</head>
<body>
  <header class="mockup-header">
    <h1 class="mockup-header__title">${escapeHtml(config.title)}</h1>
    <p class="mockup-header__summary">${escapeHtml(config.summary)}</p>

  </header>
${pagesHtml}
</body>
</html>`;
}

function renderPage(page: MockupPage, fidelity: MockupFidelity, _palette: MockupPalette): string {
  const sectionsHtml = page.sections.map(s => renderSection(s, fidelity)).join('\n');
  return `  <article class="mockup-page" data-viewport="${page.viewport}">
    <h2 class="mockup-page__title">${escapeHtml(page.title)}</h2>
${sectionsHtml}
  </article>`;
}

function renderSection(section: MockupSection, fidelity: MockupFidelity): string {
  const titleHtml = section.title
    ? `<h3 class="mockup-section__title">${escapeHtml(section.title)}</h3>` : '';
  const compsHtml = section.components.map(c => renderComponent(c, fidelity)).join('\n');
  return `    <section class="mockup-section" data-section="${section.id}">
      ${titleHtml}
      <div class="mockup-layout-${section.layout}">
${compsHtml}
      </div>
    </section>`;
}

function renderComponent(comp: MockupComponent, fidelity: MockupFidelity): string {
  const label = '';
  const stateHtml = comp.state
    ? `<span class="mockup-comp__state">${escapeHtml(comp.state)}</span>` : '';

  switch (comp.type) {
    case 'navbar':
      return `        <div class="mockup-comp mockup-comp--navbar" data-comp="${comp.id}">
          ${label}<span>${escapeHtml(comp.label)}</span>${stateHtml}
        </div>`;
    case 'button': {
      const btnClass = comp.state === 'secondary' ? 'mockup-comp--button mockup-comp--button-secondary'
        : comp.state === 'link' ? 'mockup-comp--button mockup-comp--button-link'
        : 'mockup-comp--button';
      return `        <div class="mockup-comp ${btnClass}" data-comp="${comp.id}">
          ${escapeHtml(comp.label)}${stateHtml}
        </div>`;
    }
    case 'input':
      return `        <div class="mockup-comp mockup-comp--input" data-comp="${comp.id}">
          ${label}${escapeHtml(comp.label)}${stateHtml}
        </div>`;
    case 'stat':
      return `        <div class="mockup-comp mockup-comp--stat" data-comp="${comp.id}">
          ${label}<div class="stat-value">--</div>
          <div class="stat-label">${escapeHtml(comp.label)}</div>${stateHtml}
        </div>`;
    case 'table':
      return `        <div class="mockup-comp mockup-comp--table" data-comp="${comp.id}">
          ${label}<table><thead><tr><th>Column A</th><th>Column B</th><th>Column C</th></tr></thead>
          <tbody><tr><td colspan="3" style="text-align:center;color:var(--mockup-muted)">${escapeHtml(comp.label)}</td></tr></tbody></table>${stateHtml}
        </div>`;
    case 'placeholder':
      return `        <div class="mockup-comp mockup-comp--placeholder" data-comp="${comp.id}"${comp.height ? ` style="min-height:${comp.height}"` : ''}>
          ${label}${escapeHtml(comp.label)}${stateHtml}
        </div>`;
    case 'avatar':
      return `        <div class="mockup-comp mockup-comp--avatar" data-comp="${comp.id}">
          ${label}<div class="avatar-circle"></div>
          <span class="avatar-label">${escapeHtml(comp.label)}</span>${stateHtml}
        </div>`;
    case 'toggle':
      return `        <div class="mockup-comp mockup-comp--toggle" data-comp="${comp.id}">
          ${label}<span class="toggle-label">${escapeHtml(comp.label)}</span>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>${stateHtml}
        </div>`;
    case 'search':
      return `        <div class="mockup-comp mockup-comp--search" data-comp="${comp.id}">
          ${label}<span class="search-icon">🔍</span>
          <span class="search-text">${escapeHtml(comp.label)}</span>${stateHtml}
        </div>`;
    case 'image':
      return `        <div class="mockup-comp mockup-comp--image" data-comp="${comp.id}"${comp.width ? ` style="width:${comp.width}"` : ''}>
          ${label}<div class="image-placeholder">${escapeHtml(comp.label)}</div>${stateHtml}
        </div>`;
    case 'divider':
      return `        <div class="mockup-comp mockup-comp--divider" data-comp="${comp.id}">
          <span class="divider-line"></span>
          <span class="divider-text">${escapeHtml(comp.label)}</span>
          <span class="divider-line"></span>
        </div>`;
    case 'breadcrumb':
      return `        <div class="mockup-comp mockup-comp--breadcrumb" data-comp="${comp.id}">
          ${label}${escapeHtml(comp.label)}${stateHtml}
        </div>`;
    case 'tag':
      return `        <div class="mockup-comp mockup-comp--tag" data-comp="${comp.id}">
          ${label}${comp.label.split(/[·,，]/).map(t => `<span class="tag-item">${escapeHtml(t.trim())}</span>`).join('')}${stateHtml}
        </div>`;
    case 'rating':
      return `        <div class="mockup-comp mockup-comp--rating" data-comp="${comp.id}">
          ${label}<span class="rating-stars">★★★★★</span>
          <span class="rating-text">${escapeHtml(comp.label)}</span>${stateHtml}
        </div>`;
    case 'price':
      return `        <div class="mockup-comp mockup-comp--price" data-comp="${comp.id}">
          ${label}<span class="price-current">${escapeHtml(comp.label)}</span>${stateHtml}
        </div>`;
    default: {
      const childrenHtml = comp.children
        ? comp.children.map(c => renderComponent(c, fidelity)).join('\n') : '';
      return `        <div class="mockup-comp mockup-comp--${comp.type}" data-comp="${comp.id}">
          ${label}<p class="mockup-comp__text">${escapeHtml(comp.label)}</p>${stateHtml}
${childrenHtml}
        </div>`;
    }
  }
}

function resolvePalette(themeMode: MockupTheme, theme: ThemePack): MockupPalette {
  const light: MockupPalette = {
    bg: '#f8f9fb', surface: '#ffffff', border: '#e2e5ea',
    text: '#1a1d23', muted: '#6b7280', accent: '#4f46e5',
    shadow: 'rgba(0,0,0,0.06)', placeholder: '#e5e7eb',
  };
  const dark: MockupPalette = {
    bg: '#0f1117', surface: '#1a1d28', border: '#2d3140',
    text: '#f0f1f4', muted: '#8b92a5', accent: '#818cf8',
    shadow: 'rgba(0,0,0,0.3)', placeholder: '#2d3140',
  };
  const base = themeMode === 'dark' ? dark : light;
  const overrides: Partial<MockupPalette> = {};
  if (theme.colorPrimary) overrides.accent = theme.colorPrimary;
  if (theme.colorBg) overrides.bg = theme.colorBg;
  return { ...base, ...overrides };
}

function buildCssVariables(theme: ThemePack): string {
  return Object.entries(theme.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n      ');
}

