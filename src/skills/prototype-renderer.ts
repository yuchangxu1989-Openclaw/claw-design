import type { ThemePack } from '../types.js';
import { escapeHtml } from '../utils.js';
import type {
  InteractionType,
  PrototypeCardSpec,
  PrototypeConfig,
  PrototypeEmptyStateSpec,
  PrototypeFormFieldSpec,
  PrototypeInteractionSpec,
  PrototypePageSpec,
  PrototypeProgressSpec,
  PrototypeSectionSpec,
  PrototypeStatItem,
  PrototypeStyle,
  PrototypeTableSpec,
  PrototypeTheme,
  PrototypeTimelineItem,
} from './prototype-types.js';

export const PROTOTYPE_ROUTE_TEMPLATE = `const pages = ['home', 'detail', 'cart'];
const defaultPage = 'home';
window.addEventListener('hashchange', syncPage);
function syncPage() {
  const page = window.location.hash.replace(/^#\\/?/, '') || defaultPage;
}`;

export const PROTOTYPE_COMPONENT_TEMPLATE = `<section id="home-overview" data-section="overview">
  <article data-component="card-home-overview-0" data-state="collapsed">
    <button data-action="toggle" data-state-target="card-home-overview-0">切换状态</button>
  </article>
  <button data-action="modal" data-state-target="global-modal">打开模态框</button>
  <button data-action="tab-switch" data-state-target="tabs-home-overview" data-state-value="details">切换标签</button>
</section>`;

export const PROTOTYPE_STATE_TEMPLATE = `document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  if (trigger.dataset.action === 'toggle') {
    const target = document.querySelector('[data-component="' + trigger.dataset.stateTarget + '"]');
    if (target) target.dataset.state = target.dataset.state === 'collapsed' ? 'expanded' : 'collapsed';
  }
});`;

