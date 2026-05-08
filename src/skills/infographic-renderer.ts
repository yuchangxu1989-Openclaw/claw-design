import type { ThemePack } from '../types.js';
import type {
  InfographicBlock,
  InfographicConfig,
  InfographicTheme,
} from './infographic-types.js';

interface InfoPalette {
  bg: string; surface: string; border: string; text: string;
  muted: string; accent: string; accentSoft: string; shadow: string;
}

export function renderInfographicHtml(config: InfographicConfig, theme: ThemePack): string {
  const palette = resolvePalette(config.theme, theme);
  const cssVars = buildCssVariables(theme);
  const blocksHtml = config.blocks.map(b => renderBlock(b)).join('\n');
  const isHorizontal = config.orientation === 'horizontal';

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${config.theme}" data-orientation="${config.orientation}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(config.title)} — Infographic</title>
  <style>
    :root {
      ${cssVars}
      --info-bg: ${palette.bg};
      --info-surface: ${palette.surface};
      --info-border: ${palette.border};
      --info-text: ${palette.text};
      --info-muted: ${palette.muted};
      --info-accent: ${palette.accent};
      --info-accent-soft: ${palette.accentSoft};
      --info-shadow: ${palette.shadow};
      --info-radius: 16px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; padding: 32px;
      background: var(--info-bg);
      font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
      color: var(--info-text);
      display: flex; justify-content: center;
    }
    .info-shell {
      width: min(100%, ${isHorizontal ? '1400px' : '800px'});
    }
    .info-header { text-align: center; margin-bottom: 28px; }
    .info-header__title {
      margin: 0 0 8px; font-size: 1.8rem;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
    }
    .info-header__summary { margin: 0; color: var(--info-muted); font-size: 0.95rem; }
    .info-header__meta { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
    .info-badge {
      padding: 4px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
      background: var(--info-accent); color: #fff; text-transform: uppercase;
    }
    .info-flow {
      display: flex;
      flex-direction: ${isHorizontal ? 'row' : 'column'};
      gap: 20px;
      ${isHorizontal ? 'overflow-x: auto; align-items: flex-start;' : ''}
    }
    .info-block {
      background: var(--info-surface);
      border: 1px solid var(--info-border);
      border-radius: var(--info-radius);
      padding: 24px;
      box-shadow: 0 6px 24px var(--info-shadow);
      ${isHorizontal ? 'min-width: 280px; flex: 1;' : ''}
    }
    .info-block__title {
      margin: 0 0 10px; font-size: 1.05rem; font-weight: 700;
    }
    .info-block__body { margin: 0; font-size: 0.9rem; color: var(--info-muted); line-height: 1.6; }
    .info-stats { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
    .info-stat {
      text-align: center; flex: 1; min-width: 80px;
      padding: 12px; border-radius: 12px;
      background: var(--info-accent-soft);
    }
    .info-stat__value { font-size: 1.8rem; font-weight: 800; color: var(--info-accent); letter-spacing: -0.02em; }
    .info-stat__label { font-size: 0.78rem; color: var(--info-muted); margin-top: 2px; }
    .info-steps { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .info-step {
      display: flex; gap: 12px; align-items: flex-start;
    }
    .info-step__num {
      width: 32px; height: 32px; border-radius: 999px; flex-shrink: 0;
      display: grid; place-items: center;
      background: var(--info-accent); color: #fff; font-weight: 800; font-size: 0.85rem;
    }
    .info-step__content { flex: 1; }
    .info-step__title { font-weight: 600; margin: 0 0 2px; font-size: 0.92rem; }
    .info-step__desc { margin: 0; font-size: 0.82rem; color: var(--info-muted); }
    .info-comparisons { margin-top: 12px; }
    .info-cmp {
      display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center;
      padding: 8px 0; border-bottom: 1px solid var(--info-border); font-size: 0.85rem;
    }
    .info-cmp:last-child { border-bottom: none; }
    .info-cmp__vs { font-weight: 800; color: var(--info-accent); font-size: 0.75rem; }
    .info-connector {
      text-align: center; color: var(--info-accent); font-size: 1.4rem; line-height: 1;
      padding: 4px 0;
    }
    @media (max-width: 768px) {
      .info-flow { flex-direction: column !important; }
      .info-block { min-width: auto !important; }
      body { padding: 16px; }
    }
  </style>
</head>
<body>
  <main class="info-shell">
    <header class="info-header">
      <h1 class="info-header__title">${esc(config.title)}</h1>
      <p class="info-header__summary">${esc(config.summary)}</p>

    </header>
    <div class="info-flow">
${blocksHtml}
    </div>
  </main>
</body>
</html>`;
}

function renderBlock(block: InfographicBlock): string {
  const titleHtml = block.title ? `<h2 class="info-block__title">${esc(block.title)}</h2>` : '';
  const bodyHtml = block.body ? `<p class="info-block__body">${esc(block.body)}</p>` : '';

  let contentHtml = '';
  if (block.stats?.length) {
    contentHtml += `<div class="info-stats">${block.stats.map(s =>
      `<div class="info-stat"><div class="info-stat__value">${esc(s.value)}</div><div class="info-stat__label">${esc(s.label)}</div></div>`
    ).join('')}</div>`;
  }
  if (block.steps?.length) {
    contentHtml += `<div class="info-steps">${block.steps.map(s =>
      `<div class="info-step"><div class="info-step__num">${s.number}</div><div class="info-step__content"><p class="info-step__title">${esc(s.title)}</p><p class="info-step__desc">${esc(s.description)}</p></div></div>`
    ).join('')}</div>`;
  }
  if (block.comparisons?.length) {
    contentHtml += `<div class="info-comparisons">${block.comparisons.map(c =>
      `<div class="info-cmp"><span>${esc(c.left)}</span><span class="info-cmp__vs">VS</span><span>${esc(c.right)}</span></div>`
    ).join('')}</div>`;
  }

  return `      <div class="info-block" data-block="${block.id}" data-type="${block.type}">
        ${titleHtml}${bodyHtml}${contentHtml}
      </div>`;
}

function resolvePalette(themeMode: InfographicTheme, theme: ThemePack): InfoPalette {
  const light: InfoPalette = {
    bg: '#f7f8fb', surface: '#ffffff', border: '#e4e7ed', text: '#111827',
    muted: '#6b7280', accent: '#4f46e5', accentSoft: 'rgba(79,70,229,0.08)', shadow: 'rgba(0,0,0,0.05)',
  };
  const dark: InfoPalette = {
    bg: '#0c1018', surface: '#161b28', border: '#272e40', text: '#f0f2f6',
    muted: '#8892a8', accent: '#818cf8', accentSoft: 'rgba(129,140,248,0.12)', shadow: 'rgba(0,0,0,0.25)',
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

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
