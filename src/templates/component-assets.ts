export interface ComponentAsset {
  id: string;
  name: string;
  category: 'title' | 'chart-container' | 'cover' | 'comparison' | 'flow' | 'data-card' | 'icon' | 'decoration';
  description?: string;
  tags: string[];
  artifactTypes: string[];
  skeleton: string;
  css?: string;
  thumbnail?: string;
  version?: string;
  updatedAt?: string;
}

export const BUILT_IN_ASSETS: ComponentAsset[] = [
  {
    id: 'title-hero',
    name: 'Hero Title',
    category: 'title',
    description: 'Full-screen hero title with gradient background',
    tags: ['title', 'hero', 'gradient'],
    artifactTypes: ['slides', 'landing-page', 'poster'],
    skeleton: `<section class="cd-hero-title">
  <div class="cd-hero-content">
    <h1>{{title}}</h1>
    <p class="cd-subtitle">{{subtitle}}</p>
    <div class="cd-cta">{{cta}}</div>
  </div>
</section>`,
    css: `.cd-hero-title {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--cd-color-primary) 0%, var(--cd-color-primary-dark, #1565c0) 100%);
}
.cd-hero-content { text-align: center; color: #fff; padding: 2rem; }
.cd-hero-content h1 { font-size: 3.5rem; margin-bottom: 1rem; font-weight: 700; }
.cd-subtitle { font-size: 1.5rem; opacity: 0.9; margin-bottom: 2rem; }
.cd-cta { display: inline-block; padding: 1rem 2rem; background: #fff; color: var(--cd-color-primary); border-radius: var(--cd-radius, 4px); font-weight: 600; }`,
  },
  {
    id: 'title-section',
    name: 'Section Title',
    category: 'title',
    description: 'Section heading with underline accent',
    tags: ['title', 'section', 'heading'],
    artifactTypes: ['slides', 'infographic', 'landing-page'],
    skeleton: `<section class="cd-section-title">
  <h2>{{heading}}</h2>
  <p class="cd-desc">{{description}}</p>
</section>`,
    css: `.cd-section-title { padding: 2rem; }
.cd-section-title h2 { font-size: 2rem; color: var(--cd-color-primary); border-bottom: 3px solid var(--cd-color-primary); padding-bottom: 0.5rem; margin-bottom: 1rem; }
.cd-desc { font-size: 1.1rem; color: #666; line-height: 1.6; }`,
  },
  {
    id: 'chart-bar-container',
    name: 'Bar Chart Container',
    category: 'chart-container',
    description: 'Container for bar chart visualization',
    tags: ['chart', 'bar', 'container'],
    artifactTypes: ['chart', 'dashboard', 'infographic'],
    skeleton: `<div class="cd-chart-bar">
  <div class="cd-chart-head">
    <span class="cd-label">{{label}}</span>
    <span class="cd-value">{{value}}</span>
  </div>
  <div class="cd-bar-track">
    <div class="cd-bar-fill" style="width: {{percentage}}%;"></div>
  </div>
</div>`,
    css: `.cd-chart-bar { padding: 1rem 0; }
.cd-chart-head { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.cd-label { font-weight: 500; }
.cd-value { font-size: 1.25rem; font-weight: 700; color: var(--cd-color-primary); }
.cd-bar-track { height: 12px; background: #e0e0e0; border-radius: 6px; overflow: hidden; }
.cd-bar-fill { height: 100%; background: var(--cd-color-primary); border-radius: 6px; transition: width 0.3s ease; }`,
  },
  {
    id: 'chart-line-container',
    name: 'Line Chart Container',
    category: 'chart-container',
    description: 'Container for line chart visualization',
    tags: ['chart', 'line', 'container'],
    artifactTypes: ['chart', 'dashboard'],
    skeleton: `<div class="cd-chart-line">
  <div class="cd-chart-svg-wrapper">
    <svg class="cd-chart-svg" viewBox="0 0 400 150" preserveAspectRatio="none">
      <polyline points="{{points}}" fill="none" stroke="var(--cd-color-primary)" stroke-width="3"/>
    </svg>
  </div>
  <div class="cd-legend">{{legend}}</div>
</div>`,
    css: `.cd-chart-line { padding: 1rem; }
.cd-chart-svg-wrapper { height: 150px; }
.cd-chart-svg { width: 100%; height: 100%; }
.cd-legend { margin-top: 0.5rem; font-size: 0.875rem; color: #666; }`,
  },
  {
    id: 'cover-split',
    name: 'Split Cover',
    category: 'cover',
    description: 'Split layout cover with image and text',
    tags: ['cover', 'split', 'layout'],
    artifactTypes: ['slides', 'poster', 'landing-page'],
    skeleton: `<section class="cd-cover-split">
  <div class="cd-cover-image">{{image}}</div>
  <div class="cd-cover-content">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>`,
    css: `.cd-cover-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 400px; }
.cd-cover-image { background: var(--cd-color-primary, #1976d2); display: flex; align-items: center; justify-content: center; }
.cd-cover-content { padding: 3rem; display: flex; flex-direction: column; justify-content: center; }
.cd-cover-content h1 { font-size: 2rem; margin-bottom: 1rem; }
.cd-cover-content p { font-size: 1.1rem; color: #666; }`,
  },
  {
    id: 'comparison-2col',
    name: 'Two Column Comparison',
    category: 'comparison',
    description: 'Side-by-side comparison layout',
    tags: ['comparison', 'two-column', 'vs'],
    artifactTypes: ['slides', 'infographic'],
    skeleton: `<section class="cd-comparison">
  <div class="cd-col">
    <h3>{{leftTitle}}</h3>
    <ul>{{leftItems}}</ul>
  </div>
  <div class="cd-vs">VS</div>
  <div class="cd-col">
    <h3>{{rightTitle}}</h3>
    <ul>{{rightItems}}</ul>
  </div>
</section>`,
    css: `.cd-comparison { display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; padding: 2rem; align-items: start; }
.cd-col h3 { font-size: 1.5rem; margin-bottom: 1rem; text-align: center; }
.cd-col ul { list-style: none; padding: 0; }
.cd-col li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
.cd-vs { font-size: 1.5rem; font-weight: 700; color: var(--cd-color-primary); }`,
  },
  {
    id: 'flow-step',
    name: 'Step Flow',
    category: 'flow',
    description: 'Horizontal step flow process',
    tags: ['flow', 'steps', 'process'],
    artifactTypes: ['slides', 'infographic', 'flowchart'],
    skeleton: `<section class="cd-flow">
  {{#each steps}}
  <div class="cd-step">
    <div class="cd-step-number">{{@index}}</div>
    <div class="cd-step-content">
      <h4>{{this.title}}</h4>
      <p>{{this.description}}</p>
    </div>
  </div>
  {{/each}}
</section>`,
    css: `.cd-flow { display: flex; justify-content: space-between; padding: 2rem; gap: 1rem; }
.cd-step { flex: 1; text-align: center; }
.cd-step-number { width: 40px; height: 40px; border-radius: 50%; background: var(--cd-color-primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 1rem; }
.cd-step-content h4 { font-size: 1.1rem; margin-bottom: 0.5rem; }
.cd-step-content p { font-size: 0.9rem; color: #666; }`,
  },
  {
    id: 'data-card',
    name: 'Data Card',
    category: 'data-card',
    description: 'Metric display card with value and label',
    tags: ['card', 'metric', 'data'],
    artifactTypes: ['chart', 'dashboard', 'slides'],
    skeleton: `<div class="cd-data-card">
  <div class="cd-value">{{value}}</div>
  <div class="cd-label">{{label}}</div>
  <div class="cd-change {{changeType}}">{{change}}</div>
</div>`,
    css: `.cd-data-card { padding: 1.5rem; border-radius: 8px; background: #fff; border: 1px solid #e0e0e0; text-align: center; }
.cd-value { font-size: 2.5rem; font-weight: 700; color: var(--cd-color-primary); }
.cd-label { font-size: 1rem; color: #666; margin: 0.5rem 0; }
.cd-change { font-size: 0.875rem; }
.cd-change.positive { color: #4caf50; }
.cd-change.negative { color: #f44336; }`,
  },
  {
    id: 'icon-check-circle',
    name: 'Check Circle Icon',
    category: 'icon',
    description: 'Success check circle icon',
    tags: ['icon', 'check', 'success'],
    artifactTypes: ['slides', 'infographic', 'landing-page'],
    skeleton: `<svg class="cd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <path d="M9 12l2 2 4-4" />
</svg>`,
    css: `.cd-icon { width: 24px; height: 24px; }`,
  },
  {
    id: 'decoration-dots',
    name: 'Dot Pattern Decoration',
    category: 'decoration',
    description: 'Decorative dot pattern background',
    tags: ['decoration', 'dots', 'pattern'],
    artifactTypes: ['slides', 'poster', 'landing-page'],
    skeleton: `<div class="cd-decoration-dots">{{content}}</div>`,
    css: `.cd-decoration-dots {
  background-image: radial-gradient(var(--cd-color-primary) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.1;
}`,
  },
  // ── Chart: Donut / Ring ──
  {
    id: 'chart-donut-container',
    name: 'Donut Chart',
    category: 'chart-container',
    description: 'SVG donut/ring chart with center label',
    tags: ['chart', 'donut', 'ring', 'pie'],
    artifactTypes: ['chart', 'dashboard', 'infographic'],
    skeleton: `<div class="cd-chart-donut">
  <svg viewBox="0 0 200 200" class="cd-donut-svg">
    <circle cx="100" cy="100" r="80" fill="none" stroke="var(--cd-chart-track, #e8eaed)" stroke-width="24"/>
    <circle cx="100" cy="100" r="80" fill="none" stroke="var(--cd-color-primary)" stroke-width="24"
      stroke-dasharray="{{filled}} {{remaining}}" stroke-dashoffset="126" stroke-linecap="round" transform="rotate(-90 100 100)"/>
  </svg>
  <div class="cd-donut-center">
    <span class="cd-donut-value">{{value}}</span>
    <span class="cd-donut-label">{{label}}</span>
  </div>
</div>`,
    css: `.cd-chart-donut { position: relative; width: 200px; height: 200px; }
.cd-donut-svg { width: 100%; height: 100%; }
.cd-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cd-donut-value { font-size: 2rem; font-weight: 800; color: var(--cd-color-primary); }
.cd-donut-label { font-size: 0.8rem; color: #6b7280; margin-top: 2px; }`,
  },
  // ── Chart: Horizontal Bar with Labels ──
  {
    id: 'chart-hbar-container',
    name: 'Horizontal Bar Chart',
    category: 'chart-container',
    description: 'Horizontal bar chart with category labels and value annotations',
    tags: ['chart', 'bar', 'horizontal', 'comparison'],
    artifactTypes: ['chart', 'dashboard', 'infographic'],
    skeleton: `<div class="cd-chart-hbar">
  {{#each items}}
  <div class="cd-hbar-row">
    <span class="cd-hbar-label">{{this.label}}</span>
    <div class="cd-hbar-track">
      <div class="cd-hbar-fill" style="width:{{this.pct}}%; background:{{this.color}}"></div>
    </div>
    <span class="cd-hbar-val">{{this.value}}</span>
  </div>
  {{/each}}
</div>`,
    css: `.cd-chart-hbar { display: flex; flex-direction: column; gap: 10px; }
.cd-hbar-row { display: grid; grid-template-columns: 100px 1fr 60px; align-items: center; gap: 10px; }
.cd-hbar-label { font-size: 0.85rem; font-weight: 500; color: var(--cd-color-text, #333); text-align: right; }
.cd-hbar-track { height: 20px; background: var(--cd-chart-track, #f0f0f0); border-radius: 10px; overflow: hidden; }
.cd-hbar-fill { height: 100%; border-radius: 10px; transition: width 0.4s ease; }
.cd-hbar-val { font-size: 0.85rem; font-weight: 700; color: var(--cd-color-primary); }`,
  },
  // ── Chart: Area Sparkline ──
  {
    id: 'chart-area-sparkline',
    name: 'Area Sparkline',
    category: 'chart-container',
    description: 'Compact area sparkline with gradient fill',
    tags: ['chart', 'area', 'sparkline', 'trend'],
    artifactTypes: ['chart', 'dashboard'],
    skeleton: `<div class="cd-sparkline">
  <svg viewBox="0 0 200 60" preserveAspectRatio="none" class="cd-sparkline-svg">
    <defs>
      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--cd-color-primary)" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="var(--cd-color-primary)" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <path d="M0,60 L{{areaPath}} L200,60 Z" fill="url(#sparkGrad)"/>
    <polyline points="{{linePoints}}" fill="none" stroke="var(--cd-color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>`,
    css: `.cd-sparkline { width: 100%; height: 60px; }
.cd-sparkline-svg { width: 100%; height: 100%; display: block; }`,
  },
  // ── Chart: Funnel ──
  {
    id: 'chart-funnel-container',
    name: 'Funnel Chart',
    category: 'chart-container',
    description: 'Conversion funnel with stepped bars',
    tags: ['chart', 'funnel', 'conversion', 'marketing'],
    artifactTypes: ['chart', 'dashboard', 'infographic'],
    skeleton: `<div class="cd-chart-funnel">
  {{#each stages}}
  <div class="cd-funnel-stage">
    <div class="cd-funnel-bar" style="width:{{this.pct}}%; background:{{this.color}}">
      <span class="cd-funnel-val">{{this.value}}</span>
    </div>
    <span class="cd-funnel-label">{{this.label}}</span>
  </div>
  {{/each}}
</div>`,
    css: `.cd-chart-funnel { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cd-funnel-stage { display: flex; align-items: center; gap: 12px; width: 100%; }
.cd-funnel-bar { height: 36px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; min-width: 48px; transition: width 0.4s ease; }
.cd-funnel-label { font-size: 0.82rem; color: #6b7280; white-space: nowrap; }`,
  },
  // ── Chart: Gauge / Meter ──
  {
    id: 'chart-gauge-container',
    name: 'Gauge Meter',
    category: 'chart-container',
    description: 'Semi-circular gauge meter for KPI display',
    tags: ['chart', 'gauge', 'meter', 'kpi'],
    artifactTypes: ['chart', 'dashboard'],
    skeleton: `<div class="cd-chart-gauge">
  <svg viewBox="0 0 200 120" class="cd-gauge-svg">
    <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="var(--cd-chart-track, #e8eaed)" stroke-width="16" stroke-linecap="round"/>
    <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="var(--cd-color-primary)" stroke-width="16" stroke-linecap="round"
      stroke-dasharray="{{filled}} 252" />
  </svg>
  <div class="cd-gauge-label">
    <span class="cd-gauge-value">{{value}}</span>
    <span class="cd-gauge-unit">{{unit}}</span>
  </div>
</div>`,
    css: `.cd-chart-gauge { position: relative; width: 200px; text-align: center; }
.cd-gauge-svg { width: 100%; }
.cd-gauge-label { margin-top: -30px; }
.cd-gauge-value { font-size: 1.8rem; font-weight: 800; color: var(--cd-color-primary); }
.cd-gauge-unit { display: block; font-size: 0.75rem; color: #6b7280; }`,
  },
  // ── Chart: Stacked Bar ──
  {
    id: 'chart-stacked-bar',
    name: 'Stacked Bar',
    category: 'chart-container',
    description: 'Stacked horizontal bar for composition breakdown',
    tags: ['chart', 'bar', 'stacked', 'composition'],
    artifactTypes: ['chart', 'dashboard', 'infographic'],
    skeleton: `<div class="cd-stacked-bar">
  <div class="cd-stacked-track">
    {{#each segments}}
    <div class="cd-stacked-seg" style="width:{{this.pct}}%; background:{{this.color}}" title="{{this.label}}: {{this.value}}"></div>
    {{/each}}
  </div>
  <div class="cd-stacked-legend">
    {{#each segments}}
    <span class="cd-legend-item"><i style="background:{{this.color}}"></i>{{this.label}}</span>
    {{/each}}
  </div>
</div>`,
    css: `.cd-stacked-bar { width: 100%; }
.cd-stacked-track { display: flex; height: 28px; border-radius: 14px; overflow: hidden; }
.cd-stacked-seg { transition: width 0.4s ease; }
.cd-stacked-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
.cd-legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #555; }
.cd-legend-item i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }`,
  },
  // ── Data Card: Trend ──
  {
    id: 'data-card-trend',
    name: 'Trend Data Card',
    category: 'data-card',
    description: 'Metric card with inline sparkline trend',
    tags: ['card', 'metric', 'trend', 'sparkline'],
    artifactTypes: ['chart', 'dashboard'],
    skeleton: `<div class="cd-trend-card">
  <div class="cd-trend-header">
    <span class="cd-trend-label">{{label}}</span>
    <span class="cd-trend-change {{changeType}}">{{change}}</span>
  </div>
  <div class="cd-trend-value">{{value}}</div>
  <svg viewBox="0 0 120 32" class="cd-trend-spark" preserveAspectRatio="none">
    <polyline points="{{sparkPoints}}" fill="none" stroke="var(--cd-color-primary)" stroke-width="2" stroke-linecap="round"/>
  </svg>
</div>`,
    css: `.cd-trend-card { padding: 1.25rem; border-radius: 12px; background: #fff; border: 1px solid #e5e7eb; }
.cd-trend-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.cd-trend-label { font-size: 0.8rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
.cd-trend-change { font-size: 0.78rem; font-weight: 600; }
.cd-trend-change.positive { color: #10b981; }
.cd-trend-change.negative { color: #ef4444; }
.cd-trend-value { font-size: 2rem; font-weight: 800; color: var(--cd-color-primary); line-height: 1.1; margin-bottom: 8px; }
.cd-trend-spark { width: 100%; height: 32px; display: block; }`,
  },
  {
    id: 'icon-arrow-right',
    name: 'Arrow Right Icon',
    category: 'icon',
    description: 'Right arrow icon',
    tags: ['icon', 'arrow', 'navigation'],
    artifactTypes: ['slides', 'landing-page', 'prototype'],
    skeleton: `<svg class="cd-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M5 12h14M12 5l7 7-7 7"/>
</svg>`,
    css: `.cd-icon-arrow { width: 24px; height: 24px; }`,
  },
  {
    id: 'icon-menu',
    name: 'Menu Icon',
    category: 'icon',
    description: 'Hamburger menu icon',
    tags: ['icon', 'menu', 'navigation'],
    artifactTypes: ['landing-page', 'prototype'],
    skeleton: `<svg class="cd-icon-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="3" y1="6" x2="21" y2="6"/>
  <line x1="3" y1="12" x2="21" y2="12"/>
  <line x1="3" y1="18" x2="21" y2="18"/>
</svg>`,
    css: `.cd-icon-menu { width: 24px; height: 24px; }`,
  },
  // ── Prototype: Top Navigation Bar ──
  {
    id: 'proto-nav-top',
    name: 'Top Navigation Bar',
    category: 'flow',
    description: 'Horizontal top navigation bar with logo and links',
    tags: ['navigation', 'top-nav', 'header', 'prototype'],
    artifactTypes: ['prototype', 'landing-page'],
    skeleton: `<header class="cd-top-nav">
  <div class="cd-top-nav__brand">{{appName}}</div>
  <nav class="cd-top-nav__links">{{#each links}}<a href="{{this.href}}">{{this.label}}</a>{{/each}}</nav>
  <div class="cd-top-nav__actions">{{cta}}</div>
</header>`,
    css: `.cd-top-nav { display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 56px; background: var(--cd-color-surface, #fff); border-bottom: 1px solid var(--cd-color-border, #e5e7eb); position: sticky; top: 0; z-index: 10; }
.cd-top-nav__brand { font-weight: 700; font-size: 1.1rem; }
.cd-top-nav__links { display: flex; gap: 24px; }
.cd-top-nav__links a { font-weight: 500; color: var(--cd-color-text, #333); transition: color 0.2s; }
.cd-top-nav__links a:hover { color: var(--cd-color-primary); }`,
  },
  // ── Prototype: Bottom Tab Bar ──
  {
    id: 'proto-nav-bottom-tab',
    name: 'Bottom Tab Bar',
    category: 'flow',
    description: 'Mobile bottom tab bar navigation',
    tags: ['navigation', 'bottom-tab', 'mobile', 'prototype'],
    artifactTypes: ['prototype'],
    skeleton: `<nav class="cd-bottom-tab">
  {{#each tabs}}<button class="cd-bottom-tab__item"><span class="cd-bottom-tab__icon">{{this.icon}}</span><span>{{this.label}}</span></button>{{/each}}
</nav>`,
    css: `.cd-bottom-tab { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; padding: 8px 0; background: var(--cd-color-surface, #fff); border-top: 1px solid var(--cd-color-border, #e5e7eb); box-shadow: 0 -2px 8px rgba(0,0,0,0.06); }
.cd-bottom-tab__item { display: flex; flex-direction: column; align-items: center; gap: 2px; border: none; background: none; font-size: 0.72rem; font-weight: 600; color: #6b7280; cursor: pointer; transition: color 0.2s; }
.cd-bottom-tab__item:hover, .cd-bottom-tab__item.active { color: var(--cd-color-primary); }
.cd-bottom-tab__icon { font-size: 1.2rem; }`,
  },
  // ── Prototype: Stats Panel ──
  {
    id: 'proto-stats-panel',
    name: 'Stats Panel',
    category: 'data-card',
    description: 'Grid of metric cards with change indicators',
    tags: ['stats', 'metrics', 'dashboard', 'prototype'],
    artifactTypes: ['prototype', 'dashboard'],
    skeleton: `<div class="cd-stats-panel">
  {{#each stats}}<div class="cd-stat-card"><div class="cd-stat-value">{{this.value}}</div><div class="cd-stat-label">{{this.label}}</div><div class="cd-stat-change {{this.changeType}}">{{this.change}}</div></div>{{/each}}
</div>`,
    css: `.cd-stats-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.cd-stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
.cd-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.cd-stat-value { font-size: 1.8rem; font-weight: 800; color: var(--cd-color-primary); }
.cd-stat-label { font-size: 0.82rem; color: #6b7280; margin-top: 4px; }
.cd-stat-change { font-size: 0.78rem; font-weight: 600; margin-top: 6px; }
.cd-stat-change.positive { color: #10b981; }
.cd-stat-change.negative { color: #ef4444; }`,
  },
  // ── Prototype: Timeline ──
  {
    id: 'proto-timeline',
    name: 'Timeline',
    category: 'flow',
    description: 'Vertical timeline with status indicators',
    tags: ['timeline', 'history', 'activity', 'prototype'],
    artifactTypes: ['prototype', 'infographic'],
    skeleton: `<div class="cd-timeline">
  {{#each items}}<div class="cd-timeline-item cd-timeline-item--{{this.status}}"><div class="cd-timeline-time">{{this.time}}</div><div class="cd-timeline-title">{{this.title}}</div><div class="cd-timeline-desc">{{this.description}}</div></div>{{/each}}
</div>`,
    css: `.cd-timeline { display: flex; flex-direction: column; padding-left: 20px; border-left: 2px solid #e5e7eb; }
.cd-timeline-item { position: relative; padding: 0 0 24px 20px; }
.cd-timeline-item::before { content: ''; position: absolute; left: -27px; top: 4px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #e5e7eb; background: #fff; }
.cd-timeline-item--done::before { background: var(--cd-color-primary); border-color: var(--cd-color-primary); }
.cd-timeline-item--active::before { background: #10b981; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
.cd-timeline-time { font-size: 0.78rem; color: #6b7280; font-weight: 600; }
.cd-timeline-title { font-weight: 600; margin-top: 2px; }
.cd-timeline-desc { font-size: 0.88rem; color: #6b7280; margin-top: 2px; }`,
  },
  // ── Prototype: Empty State ──
  {
    id: 'proto-empty-state',
    name: 'Empty State',
    category: 'data-card',
    description: 'Empty state placeholder with icon and action',
    tags: ['empty', 'placeholder', 'feedback', 'prototype'],
    artifactTypes: ['prototype'],
    skeleton: `<div class="cd-empty-state">
  <div class="cd-empty-icon">{{icon}}</div>
  <div class="cd-empty-title">{{title}}</div>
  <div class="cd-empty-desc">{{description}}</div>
  <button class="cd-empty-action">{{actionLabel}}</button>
</div>`,
    css: `.cd-empty-state { text-align: center; padding: 48px 24px; border: 2px dashed #e5e7eb; border-radius: 16px; }
.cd-empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
.cd-empty-title { font-weight: 700; font-size: 1.1rem; }
.cd-empty-desc { color: #6b7280; font-size: 0.9rem; margin-top: 4px; }
.cd-empty-action { margin-top: 16px; padding: 10px 20px; background: var(--cd-color-primary); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }`,
  },
  // ── Prototype: Progress Bar ──
  {
    id: 'proto-progress-bar',
    name: 'Progress Bar',
    category: 'data-card',
    description: 'Labeled progress bar with percentage',
    tags: ['progress', 'loading', 'feedback', 'prototype'],
    artifactTypes: ['prototype', 'dashboard'],
    skeleton: `<div class="cd-progress">
  <div class="cd-progress-header"><span>{{label}}</span><span>{{percentage}}%</span></div>
  <div class="cd-progress-track"><div class="cd-progress-fill" style="width:{{percentage}}%"></div></div>
</div>`,
    css: `.cd-progress { padding: 16px; }
.cd-progress-header { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px; }
.cd-progress-track { height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; }
.cd-progress-fill { height: 100%; background: var(--cd-color-primary); border-radius: 5px; transition: width 0.4s ease; }`,
  },
  // ── Prototype: File Upload Area ──
  {
    id: 'proto-file-upload',
    name: 'File Upload Area',
    category: 'data-card',
    description: 'Drag-and-drop file upload zone',
    tags: ['file', 'upload', 'form', 'prototype'],
    artifactTypes: ['prototype'],
    skeleton: `<div class="cd-file-upload">
  <div class="cd-file-upload-icon">📁</div>
  <div>{{placeholder}}</div>
  <div class="cd-file-upload-hint">点击或拖拽文件到此处</div>
</div>`,
    css: `.cd-file-upload { border: 2px dashed #d1d5db; border-radius: 16px; padding: 32px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.cd-file-upload:hover { border-color: var(--cd-color-primary); background: rgba(26,115,232,0.04); }
.cd-file-upload-icon { font-size: 1.5rem; margin-bottom: 6px; }
.cd-file-upload-hint { font-size: 0.78rem; color: #9ca3af; margin-top: 4px; }`,
  },
];

