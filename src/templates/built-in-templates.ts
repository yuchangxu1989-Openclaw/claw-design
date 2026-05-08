// Built-in Templates — default template collection for Claw Design

import type { TemplateMeta } from './template-registry.js';

export const BUILT_IN_TEMPLATES: TemplateMeta[] = [
  {
    id: 'presentation-basic',
    name: 'Basic Presentation',
    description: 'Title + content slides for general presentations',
    category: 'presentation',
    tags: ['slides', 'basic', 'general'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'subtitle', type: 'text', required: false, default: '' },
      { name: 'slides', type: 'list', required: true },
      { name: 'theme', type: 'text', required: false, default: 'default' },
    ],
    skeleton: `<div class="cd-presentation">
  <section class="cd-slide cd-slide--title">
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide">
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation { font-family: system-ui, sans-serif; }
  .cd-slide { padding: 2rem; min-height: 400px; }
  .cd-slide--title { text-align: center; display: flex; flex-direction: column; justify-content: center; }
  .cd-slide h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .subtitle { color: #666; font-size: 1.2rem; }
</style>`,
  },
  {
    id: 'chart-dashboard',
    name: 'Chart Dashboard',
    description: 'Data visualization dashboard with multiple chart slots',
    category: 'dashboard',
    tags: ['chart', 'data', 'dashboard', 'visualization'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'charts', type: 'list', required: true },
      { name: 'summary', type: 'text', required: false, default: '' },
      { name: 'config', type: 'chart', required: false },
    ],
    skeleton: `<div class="cd-dashboard">
  <header><h1>{{title}}</h1></header>
  <div class="cd-grid">
    {{#each charts}}
    <div class="cd-card">
      <h3>{{this.label}}</h3>
      <div class="cd-chart-area" data-type="{{this.type}}"></div>
    </div>
    {{/each}}
  </div>
  <footer>{{summary}}</footer>
</div>
<style>
  .cd-dashboard { font-family: system-ui, sans-serif; padding: 1.5rem; }
  .cd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
  .cd-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; }
  .cd-chart-area { min-height: 200px; background: #f9f9f9; border-radius: 4px; }
</style>`,
  },
  {
    id: 'architecture-diagram',
    name: 'Architecture Diagram',
    description: 'System architecture diagram with layers and components',
    category: 'diagram',
    tags: ['architecture', 'diagram', 'system', 'technical'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'layers', type: 'list', required: true },
      { name: 'description', type: 'text', required: false, default: '' },
      { name: 'legend', type: 'image', required: false },
    ],
    skeleton: `<div class="cd-arch">
  <h1>{{title}}</h1>
  <p class="desc">{{description}}</p>
  <div class="cd-layers">
    {{#each layers}}
    <div class="cd-layer">
      <div class="cd-layer-label">{{this.name}}</div>
      <div class="cd-components">
        {{#each this.components}}
        <div class="cd-component">{{this}}</div>
        {{/each}}
      </div>
    </div>
    {{/each}}
  </div>
</div>
<style>
  .cd-arch { font-family: system-ui, sans-serif; padding: 2rem; }
  .cd-layers { display: flex; flex-direction: column; gap: 0.5rem; }
  .cd-layer { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f0f4ff; border-radius: 8px; }
  .cd-layer-label { font-weight: 600; min-width: 120px; }
  .cd-components { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .cd-component { padding: 0.5rem 1rem; background: #fff; border: 1px solid #c0d0f0; border-radius: 4px; }
</style>`,
  },
  {
    id: 'poster-event',
    name: 'Event Poster',
    description: 'Event promotion poster with hero image and details',
    category: 'poster',
    tags: ['poster', 'event', 'promotion', 'marketing'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'date', type: 'text', required: true },
      { name: 'location', type: 'text', required: false, default: 'TBD' },
      { name: 'description', type: 'text', required: false, default: '' },
      { name: 'heroImage', type: 'image', required: false },
    ],
    skeleton: `<div class="cd-poster">
  <div class="cd-hero" style="background-image: url('{{heroImage}}')">
    <div class="cd-overlay">
      <h1>{{title}}</h1>
      <div class="cd-meta">
        <span class="cd-date">{{date}}</span>
        <span class="cd-location">{{location}}</span>
      </div>
      <p class="cd-desc">{{description}}</p>
    </div>
  </div>
</div>
<style>
  .cd-poster { font-family: system-ui, sans-serif; }
  .cd-hero { min-height: 600px; background-size: cover; background-position: center; display: flex; align-items: flex-end; }
  .cd-overlay { background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: #fff; padding: 3rem 2rem 2rem; width: 100%; }
  .cd-poster h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .cd-meta { display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 1.1rem; }
  .cd-desc { opacity: 0.9; line-height: 1.6; }
</style>`,
  },
  {
    id: 'chart-dashboard-grid2x2',
    name: 'Dashboard 2×2 Grid',
    description: 'Four-panel dashboard layout for KPI overview',
    category: 'dashboard',
    tags: ['chart', 'dashboard', 'grid', '2x2', 'kpi'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'panels', type: 'list', required: true },
    ],
    skeleton: `<div class="cd-dash-grid2x2">
  <header class="cd-dash-header"><h1>{{title}}</h1></header>
  <div class="cd-dash-panels">
    {{#each panels}}
    <div class="cd-dash-panel">
      <h3 class="cd-panel-title">{{this.label}}</h3>
      <div class="cd-panel-value">{{this.value}}</div>
      <div class="cd-panel-chart" data-type="{{this.chartType}}"></div>
      <div class="cd-panel-footer">{{this.footer}}</div>
    </div>
    {{/each}}
  </div>
</div>
<style>
  .cd-dash-grid2x2 { font-family: 'Inter', system-ui, sans-serif; padding: 2rem; background: #f8fafc; }
  .cd-dash-header h1 { font-size: 1.5rem; color: #1e293b; margin-bottom: 1.5rem; }
  .cd-dash-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .cd-dash-panel { background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .cd-panel-title { font-size: 0.78rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px; font-weight: 600; }
  .cd-panel-value { font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
  .cd-panel-chart { height: 80px; border-radius: 6px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
  .cd-panel-footer { font-size: 0.75rem; color: #94a3b8; margin-top: 8px; }
</style>`,
  },
  {
    id: 'chart-dashboard-sidebar',
    name: 'Dashboard Sidebar + Main',
    description: 'Sidebar metrics with main chart area',
    category: 'dashboard',
    tags: ['chart', 'dashboard', 'sidebar', 'analytics'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'metrics', type: 'list', required: true },
      { name: 'mainChart', type: 'chart', required: false },
      { name: 'summary', type: 'text', required: false, default: '' },
    ],
    skeleton: `<div class="cd-dash-sidebar-layout">
  <aside class="cd-dash-side">
    <h2>{{title}}</h2>
    {{#each metrics}}
    <div class="cd-side-metric">
      <span class="cd-side-label">{{this.label}}</span>
      <span class="cd-side-value">{{this.value}}</span>
      <span class="cd-side-change {{this.trend}}">{{this.change}}</span>
    </div>
    {{/each}}
  </aside>
  <main class="cd-dash-main">
    <div class="cd-main-chart" data-type="{{mainChart.type}}"></div>
    <p class="cd-main-summary">{{summary}}</p>
  </main>
</div>
<style>
  .cd-dash-sidebar-layout { display: grid; grid-template-columns: 280px 1fr; min-height: 480px; font-family: 'Inter', system-ui, sans-serif; }
  .cd-dash-side { background: #1e293b; color: #f1f5f9; padding: 2rem 1.5rem; }
  .cd-dash-side h2 { font-size: 1.1rem; margin-bottom: 2rem; font-weight: 600; }
  .cd-side-metric { padding: 1rem 0; border-bottom: 1px solid #334155; }
  .cd-side-label { display: block; font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .cd-side-value { font-size: 1.5rem; font-weight: 700; }
  .cd-side-change { font-size: 0.75rem; margin-left: 8px; }
  .cd-side-change.up { color: #34d399; }
  .cd-side-change.down { color: #f87171; }
  .cd-dash-main { padding: 2rem; background: #f8fafc; }
  .cd-main-chart { min-height: 320px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
  .cd-main-summary { font-size: 0.85rem; color: #64748b; margin-top: 1rem; }
</style>`,
  },
  {
    id: 'chart-dashboard-fullscreen',
    name: 'Fullscreen Single Chart',
    description: 'Full-viewport single chart with title overlay',
    category: 'dashboard',
    tags: ['chart', 'dashboard', 'fullscreen', 'single', 'hero'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'subtitle', type: 'text', required: false, default: '' },
      { name: 'chartData', type: 'chart', required: true },
    ],
    skeleton: `<div class="cd-dash-full">
  <div class="cd-full-overlay">
    <h1>{{title}}</h1>
    <p>{{subtitle}}</p>
  </div>
  <div class="cd-full-chart" data-type="{{chartData.type}}"></div>
</div>
<style>
  .cd-dash-full { position: relative; min-height: 100vh; background: #0f172a; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; }
  .cd-full-overlay { padding: 2.5rem 3rem 1rem; color: #f1f5f9; }
  .cd-full-overlay h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem; }
  .cd-full-overlay p { font-size: 1rem; color: #94a3b8; margin: 0; }
  .cd-full-chart { flex: 1; margin: 1rem 2rem 2rem; background: #1e293b; border-radius: 16px; border: 1px solid #334155; min-height: 400px; }
</style>`,
  },
  {
    id: 'infographic',
    name: 'Infographic',
    description: 'Visual information graphic with sections and data points',
    category: 'infographic',
    tags: ['infographic', 'data', 'visual', 'information'],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'sections', type: 'list', required: true },
      { name: 'headerImage', type: 'image', required: false },
      { name: 'stats', type: 'chart', required: false },
    ],
    skeleton: `<div class="cd-infographic">
  <header>
    <h1>{{title}}</h1>
  </header>
  {{#each sections}}
  <section class="cd-info-section">
    <div class="cd-info-number">{{@index}}</div>
    <div class="cd-info-content">
      <h2>{{this.heading}}</h2>
      <p>{{this.text}}</p>
    </div>
  </section>
  {{/each}}
</div>
<style>
  .cd-infographic { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
  .cd-infographic header { text-align: center; margin-bottom: 2rem; }
  .cd-info-section { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1.5rem; border-left: 4px solid #4a90d9; }
  .cd-info-number { font-size: 2rem; font-weight: 700; color: #4a90d9; min-width: 40px; }
  .cd-info-content h2 { margin: 0 0 0.5rem; }
  .cd-info-content p { margin: 0; color: #555; line-height: 1.6; }
</style>`,
  },
];