export function renderPrototypeHtml(config: PrototypeConfig, themePack: ThemePack): string {
  const defaultPage = config.defaultPage ?? config.pages[0]?.name ?? 'home';
  const cssVars = Object.entries(themePack.cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  const pagesObject = config.pages.map(page => `      ${page.name}: 'page-${page.name}',`).join('\n');
  const navLinks = config.pages.map(page => (
    `<a class="proto-nav__link" href="#/${escapeHtml(page.name)}" data-route-link="${escapeHtml(page.name)}" data-action="navigate">${escapeHtml(page.title)}</a>`
  )).join('\n          ');
  const pageMarkup = config.pages.map((page, index) => renderPage(page, config.pages, index === 0)).join('\n\n');

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${escapeHtml(config.theme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
  <style>
    :root {
${cssVars}
      --proto-bg: ${config.theme === 'dark' ? '#0f172a' : '#f8fafc'};
      --proto-surface: ${surfaceColor(config.theme, config.style)};
      --proto-surface-muted: ${mutedSurfaceColor(config.theme, config.style)};
      --proto-text: ${config.theme === 'dark' ? '#e5eefc' : '#0f172a'};
      --proto-text-soft: ${config.theme === 'dark' ? '#94a3b8' : '#64748b'};
      --proto-border: ${borderColor(config.theme, config.style)};
      --proto-shadow: ${shadowStyle(config.theme, config.style)};
      --proto-radius-xl: ${radiusForStyle(config.style, 'xl')};
      --proto-radius-md: ${radiusForStyle(config.style, 'md')};
      --proto-page-max: 1280px;
      --proto-gap: clamp(12px, 2vw, 20px);
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: var(--cd-font-body, 'Noto Sans SC', 'Noto Sans', sans-serif);
      background: ${backgroundForStyle(config.theme, config.style)};
      color: var(--proto-text);
      min-height: 100vh;
    }
    button, input, textarea, select { font: inherit; }
    a { color: inherit; text-decoration: none; }
    .proto-shell {
      max-width: var(--proto-page-max);
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    .proto-shell--wireframe { filter: grayscale(0.18); }
    .proto-hero {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(280px, 380px);
      gap: 24px;
      margin-bottom: 24px;
    }
    .proto-panel {
      background: var(--proto-surface);
      border: 1px solid var(--proto-border);
      border-radius: var(--proto-radius-xl);
      box-shadow: var(--proto-shadow);
    }
    .proto-hero__main,
    .proto-hero__aside,
    .proto-stage { background: var(--proto-surface); }
    .proto-hero__main,
    .proto-hero__aside { padding: 24px; }
    .proto-hero__main { display: flex; flex-direction: column; gap: 18px; }
    .proto-hero__aside { display: flex; flex-direction: column; gap: 14px; justify-content: space-between; }
    .proto-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--cd-color-primary, #1a73e8);
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .proto-title {
      margin: 0;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: clamp(2rem, 4vw, 3.25rem);
      line-height: 1.08;
    }
    .proto-summary,
    .proto-note,
    .proto-page__summary,
    .proto-card__body,
    .proto-form__hint,
    .proto-modal__body,
    .proto-tab__body,
    .proto-section__body,
    .proto-toast { color: var(--proto-text-soft); line-height: 1.7; }
    .proto-chip-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .proto-chip {
      padding: 8px 12px;
      background: ${chipBackground(config.theme, config.style)};
      color: var(--cd-color-primary, #1a73e8);
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 600;
      border: 1px solid ${config.style === 'wireframe' ? 'var(--proto-border)' : 'transparent'};
    }
    .proto-stage {
      display: grid;
      grid-template-columns: 240px minmax(0, 1fr);
      min-height: 720px;
      overflow: hidden;
      border: 1px solid var(--proto-border);
      border-radius: var(--proto-radius-xl);
      box-shadow: var(--proto-shadow);
    }
    .proto-sidebar {
      padding: 24px 18px;
      border-right: 1px solid var(--proto-border);
      background: ${sidebarBackground(config.theme, config.style)};
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .proto-brand {
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 1.15rem;
      font-weight: 700;
    }
    .proto-nav { display: flex; flex-direction: column; gap: 8px; }
    .proto-nav__link {
      padding: 12px 14px;
      border-radius: var(--proto-radius-md);
      color: var(--proto-text);
      font-weight: 600;
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
      border: 1px solid transparent;
    }
    .proto-nav__link:hover,
    .proto-nav__link[data-active="true"] {
      background: ${activeBackground(config.theme, config.style)};
      color: ${activeText(config.theme, config.style)};
      transform: translateX(2px);
      border-color: ${config.style === 'wireframe' ? 'var(--proto-border)' : 'transparent'};
    }
    .proto-sidebar__meta {
      margin-top: auto;
      padding: 14px;
      background: ${metaBackground(config.theme, config.style)};
      border-radius: var(--proto-radius-md);
      border: 1px solid var(--proto-border);
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .proto-canvas { position: relative; padding: 22px; background: ${canvasBackground(config.theme, config.style)}; }
    .proto-page { display: flex; flex-direction: column; gap: 18px; }
    .proto-page[hidden] { display: none; }
    .proto-page__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      padding: 22px;
      border-radius: var(--proto-radius-xl);
      background: var(--proto-surface);
      border: 1px solid var(--proto-border);
    }
    .proto-page__eyebrow {
      margin: 0 0 8px;
      font-size: 0.78rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--cd-color-primary, #1a73e8);
      font-weight: 700;
    }
    .proto-page__title { margin: 0 0 10px; font-size: 1.8rem; }
    .proto-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--proto-gap); }
    .proto-section,
    .proto-card,
    .proto-tabs,
    .proto-form {
      background: var(--proto-surface);
      border: 1px solid var(--proto-border);
      border-radius: var(--proto-radius-xl);
      padding: 18px;
    }
    .proto-section { grid-column: span 12; display: flex; flex-direction: column; gap: 12px; }
    .proto-section__title { margin: 0; font-size: 1.15rem; }
    .proto-card {
      grid-column: span 4;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .proto-card:hover {
      transform: translateY(-2px);
      box-shadow: ${config.style === 'wireframe' ? 'none' : (config.theme === 'dark' ? '0 8px 24px rgba(2,6,23,0.5)' : '0 8px 24px rgba(15,23,42,0.14)')};
    }
    .proto-card__title { margin: 0; font-size: 1.05rem; }
    .proto-card__action,
    .proto-button,
    .proto-button--ghost {
      border-radius: var(--proto-radius-md);
      padding: 12px 16px;
      cursor: pointer;
      font-weight: 700;
      transition: transform 0.18s ease, opacity 0.18s ease, background 0.18s ease;
    }
    .proto-card__action:hover,
    .proto-button:hover,
    .proto-button--ghost:hover { transform: translateY(-1px); opacity: 0.92; }
    .proto-card__action:active,
    .proto-button:active,
    .proto-button--ghost:active { transform: translateY(0) scale(0.98); opacity: 1; }
    .proto-button:focus-visible,
    .proto-button--ghost:focus-visible,
    .proto-card__action:focus-visible {
      outline: 2px solid var(--cd-color-primary, #1a73e8);
      outline-offset: 2px;
    }
    .proto-button,
    .proto-card__action {
      border: 1px solid ${config.style === 'wireframe' ? 'var(--proto-text)' : 'transparent'};
      background: ${primaryButtonBackground(config.theme, config.style)};
      color: ${primaryButtonText(config.theme, config.style)};
    }
    .proto-button--ghost {
      border: 1px solid var(--proto-border);
      background: ${ghostButtonBackground(config.theme, config.style)};
      color: var(--proto-text);
    }
    .proto-card[data-state="collapsed"] .proto-card__body {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .proto-tabs { grid-column: span 8; display: flex; flex-direction: column; gap: 14px; }
    .proto-tabs__nav { display: flex; gap: 10px; flex-wrap: wrap; }
    .proto-tabs__panel { display: none; }
    .proto-tabs__panel[data-active="true"] { display: block; }
    .proto-form {
      grid-column: span 4;
      background: var(--proto-surface-muted);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .proto-form label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; }
    .proto-input {
      border: 1px solid var(--proto-border);
      border-radius: var(--proto-radius-md);
      padding: 12px 14px;
      background: ${inputBackground(config.theme)};
      color: var(--proto-text);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }
    .proto-input:focus {
      outline: none;
      border-color: var(--cd-color-primary, #1a73e8);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.18);
    }
    .proto-input:hover:not(:focus) {
      border-color: ${config.theme === 'dark' ? 'rgba(148,163,184,0.4)' : 'rgba(15,23,42,0.2)'};
    }
    .proto-form__actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .proto-actions-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .proto-modal {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.48);
      display: grid;
      place-items: center;
      padding: 20px;
      z-index: 20;
    }
    .proto-modal[hidden] { display: none; }
    .proto-modal__panel {
      width: min(520px, 100%);
      background: var(--proto-surface);
      border-radius: var(--proto-radius-xl);
      padding: 24px;
      box-shadow: var(--proto-shadow);
      border: 1px solid var(--proto-border);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .proto-modal__title { margin: 0; font-size: 1.5rem; }
    .proto-toast {
      position: fixed;
      right: 20px;
      bottom: 20px;
      max-width: 320px;
      padding: 14px 16px;
      border-radius: var(--proto-radius-md);
      background: ${toastBackground(config.theme)};
      color: #f8fafc;
      box-shadow: var(--proto-shadow);
      z-index: 22;
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .proto-toast[data-visible="true"] { opacity: 1; transform: translateY(0); }
    .proto-source {
      font-size: 0.85rem;
      padding: 12px 14px;
      background: ${metaBackground(config.theme, config.style)};
      border-radius: var(--proto-radius-md);
      line-height: 1.7;
      word-break: break-word;
      border: 1px solid var(--proto-border);
    }
    /* ── Stats Panel ── */
    .proto-stats { grid-column: span 12; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--proto-gap); }
    .proto-stat-card {
      background: var(--proto-surface);
      border: 1px solid var(--proto-border);
      border-radius: var(--proto-radius-xl);
      padding: 18px;
      text-align: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .proto-stat-card:hover { transform: translateY(-2px); box-shadow: var(--proto-shadow); }
    .proto-stat-value { font-size: 1.8rem; font-weight: 800; color: var(--cd-color-primary, #1a73e8); }
    .proto-stat-label { font-size: 0.82rem; color: var(--proto-text-soft); margin-top: 4px; }
    .proto-stat-change { font-size: 0.78rem; font-weight: 600; margin-top: 6px; }
    .proto-stat-change--positive { color: #10b981; }
    .proto-stat-change--negative { color: #ef4444; }
    .proto-stat-change--neutral { color: var(--proto-text-soft); }
    /* ── Table ── */
    .proto-table-wrap { grid-column: span 12; overflow-x: auto; }
    .proto-table {
      width: 100%; border-collapse: collapse;
      background: var(--proto-surface);
      border: 1px solid var(--proto-border);
      border-radius: var(--proto-radius-xl);
      overflow: hidden;
    }
    .proto-table th, .proto-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--proto-border); }
    .proto-table th { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--proto-text-soft); background: var(--proto-surface-muted); }
    .proto-table tr { transition: background 0.15s ease; }
    .proto-table tbody tr:hover { background: ${config.theme === 'dark' ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.03)'}; }
    /* ── Timeline ── */
    .proto-timeline { grid-column: span 12; display: flex; flex-direction: column; gap: 0; padding: 0 0 0 20px; border-left: 2px solid var(--proto-border); }
    .proto-timeline-item { position: relative; padding: 0 0 24px 20px; }
    .proto-timeline-item::before {
      content: ''; position: absolute; left: -27px; top: 4px;
      width: 12px; height: 12px; border-radius: 50%;
      border: 2px solid var(--proto-border); background: var(--proto-surface);
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .proto-timeline-item--done::before { background: var(--cd-color-primary, #1a73e8); border-color: var(--cd-color-primary, #1a73e8); }
    .proto-timeline-item--active::before { background: #10b981; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
    .proto-timeline-time { font-size: 0.78rem; color: var(--proto-text-soft); font-weight: 600; }
    .proto-timeline-title { font-weight: 600; margin-top: 2px; }
    .proto-timeline-desc { font-size: 0.88rem; color: var(--proto-text-soft); margin-top: 2px; }
    /* ── Progress Bar ── */
    .proto-progress-wrap { grid-column: span 6; background: var(--proto-surface); border: 1px solid var(--proto-border); border-radius: var(--proto-radius-xl); padding: 18px; }
    .proto-progress-label { font-weight: 600; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .proto-progress-track { height: 10px; background: var(--proto-surface-muted); border-radius: 5px; overflow: hidden; }
    .proto-progress-fill { height: 100%; background: var(--cd-color-primary, #1a73e8); border-radius: 5px; transition: width 0.4s ease; }
    /* ── Empty State ── */
    .proto-empty { grid-column: span 6; background: var(--proto-surface); border: 1px dashed var(--proto-border); border-radius: var(--proto-radius-xl); padding: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .proto-empty-icon { font-size: 2.5rem; }
    .proto-empty-title { font-weight: 700; font-size: 1.1rem; }
    .proto-empty-desc { color: var(--proto-text-soft); font-size: 0.9rem; }
    /* ── Confirm Dialog ── */
    .proto-confirm {
      position: fixed; inset: 0; background: rgba(15,23,42,0.48);
      display: grid; place-items: center; padding: 20px; z-index: 21;
    }
    .proto-confirm[hidden] { display: none; }
    .proto-confirm__panel {
      width: min(400px, 100%); background: var(--proto-surface);
      border-radius: var(--proto-radius-xl); padding: 24px;
      box-shadow: var(--proto-shadow); border: 1px solid var(--proto-border);
      text-align: center; display: flex; flex-direction: column; gap: 14px;
    }
    .proto-confirm__title { margin: 0; font-size: 1.2rem; }
    .proto-confirm__body { color: var(--proto-text-soft); }
    .proto-confirm__actions { display: flex; gap: 10px; justify-content: center; }
    /* ── Select / Textarea / File Upload ── */
    .proto-select {
      border: 1px solid var(--proto-border); border-radius: var(--proto-radius-md);
      padding: 12px 14px; background: ${inputBackground(config.theme)}; color: var(--proto-text);
      appearance: none; cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%2364748b' stroke-width='1.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .proto-select:focus { outline: none; border-color: var(--cd-color-primary, #1a73e8); box-shadow: 0 0 0 3px rgba(26,115,232,0.18); }
    .proto-textarea {
      border: 1px solid var(--proto-border); border-radius: var(--proto-radius-md);
      padding: 12px 14px; background: ${inputBackground(config.theme)}; color: var(--proto-text);
      resize: vertical; min-height: 80px; font: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .proto-textarea:focus { outline: none; border-color: var(--cd-color-primary, #1a73e8); box-shadow: 0 0 0 3px rgba(26,115,232,0.18); }
    .proto-file-upload {
      border: 2px dashed var(--proto-border); border-radius: var(--proto-radius-xl);
      padding: 24px; text-align: center; cursor: pointer;
      background: var(--proto-surface-muted); color: var(--proto-text-soft);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .proto-file-upload:hover { border-color: var(--cd-color-primary, #1a73e8); background: ${config.theme === 'dark' ? 'rgba(26,115,232,0.06)' : 'rgba(26,115,232,0.04)'}; }
    .proto-file-upload-icon { font-size: 1.5rem; margin-bottom: 6px; }
    /* ── Bottom Tab Bar (mobile nav variant) ── */
    .proto-bottom-tab {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: var(--proto-surface); border-top: 1px solid var(--proto-border);
      display: none; justify-content: space-around; padding: 8px 0 env(safe-area-inset-bottom, 8px);
      z-index: 15; box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
    }
    .proto-bottom-tab__item {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      font-size: 0.72rem; font-weight: 600; color: var(--proto-text-soft);
      padding: 6px 12px; border-radius: var(--proto-radius-md);
      transition: color 0.2s ease, background 0.2s ease; cursor: pointer; border: none; background: none;
    }
    .proto-bottom-tab__item:hover, .proto-bottom-tab__item[data-active="true"] { color: var(--cd-color-primary, #1a73e8); }
    .proto-bottom-tab__icon { font-size: 1.2rem; }
    @media (max-width: 767px) {
      .proto-bottom-tab { display: flex; }
      body { padding-bottom: 72px; }
    }
    @media (max-width: 1024px) {
      .proto-hero,
      .proto-stage { grid-template-columns: 1fr; }
      .proto-sidebar { border-right: none; border-bottom: 1px solid var(--proto-border); }
      .proto-card,
      .proto-tabs,
      .proto-form { grid-column: span 12; }
    }
    @media (max-width: 767px) {
      .proto-shell { padding: 16px 12px 28px; }
      .proto-hero__main,
      .proto-hero__aside,
      .proto-page__header,
      .proto-tabs,
      .proto-card,
      .proto-form,
      .proto-section { padding: 16px; }
      .proto-title { font-size: 2rem; }
      .proto-page__title { font-size: 1.45rem; }
      .proto-page__header { flex-direction: column; }
      .proto-nav { flex-direction: row; overflow: auto; padding-bottom: 4px; }
      .proto-nav__link { white-space: nowrap; }
      .proto-canvas { padding: 14px; }
    }
  </style>
</head>
<body>
  <div class="proto-shell proto-shell--${escapeHtml(config.style)}">
    <section class="proto-hero">
      <div class="proto-panel proto-hero__main">
        <span class="proto-kicker">${escapeHtml(config.appName ?? config.title)}</span>
        <h1 class="proto-title">${escapeHtml(config.title)}</h1>
        <p class="proto-summary">${escapeHtml(config.summary)}</p>
        <div class="proto-chip-row">
          ${config.pages.map(page => `<span class="proto-chip">${escapeHtml(page.title)}</span>`).join('')}
        </div>
      </div>
      <aside class="proto-panel proto-hero__aside">
        <div>
          <h2 style="margin:0 0 10px; font-size: 1.15rem;">功能概览</h2>
          <p class="proto-note">${escapeHtml(config.summary)}</p>
        </div>
      </aside>
    </section>

    <section class="proto-stage">
      <aside class="proto-sidebar">
        <div class="proto-brand">${escapeHtml(config.appName ?? config.title)}</div>
        <nav class="proto-nav" data-component="nav-panel" data-state="active">
          ${navLinks}
        </nav>
        <div class="proto-sidebar__meta">
          <strong>${escapeHtml(config.footerNote ?? `© ${config.appName ?? config.title} 2026`)}</strong>
        </div>
      </aside>

      <main class="proto-canvas">
        ${pageMarkup}
      </main>
    </section>
  </div>

  <div class="proto-modal" data-component="global-modal" data-state="closed" hidden>
    <div class="proto-modal__panel">
      <h2 class="proto-modal__title">${escapeHtml(config.modalTitle ?? `欢迎使用${config.appName ?? config.title}`)}</h2>
      <p class="proto-modal__body">${escapeHtml(config.modalBody ?? `${config.appName ?? config.title}已准备就绪，点击各功能模块开始体验。`)}</p>
      <div class="proto-form__actions">
        <button class="proto-button" type="button" data-action="modal-close" data-state-target="global-modal">关闭</button>
      </div>
      </div>
    </div>
  </div>

  <div class="proto-toast" data-component="global-toast" data-state="hidden"></div>

  <div class="proto-confirm" data-component="global-confirm" data-state="closed" hidden>
    <div class="proto-confirm__panel">
      <h3 class="proto-confirm__title">确认操作</h3>
      <p class="proto-confirm__body">确定要执行此操作吗？</p>
      <div class="proto-confirm__actions">
        <button class="proto-button--ghost" type="button" data-action="confirm-cancel" data-state-target="global-confirm">取消</button>
        <button class="proto-button" type="button" data-action="confirm-ok" data-state-target="global-confirm">确认</button>
      </div>
    </div>
  </div>

  <nav class="proto-bottom-tab" data-component="bottom-tab">
    ${config.pages.map(page => `<button class="proto-bottom-tab__item" data-action="navigate" data-target-page="${escapeHtml(page.name)}" data-route-link="${escapeHtml(page.name)}"><span class="proto-bottom-tab__icon">${bottomTabIcon(page.name)}</span><span>${escapeHtml(page.title.slice(0, 4))}</span></button>`).join('\n    ')}
  </nav>

  <script>
    const routes = {
${pagesObject}
    };
    const pages = routes;
    const defaultPage = '${escapeHtml(defaultPage)}';
    const stateRegistry = {
      'global-modal': { defaultState: 'closed' },
      'global-toast': { defaultState: 'hidden' },
      'global-confirm': { defaultState: 'closed' },
${buildStateRegistry(config)}
    };

    function getPageFromHash() {
      const value = window.location.hash.replace(/^#\\/?/, '');
      return value || defaultPage;
    }

    function syncPage() {
      const pageName = getPageFromHash();
      const targetId = pages[pageName] || pages[defaultPage];
      document.querySelectorAll('[data-page]').forEach((page) => {
        page.hidden = page.id !== targetId;
      });
      document.querySelectorAll('[data-route-link]').forEach((link) => {
        link.dataset.active = String(link.dataset.routeLink === pageName);
      });
    }

    function syncComponent(component) {
      if (!component) return;
      const name = component.dataset.component;
      const state = component.dataset.state || stateRegistry[name]?.defaultState || '';
      if (name === 'global-modal') {
        component.hidden = state !== 'open';
      }
      if (name === 'global-confirm') {
        component.hidden = state !== 'open';
      }
      if (name === 'global-toast') {
        component.dataset.visible = String(state === 'visible');
      }
      if (name && name.startsWith('card-')) {
        const action = component.querySelector('[data-action="toggle"]');
        if (action) {
          action.textContent = state === 'collapsed' ? '展开内容' : '收起内容';
        }
      }
      if (name && name.startsWith('tabs-')) {
        component.querySelectorAll('[data-panel]').forEach((panel) => {
          panel.dataset.active = String(panel.dataset.panel === state);
        });
        component.querySelectorAll('[data-tab-trigger]').forEach((trigger) => {
          const active = trigger.dataset.stateValue === state;
          trigger.className = active ? 'proto-button' : 'proto-button--ghost';
        });
      }
    }

    function syncAllStates() {
      document.querySelectorAll('[data-component]').forEach((component) => syncComponent(component));
    }

    function showToast(message) {
      const toast = document.querySelector('[data-component="global-toast"]');
      if (!toast) return;
      toast.textContent = message;
      toast.dataset.state = 'visible';
      syncComponent(toast);
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => {
        toast.dataset.state = 'hidden';
        syncComponent(toast);
      }, 1800);
    }

    function scrollToSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;

      const action = trigger.dataset.action;
      const targetName = trigger.dataset.stateTarget;
      const component = targetName ? document.querySelector('[data-component="' + targetName + '"]') : null;

      if (action === 'navigate') {
        const targetPage = trigger.dataset.targetPage || trigger.dataset.routeLink;
        if (targetPage) {
          window.location.hash = '#/' + targetPage;
        }
        return;
      }

      if (action === 'toggle' && component) {
        component.dataset.state = component.dataset.state === 'collapsed' ? 'expanded' : 'collapsed';
        syncComponent(component);
        return;
      }

      if (action === 'modal' && component) {
        component.dataset.state = 'open';
        syncComponent(component);
        return;
      }

      if (action === 'modal-close' && component) {
        component.dataset.state = 'closed';
        syncComponent(component);
        return;
      }

      if (action === 'tab-switch' && component) {
        component.dataset.state = trigger.dataset.stateValue || component.dataset.state || 'overview';
        syncComponent(component);
        return;
      }

      if (action === 'confirm-dialog') {
        const confirm = document.querySelector('[data-component="global-confirm"]');
        if (confirm) { confirm.dataset.state = 'open'; syncComponent(confirm); }
        return;
      }

      if ((action === 'confirm-cancel' || action === 'confirm-ok') && component) {
        component.dataset.state = 'closed';
        syncComponent(component);
        if (action === 'confirm-ok') showToast('操作已确认。');
        return;
      }

      if (action === 'scroll-to') {
        const targetSectionId = trigger.dataset.targetSectionId;
        if (targetSectionId) {
          scrollToSection(targetSectionId);
          showToast('已定位到目标模块。');
        }
        return;
      }
    });

    document.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-demo-form]');
      if (!form) return;
      event.preventDefault();
      showToast('表单提交成功，当前页面状态已保留。');
    });

    window.addEventListener('hashchange', syncPage);
    if (!window.location.hash) {
      window.location.hash = '#/' + defaultPage;
    }
    syncAllStates();
    syncPage();
  </script>
</body>
</html>`;
}

function renderPage(page: PrototypePageSpec, pages: PrototypePageSpec[], visible: boolean): string {
  const sections = page.sections.map(section => renderSection(section, page, pages)).join('\n');
  const primaryInteraction = pickInteraction(page.interactions, 'modal') ?? pickInteraction(page.interactions, 'navigate');
  const secondaryInteraction = pickInteraction(page.interactions, 'tab-switch') ?? pickInteraction(page.interactions, 'scroll-to');

  return `<section id="page-${escapeHtml(page.name)}" data-page="${escapeHtml(page.name)}" class="proto-page"${visible ? '' : ' hidden'}>
          <header class="proto-page__header">
            <div>
              <p class="proto-page__eyebrow">${escapeHtml(page.name)}</p>
              <h2 class="proto-page__title">${escapeHtml(page.title)}</h2>
              <p class="proto-page__summary">${escapeHtml(page.summary)}</p>
            </div>
            <div class="proto-form__actions">
              ${primaryInteraction ? renderActionButton(primaryInteraction, 'proto-button') : ''}
              ${secondaryInteraction ? renderActionButton(secondaryInteraction, 'proto-button--ghost') : ''}
            </div>
          </header>
          <div class="proto-grid">
${sections}
          </div>
        </section>`;
}

function renderSection(section: PrototypeSectionSpec, page: PrototypePageSpec, pages: PrototypePageSpec[]): string {
  const cards = (section.cards ?? []).map((card, index) => renderCard(card, page, section, index)).join('\n');
  const form = (section.formFields?.length ?? 0) > 0 ? renderForm(section, page, pages) : '';
  const tabs = (section.tabs?.length ?? 0) > 0 ? renderTabs(section) : '';
  const stats = (section.statsPanel?.length ?? 0) > 0 ? renderStatsPanel(section.statsPanel!) : '';
  const table = section.table ? renderTable(section.table) : '';
  const timeline = (section.timeline?.length ?? 0) > 0 ? renderTimeline(section.timeline!) : '';
  const progress = section.progressBar ? renderProgressBar(section.progressBar) : '';
  const empty = section.emptyState ? renderEmptyState(section.emptyState) : '';
  const actions = page.interactions.filter(interaction => interaction.targetSectionId === section.id && interaction.type === 'scroll-to');

  return `<section id="${escapeHtml(section.id)}" class="proto-section" data-section="${escapeHtml(section.name)}">
            <h3 class="proto-section__title">${escapeHtml(section.title)}</h3>
            ${section.body ? `<p class="proto-section__body">${escapeHtml(section.body)}</p>` : ''}
            ${actions.length > 0 ? `<div class="proto-actions-row">${actions.map(action => renderActionButton(action, 'proto-button--ghost')).join('')}</div>` : ''}
          </section>
          ${stats}
          ${cards}
          ${tabs}
          ${table}
          ${timeline}
          ${progress}
          ${empty}
          ${form}`;
}

function renderCard(card: PrototypeCardSpec, page: PrototypePageSpec, section: PrototypeSectionSpec, index: number): string {
  const componentName = `card-${page.name}-${section.name}-${index}`;
  return `<article class="proto-card" data-component="${escapeHtml(componentName)}" data-state="collapsed">
            <h4 class="proto-card__title">${escapeHtml(card.title)}</h4>
            <p class="proto-card__body">${escapeHtml(card.body)}</p>
            <button class="proto-card__action" type="button" data-action="toggle" data-state-target="${escapeHtml(componentName)}">展开内容</button>
          </article>`;
}

function renderTabs(section: PrototypeSectionSpec): string {
  const tabs = section.tabs ?? [];
  const componentName = `tabs-${section.id}`;
  const first = tabs[0]?.key ?? 'overview';
  const triggers = tabs.map((tab, index) => `
              <button
                class="${index === 0 ? 'proto-button' : 'proto-button--ghost'}"
                type="button"
                data-action="tab-switch"
                data-tab-trigger="true"
                data-state-target="${escapeHtml(componentName)}"
                data-state-value="${escapeHtml(tab.key)}"
              >${escapeHtml(tab.label)}</button>`).join('');
  const panels = tabs.map(tab => `<div class="proto-tabs__panel" data-panel="${escapeHtml(tab.key)}" data-active="${String(tab.key === first)}"><p class="proto-tab__body">${escapeHtml(tab.body)}</p></div>`).join('');

  return `<section class="proto-tabs" data-component="${escapeHtml(componentName)}" data-state="${escapeHtml(first)}">

            <div class="proto-tabs__nav">${triggers}
            </div>
            ${panels}
          </section>`;
}

function renderForm(section: PrototypeSectionSpec, page: PrototypePageSpec, pages: PrototypePageSpec[]): string {
  const fields = (section.formFields ?? []).map((field: PrototypeFormFieldSpec) => {
    if (field.type === 'select' && field.options) {
      const opts = field.options.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('');
      return `
              <label>
                <span>${escapeHtml(field.label)}</span>
                <select class="proto-select">
                  <option value="">${escapeHtml(field.placeholder)}</option>
                  ${opts}
                </select>
              </label>`;
    }
    if (field.type === 'textarea') {
      return `
              <label>
                <span>${escapeHtml(field.label)}</span>
                <textarea class="proto-textarea" placeholder="${escapeHtml(field.placeholder)}"></textarea>
              </label>`;
    }
    if (field.type === 'file') {
      return `
              <label>
                <span>${escapeHtml(field.label)}</span>
                <div class="proto-file-upload">
                  <div class="proto-file-upload-icon">📁</div>
                  <div>${escapeHtml(field.placeholder)}</div>
                  <div style="font-size:0.78rem;margin-top:4px;">点击或拖拽文件到此处</div>
                </div>
              </label>`;
    }
    return `
              <label>
                <span>${escapeHtml(field.label)}</span>
                <input class="proto-input" type="${escapeHtml(field.type)}" placeholder="${escapeHtml(field.placeholder)}">
              </label>`;
  }).join('');
  const routeOptions = pages
    .filter(candidate => candidate.name !== page.name)
    .map(candidate => `<option value="#/${escapeHtml(candidate.name)}">${escapeHtml(candidate.title)}</option>`)
    .join('');

  return `<form class="proto-form" data-demo-form>
            ${fields}
            <label>
              <span>跳转到其他页面</span>
              <select class="proto-select" onchange="if(this.value) window.location.hash = this.value;">
                <option value="">请选择</option>
                ${routeOptions}
              </select>
            </label>
            <p class="proto-form__hint">提交后会显示反馈 toast，页面状态不会被清空。</p>
            <div class="proto-form__actions">
              <button class="proto-button" type="submit" data-action="toggle">提交</button>
              <button class="proto-button--ghost" type="button" data-action="modal" data-state-target="global-modal">了解更多</button>
            </div>
          </form>`;
}

function renderActionButton(interaction: PrototypeInteractionSpec, className: string): string {
  const attrs = buildInteractionAttrs(interaction);
  return `<button class="${className}" type="button" ${attrs}>${escapeHtml(interaction.label)}</button>`;
}

function buildInteractionAttrs(interaction: PrototypeInteractionSpec): string {
  const attrs: Array<[string, string]> = [['data-action', interaction.type]];
  if (interaction.targetPage) attrs.push(['data-target-page', interaction.targetPage]);
  if (interaction.targetSectionId) attrs.push(['data-target-section-id', interaction.targetSectionId]);
  if (interaction.targetComponent) attrs.push(['data-state-target', interaction.targetComponent]);
  if (interaction.stateValue) attrs.push(['data-state-value', interaction.stateValue]);
  if (interaction.modalId) attrs.push(['data-modal-id', interaction.modalId]);
  return attrs.map(([name, value]) => `${name}="${escapeHtml(value)}"`).join(' ');
}

function renderStatsPanel(stats: PrototypeStatItem[]): string {
  const cards = stats.map(stat => {
    const changeClass = stat.changeType ? `proto-stat-change--${stat.changeType}` : '';
    return `<div class="proto-stat-card">
      <div class="proto-stat-value">${escapeHtml(stat.value)}</div>
      <div class="proto-stat-label">${escapeHtml(stat.label)}</div>
      ${stat.change ? `<div class="proto-stat-change ${changeClass}">${escapeHtml(stat.change)}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="proto-stats">${cards}</div>`;
}

function renderTable(table: PrototypeTableSpec): string {
  const ths = table.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const trs = table.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="proto-table-wrap" style="grid-column:span 12">
    <table class="proto-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
  </div>`;
}

function renderTimeline(items: PrototypeTimelineItem[]): string {
  const entries = items.map(item => {
    const statusClass = item.status ? `proto-timeline-item--${item.status}` : '';
    return `<div class="proto-timeline-item ${statusClass}">
      <div class="proto-timeline-time">${escapeHtml(item.time)}</div>
      <div class="proto-timeline-title">${escapeHtml(item.title)}</div>
      ${item.description ? `<div class="proto-timeline-desc">${escapeHtml(item.description)}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="proto-timeline">${entries}</div>`;
}

function renderProgressBar(progress: PrototypeProgressSpec): string {
  const max = progress.max ?? 100;
  const pct = Math.min(100, Math.round((progress.value / max) * 100));
  return `<div class="proto-progress-wrap">
    <div class="proto-progress-label"><span>${escapeHtml(progress.label)}</span><span>${pct}%</span></div>
    <div class="proto-progress-track"><div class="proto-progress-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function renderEmptyState(empty: PrototypeEmptyStateSpec): string {
  return `<div class="proto-empty">
    ${empty.icon ? `<div class="proto-empty-icon">${escapeHtml(empty.icon)}</div>` : ''}
    <div class="proto-empty-title">${escapeHtml(empty.title)}</div>
    <div class="proto-empty-desc">${escapeHtml(empty.description)}</div>
    ${empty.actionLabel ? `<button class="proto-button" type="button" data-action="navigate" data-target-page="home">${escapeHtml(empty.actionLabel)}</button>` : ''}
  </div>`;
}

function bottomTabIcon(pageName: string): string {
  const icons: Record<string, string> = {
    home: '🏠', detail: '📝', cart: '🛒', dashboard: '📊',
    settings: '⚙️', profile: '👤', checkout: '💳', login: '🔑',
  };
  return icons[pageName] ?? '📌';
}

function buildStateRegistry(config: PrototypeConfig): string {
  const lines: string[] = [];
  for (const page of config.pages) {
    for (const section of page.sections) {
      if ((section.tabs?.length ?? 0) > 0) {
        lines.push(`      'tabs-${section.id}': { defaultState: '${section.tabs?.[0]?.key ?? 'overview'}' },`);
      }
      (section.cards ?? []).forEach((_, index) => {
        lines.push(`      'card-${page.name}-${section.name}-${index}': { defaultState: 'collapsed' },`);
      });
    }
  }
  return lines.join('\n');
}

function pickInteraction(interactions: PrototypeInteractionSpec[], type: InteractionType): PrototypeInteractionSpec | null {
  return interactions.find(interaction => interaction.type === type) ?? null;
}

function backgroundForStyle(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#111827' : '#f5f5f5';
  if (style === 'material') return theme === 'dark' ? 'linear-gradient(180deg, #111827 0%, #1f2937 100%)' : 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)';
  return theme === 'dark' ? '#0f172a' : 'linear-gradient(180deg, #eef4ff 0%, #f9fbff 100%)';
}

function surfaceColor(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#111111' : '#ffffff';
  if (style === 'material') return theme === 'dark' ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.96)';
  return theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
}

function mutedSurfaceColor(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#171717' : '#f7f7f7';
  return theme === 'dark' ? 'rgba(15, 23, 42, 0.82)' : '#f4f7fb';
}

function borderColor(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#8f8f8f' : '#1f2937';
  return theme === 'dark' ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.08)';
}

function shadowStyle(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return 'none';
  return theme === 'dark' ? '0 24px 60px rgba(2, 6, 23, 0.42)' : '0 24px 60px rgba(15, 23, 42, 0.12)';
}

function radiusForStyle(style: PrototypeStyle, size: 'xl' | 'md'): string {
  if (style === 'wireframe') return size === 'xl' ? '8px' : '6px';
  if (style === 'material') return size === 'xl' ? '24px' : '16px';
  return size === 'xl' ? '22px' : '14px';
}

function chipBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#1f2937' : '#ffffff';
  return 'rgba(26, 115, 232, 0.12)';
}

function sidebarBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#101010' : '#fafafa';
  if (style === 'material') return theme === 'dark' ? 'linear-gradient(180deg, rgba(30,41,59,0.98), rgba(17,24,39,0.88))' : 'linear-gradient(180deg, rgba(224,231,255,0.88), rgba(255,255,255,0.82))';
  return theme === 'dark' ? 'linear-gradient(180deg, rgba(30,41,59,0.9), rgba(15,23,42,0.82))' : 'linear-gradient(180deg, rgba(26,115,232,0.08), rgba(26,115,232,0.02))';
}

function activeBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#e5e7eb' : '#111827';
  return 'var(--cd-color-primary, #1a73e8)';
}

function activeText(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#111827' : '#ffffff';
  return '#ffffff';
}

function metaBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#0f0f0f' : '#ffffff';
  return theme === 'dark' ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255,255,255,0.72)';
}

function canvasBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#0f0f0f' : '#fcfcfc';
  return theme === 'dark' ? 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 35%)' : 'radial-gradient(circle at top right, rgba(26,115,232,0.08), transparent 35%)';
}

function primaryButtonBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#ffffff' : '#111827';
  return 'var(--cd-color-primary, #1a73e8)';
}

function primaryButtonText(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#111827' : '#ffffff';
  return '#ffffff';
}

function ghostButtonBackground(theme: PrototypeTheme, style: PrototypeStyle): string {
  if (style === 'wireframe') return theme === 'dark' ? '#111111' : '#ffffff';
  return theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
}

function inputBackground(theme: PrototypeTheme): string {
  return theme === 'dark' ? '#0f172a' : '#ffffff';
}

function toastBackground(theme: PrototypeTheme): string {
  return theme === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(17, 24, 39, 0.92)';
}