export class ComponentAssetRegistry {
  private assets = new Map<string, ComponentAsset>();

  register(asset: ComponentAsset): void {
    this.assets.set(asset.id, asset);
  }

  registerAll(assets: ComponentAsset[]): void {
    for (const a of assets) this.register(a);
  }

  get(id: string): ComponentAsset | undefined {
    return this.assets.get(id);
  }

  getByCategory(category: ComponentAsset['category']): ComponentAsset[] {
    const result: ComponentAsset[] = [];
    for (const asset of this.assets.values()) {
      if (asset.category === category) result.push(asset);
    }
    return result;
  }

  getByArtifactType(type: string): ComponentAsset[] {
    const result: ComponentAsset[] = [];
    for (const asset of this.assets.values()) {
      if (asset.artifactTypes.includes(type)) result.push(asset);
    }
    return result;
  }

  filter(options: {
    category?: ComponentAsset['category'];
    artifactType?: string;
    tags?: string[];
  }): ComponentAsset[] {
    let result = [...this.assets.values()];
    if (options.category) {
      result = result.filter(a => a.category === options.category);
    }
    if (options.artifactType) {
      result = result.filter(a => a.artifactTypes.includes(options.artifactType!));
    }
    if (options.tags && options.tags.length > 0) {
      result = result.filter(a => options.tags!.some(tag => a.tags.includes(tag)));
    }
    return result;
  }

  list(): ComponentAsset[] {
    return [...this.assets.values()];
  }

  updateAsset(id: string, updates: Partial<ComponentAsset>): boolean {
    const existing = this.assets.get(id);
    if (!existing) return false;
    this.assets.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    return true;
  }

  listCategories(): ComponentAsset['category'][] {
    const cats = new Set<ComponentAsset['category']>();
    for (const a of this.assets.values()) cats.add(a.category);
    return [...cats];
  }
}

export function createAssetRegistry(): ComponentAssetRegistry {
  const registry = new ComponentAssetRegistry();
  registry.registerAll(BUILT_IN_ASSETS);
  return registry;
}