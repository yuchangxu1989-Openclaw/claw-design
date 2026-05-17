import type { ThemePack } from '../types.js';
import { escapeHtml } from '../utils.js';
import {
  getAnimationTokenDeclarations,
  getAnimationUtilityCss,
  getSpacingResponsiveCss,
  getSpacingTokenDeclarations,
  getTypographyTokenDeclarations,
  getTypographyUtilityCss,
} from './shared/index.js';
import type {
  LandingAction,
  LandingColors,
  LandingConfig,
  LandingCtaSection,
  LandingFeatureItem,
  LandingFeaturesSection,
  LandingFooterSection,
  LandingPricingSection,
  LandingPricingTier,
  LandingStyle,
  LandingTestimonialItem,
  LandingTestimonialsSection,
} from './landing-types.js';

interface LandingPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  shadow: string;
  glow: string;
}

export function renderLandingHtml(config: LandingConfig, theme: ThemePack): string {
  const palette = resolvePalette(config, theme);
  const hero = getHeroSection(config);
  const features = getFeaturesSection(config);
  const pricing = getPricingSection(config);
  const testimonials = getTestimonialsSection(config);
  const cta = getCtaSection(config);
  const footer = getFooterSection(config);
  const hasSection = (type: string) => config.sections.some(section => section.type === type);

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${config.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)} — Landing Page</title>
  <style>
    :root {
      ${buildCssVariables(theme, config.style)}
      --landing-primary: ${palette.primary};
      --landing-secondary: ${palette.secondary};
      --landing-accent: ${palette.accent};
      --landing-background: ${palette.background};
      --landing-surface: ${palette.surface};
      --landing-text: ${palette.text};
      --landing-muted: ${palette.muted};
      --landing-border: ${palette.border};
      --landing-shadow: ${palette.shadow};
      --landing-glow: ${palette.glow};
      --landing-max-width: 1180px;
      --landing-radius: clamp(18px, 3vw, 28px);
    }
    * { box-sizing: border-box; }
    ${getTypographyUtilityCss({ preset: getLandingTypographyPreset(config.style) })}
    ${getSpacingResponsiveCss()}
    ${getAnimationUtilityCss()}
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--cd-font-body, 'Noto Sans SC', 'Noto Sans', sans-serif);
      color: var(--landing-text);
      background:
        radial-gradient(circle at top left, var(--landing-glow), transparent 32%),
        linear-gradient(180deg, var(--landing-background) 0%, color-mix(in srgb, var(--landing-background) 86%, var(--landing-surface) 14%) 100%);
      line-height: var(--cd-type-body-line-height);
    }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; display: block; }
    .landing-shell {
      width: min(100%, var(--landing-max-width));
      margin: 0 auto;
      padding: 0 var(--cd-page-margin-inline) var(--cd-section-gap);
    }
    .landing-nav {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: min(100%, var(--landing-max-width));
      margin: 0 auto;
      padding: 20px var(--cd-page-margin-inline);
      backdrop-filter: blur(18px);
      background: color-mix(in srgb, var(--landing-background) 78%, transparent 22%);
      border-bottom: 1px solid color-mix(in srgb, var(--landing-border) 60%, transparent 40%);
    }
    .landing-nav__brand {
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--landing-primary);
    }
    .landing-nav__links {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      color: var(--landing-muted);
      font-size: 0.95rem;
    }
    .landing-nav__links a:hover { color: var(--landing-text); }
    .landing-section { padding: var(--cd-section-gap) 0 0; }
    .landing-section + .landing-section { margin-top: 0; }
    .landing-card {
      background: color-mix(in srgb, var(--landing-surface) 88%, transparent 12%);
      border: 1px solid var(--landing-border);
      border-radius: var(--landing-radius);
      box-shadow: 0 28px 70px var(--landing-shadow);
      transition: transform var(--cd-duration-normal) var(--cd-ease-out), box-shadow var(--cd-duration-normal) var(--cd-ease-out), border-color var(--cd-duration-normal) var(--cd-ease-out);
    }
    .landing-hero {
      position: relative;
      overflow: hidden;
      padding: var(--cd-section-inset);
      display: grid;
      gap: var(--cd-stack-gap);
      isolation: isolate;
      animation: cd-fade-in var(--cd-duration-slow) var(--cd-ease-out) both;
    }
    .landing-hero::before,
    .landing-hero::after {
      content: '';
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
      z-index: 0;
    }
    .landing-hero::before {
      width: min(56vw, 440px);
      height: min(56vw, 440px);
      top: -120px;
      right: -100px;
      background: radial-gradient(circle, var(--landing-glow) 0%, transparent 72%);
    }
    .landing-hero::after {
      width: 220px;
      height: 220px;
      bottom: -90px;
      left: -60px;
      background: radial-gradient(circle, color-mix(in srgb, var(--landing-accent) 38%, transparent 62%) 0%, transparent 76%);
    }
    .landing-hero__content,
    .landing-hero__panel { position: relative; z-index: 1; }
    .landing-hero__eyebrow,
    .landing-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      width: fit-content;
      border-radius: 999px;
      border: 1px solid var(--landing-border);
      background: color-mix(in srgb, var(--landing-surface) 76%, transparent 24%);
      color: var(--landing-muted);
      font-family: var(--cd-font-mono, 'JetBrains Mono', monospace);
      font-size: var(--cd-type-label-size);
      font-weight: 700;
      letter-spacing: var(--cd-type-label-letter-spacing);
      text-transform: uppercase;
    }
    .landing-hero__title {
      margin: 18px 0 12px;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: var(--cd-type-h1-size);
      line-height: var(--cd-type-h1-line-height);
      letter-spacing: var(--cd-type-h1-letter-spacing);
      font-weight: var(--cd-type-h1-weight);
      text-wrap: balance;
    }
    .landing-hero__subtitle {
      margin: 0;
      max-width: var(--cd-reading-measure-wide);
      color: var(--landing-muted);
      font-size: var(--cd-type-lead-size);
      line-height: var(--cd-type-lead-line-height);
      letter-spacing: var(--cd-type-lead-letter-spacing);
    }
    .landing-hero__layout {
      display: grid;
      gap: var(--cd-stack-gap);
      align-items: end;
    }
    .landing-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--cd-cluster-gap);
      margin-top: var(--cd-space-xl);
    }
    .landing-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: var(--cd-button-padding-block) var(--cd-button-padding-inline);
      border-radius: 999px;
      border: 1px solid transparent;
      font-weight: 700;
      transition:
        transform var(--cd-duration-fast) var(--cd-ease-out),
        opacity var(--cd-duration-fast) var(--cd-ease-out),
        border-color var(--cd-duration-fast) var(--cd-ease-out),
        box-shadow var(--cd-duration-fast) var(--cd-ease-out);
    }
    .landing-button:hover { transform: translateY(var(--cd-hover-translate-y)); }
    .landing-button:active { transform: scale(var(--cd-press-scale)); }
    .landing-button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 var(--cd-focus-ring-size) var(--cd-focus-ring-color);
    }
    .landing-button--primary {
      background: linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-accent) 100%);
      color: #fff;
      box-shadow: 0 18px 40px color-mix(in srgb, var(--landing-primary) 28%, transparent 72%);
    }
    .landing-button--secondary {
      border-color: var(--landing-border);
      background: color-mix(in srgb, var(--landing-surface) 86%, transparent 14%);
      color: var(--landing-text);
    }
    .landing-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--cd-card-gap);
      margin-top: var(--cd-space-xl);
    }
    .landing-stat {
      padding: var(--cd-card-padding);
      border-radius: 20px;
      border: 1px solid var(--landing-border);
      background: color-mix(in srgb, var(--landing-surface) 84%, transparent 16%);
      animation: cd-scale-in var(--cd-duration-slow) var(--cd-ease-spring) both;
    }
    .landing-stat__value {
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 1.5rem;
      font-weight: 800;
    }
    .landing-stat__label {
      margin-top: 6px;
      color: var(--landing-muted);
      font-size: 0.92rem;
    }
    .landing-hero__panel {
      padding: var(--cd-card-padding);
      border-radius: 24px;
      border: 1px solid var(--landing-border);
      background: color-mix(in srgb, var(--landing-surface) 88%, transparent 12%);
      display: grid;
      gap: var(--cd-card-gap);
      align-content: start;
      min-height: 260px;
      animation: cd-scale-in var(--cd-duration-slow) var(--cd-ease-spring) both;
    }
    .landing-panel__label {
      color: var(--landing-muted);
      font-family: var(--cd-font-mono, 'JetBrains Mono', monospace);
      font-size: var(--cd-type-label-size);
      text-transform: uppercase;
      letter-spacing: var(--cd-type-label-letter-spacing);
    }
    .landing-panel__title {
      margin: 0;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: var(--cd-type-h3-size);
      line-height: var(--cd-type-h3-line-height);
    }
    .landing-panel__copy {
      margin: 0;
      color: var(--landing-muted);
    }
    .landing-panel__list {
      display: grid;
      gap: 12px;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .landing-panel__item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      color: var(--landing-text);
    }
    .landing-panel__item::before {
      content: '•';
      color: var(--landing-primary);
      font-weight: 900;
    }
    .landing-section-head {
      margin-bottom: var(--cd-space-xl);
      display: grid;
      gap: 10px;
    }
    .landing-section-title {
      margin: 0;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: var(--cd-type-h2-size);
      line-height: var(--cd-type-h2-line-height);
      letter-spacing: var(--cd-type-h2-letter-spacing);
    }
    .landing-section-subtitle {
      margin: 0;
      color: var(--landing-muted);
      max-width: var(--cd-reading-measure);
      font-size: var(--cd-type-body-size);
      line-height: var(--cd-type-body-line-height);
    }
    .landing-feature-grid,
    .landing-testimonial-grid,
    .landing-pricing-grid,
    .landing-footer-grid {
      display: grid;
      gap: var(--cd-card-gap);
    }
    .landing-feature-card,
    .landing-testimonial-card,
    .landing-pricing-card,
    .landing-footer-card {
      padding: var(--cd-card-padding);
      border-radius: 24px;
      border: 1px solid var(--landing-border);
      background: color-mix(in srgb, var(--landing-surface) 88%, transparent 12%);
      transition: transform var(--cd-duration-fast) var(--cd-ease-out), box-shadow var(--cd-duration-fast) var(--cd-ease-out);
    }
    .landing-feature-card:hover,
    .landing-testimonial-card:hover,
    .landing-pricing-card:hover,
    .landing-footer-card:hover {
      transform: translateY(var(--cd-hover-translate-y));
    }
    .landing-feature-card__icon {
      font-size: 1.6rem;
      margin-bottom: 10px;
    }
    .landing-feature-card__title,
    .landing-pricing-card__title,
    .landing-testimonial-card__name,
    .landing-footer-card__title {
      margin: 0;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 1.08rem;
    }
    .landing-feature-card__desc,
    .landing-pricing-card__desc,
    .landing-testimonial-card__role,
    .landing-footer-note,
    .landing-footer-links a {
      color: var(--landing-muted);
    }
    .landing-pricing-card {
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 16px;
      align-content: start;
    }
    .landing-pricing-card--highlighted {
      border-color: color-mix(in srgb, var(--landing-primary) 48%, var(--landing-border) 52%);
      box-shadow: 0 28px 74px color-mix(in srgb, var(--landing-primary) 18%, transparent 82%);
      transform: translateY(-4px);
    }
    .landing-pricing-card__badge {
      position: absolute;
      top: 18px;
      right: 18px;
      padding: 7px 12px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--landing-primary) 15%, transparent 85%);
      color: var(--landing-primary);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .landing-price {
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 2.4rem;
      line-height: 1;
    }
    .landing-pricing-list,
    .landing-footer-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    .landing-pricing-list li {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .landing-pricing-list li::before {
      content: '✓';
      color: var(--landing-primary);
      font-weight: 800;
    }
    .landing-testimonial-card__quote {
      margin: 0 0 18px;
      font-size: 1rem;
    }
    .landing-cta {
      padding: var(--cd-section-inset);
      display: grid;
      gap: var(--cd-card-gap);
      background: linear-gradient(135deg, color-mix(in srgb, var(--landing-primary) 18%, var(--landing-surface) 82%) 0%, color-mix(in srgb, var(--landing-accent) 20%, var(--landing-surface) 80%) 100%);
      animation: cd-fade-in var(--cd-duration-slow) var(--cd-ease-out) both;
    }
    .landing-footer {
      padding: 24px;
    }
    .landing-footer-top {
      display: grid;
      gap: 18px;
      margin-bottom: 18px;
    }
    .landing-footer-brand {
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .landing-footer-bottom {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 18px;
      border-top: 1px solid var(--landing-border);
      color: var(--landing-muted);
      font-size: 0.9rem;
    }

    .landing--startup .landing-hero__title { max-width: 10ch; }
    .landing--startup .landing-hero__panel {
      background: linear-gradient(180deg, color-mix(in srgb, var(--landing-surface) 88%, transparent 12%) 0%, color-mix(in srgb, var(--landing-primary) 7%, var(--landing-surface) 93%) 100%);
    }
    .landing--corporate .landing-card,
    .landing--corporate .landing-hero__panel,
    .landing--corporate .landing-feature-card,
    .landing--corporate .landing-pricing-card,
    .landing--corporate .landing-testimonial-card,
    .landing--corporate .landing-footer-card {
      border-radius: 18px;
    }
    .landing--corporate .landing-hero__title { letter-spacing: -0.035em; }
    .landing--creative .landing-hero::before {
      background: radial-gradient(circle, color-mix(in srgb, var(--landing-accent) 28%, transparent 72%) 0%, transparent 68%);
    }
    .landing--creative .landing-feature-card:nth-child(odd),
    .landing--creative .landing-testimonial-card:nth-child(even) {
      transform: rotate(-1deg);
    }
    .landing--creative .landing-feature-card:nth-child(even),
    .landing--creative .landing-pricing-card:nth-child(odd) {
      transform: rotate(1deg);
    }
    .landing--saas .landing-hero__panel,
    .landing--saas .landing-pricing-card--highlighted {
      background: linear-gradient(180deg, color-mix(in srgb, var(--landing-primary) 9%, var(--landing-surface) 91%) 0%, color-mix(in srgb, var(--landing-accent) 6%, var(--landing-surface) 94%) 100%);
    }
    .landing--saas .landing-stat__value { color: var(--landing-primary); }

    .landing--portfolio .landing-hero__title {
      font-style: italic;
      letter-spacing: -0.03em;
    }
    .landing--portfolio .landing-hero__panel {
      background: transparent;
      border: 2px solid var(--landing-border);
    }
    .landing--portfolio .landing-feature-card {
      border: none;
      background: transparent;
      border-bottom: 1px solid var(--landing-border);
      border-radius: 0;
      padding: 28px 0;
    }
    .landing--portfolio .landing-feature-card__icon {
      font-size: 2rem;
    }
    .landing--portfolio .landing-cta {
      background: transparent;
      border: 2px solid var(--landing-border);
    }
    .landing--portfolio .landing-pricing-card,
    .landing--portfolio .landing-testimonial-card {
      border: none;
      background: color-mix(in srgb, var(--landing-surface) 60%, transparent 40%);
      backdrop-filter: blur(12px);
    }

    .landing--event .landing-hero {
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--landing-primary) 12%, var(--landing-surface) 88%) 0%, color-mix(in srgb, var(--landing-accent) 8%, var(--landing-surface) 92%) 100%);
    }
    .landing--event .landing-hero::before {
      background: radial-gradient(circle, color-mix(in srgb, var(--landing-primary) 30%, transparent 70%) 0%, transparent 60%);
      animation: event-pulse 5s ease-in-out infinite;
    }
    @keyframes event-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    .landing--event .landing-hero__title {
      text-transform: uppercase;
      max-width: 10ch;
    }
    .landing--event .landing-feature-card {
      text-align: center;
    }
    .landing--event .landing-feature-card__icon {
      font-size: 2.4rem;
    }
    .landing--event .landing-cta {
      text-align: center;
      background: linear-gradient(135deg, color-mix(in srgb, var(--landing-primary) 22%, var(--landing-surface) 78%) 0%, color-mix(in srgb, var(--landing-accent) 18%, var(--landing-surface) 82%) 100%);
    }
    .landing--event .landing-pricing-card {
      text-align: center;
    }

    .theme--dark {
      color-scheme: dark;
    }
    .theme--light {
      color-scheme: light;
    }

    @media (min-width: 860px) {
      .landing-hero__layout {
        grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.72fr);
      }
      .landing-feature-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .landing-pricing-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .landing-testimonial-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .landing-footer-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .landing-footer-top { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr); align-items: start; }
    }

    @media (max-width: 767px) {
      .landing-nav {
        position: static;
        padding-bottom: 12px;
      }
      .landing-nav__links {
        display: none;
      }
      .landing-shell {
        padding: 0 16px 40px;
      }
      .landing-hero,
      .landing-cta,
      .landing-footer {
        padding-left: 20px;
        padding-right: 20px;
      }
      .landing-pricing-card--highlighted {
        transform: none;
      }
      .landing--creative .landing-feature-card,
      .landing--creative .landing-testimonial-card,
      .landing--creative .landing-pricing-card {
        transform: none;
      }
      .landing-footer-bottom {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <nav class="landing-nav">
    <div class="landing-nav__brand">${escapeHtml(footer.brand ?? config.title)}</div>
    <div class="landing-nav__links">
      ${hasSection('features') ? '<a href="#features">卖点</a>' : ''}
      ${hasSection('pricing') ? '<a href="#pricing">定价</a>' : ''}
      ${hasSection('testimonials') ? '<a href="#testimonials">口碑</a>' : ''}
      ${hasSection('cta') ? '<a href="#cta">开始</a>' : ''}
    </div>
  </nav>

  <main class="landing-shell landing--${config.style} theme--${config.theme} cd-cjk-mix">
    <section class="landing-section" id="hero" data-section="hero">
      <div class="landing-card landing-hero">
        <div class="landing-hero__layout">
          <div class="landing-hero__content">
            ${hero.eyebrow?.trim() ? `<div class="landing-hero__eyebrow">${escapeHtml(hero.eyebrow)}</div>` : ''}
            <h1 class="landing-hero__title">${escapeHtml(hero.title ?? config.title)}</h1>
            <p class="landing-hero__subtitle">${escapeHtml(hero.subtitle ?? config.subtitle)}</p>
            <div class="landing-actions">
              ${renderAction(hero.primaryAction, 'primary')}
              ${renderAction(hero.secondaryAction, 'secondary')}
            </div>
            ${hero.stats && hero.stats.length > 0 ? renderStats(hero.stats) : ''}
          </div>
          <aside class="landing-hero__panel" aria-label="hero-highlight-panel">
            <div class="landing-panel__label">Launch Snapshot</div>
            <h2 class="landing-panel__title">${escapeHtml(features.title ?? '把价值讲清楚，再把转化做顺。')}</h2>
            <p class="landing-panel__copy">${escapeHtml(features.subtitle ?? config.subtitle)}</p>
            <ul class="landing-panel__list">
              ${features.items.slice(0, 3).map(item => `<li class="landing-panel__item">${escapeHtml(item.title)} · ${escapeHtml(item.description)}</li>`).join('')}
            </ul>
          </aside>
        </div>
      </div>
    </section>

    ${features ? `
    <section class="landing-section" id="features" data-section="features">
      <div class="landing-section-head">
        <div class="landing-kicker">Core Value</div>
        <h2 class="landing-section-title">${escapeHtml(features.title ?? '为什么这页能把产品讲透')}</h2>
        <p class="landing-section-subtitle">${escapeHtml(features.subtitle ?? '从价值、体验和落地动作三层展开，让读者一眼看懂产品。')}</p>
      </div>
      <div class="landing-feature-grid">
        ${features.items.map(renderFeatureCard).join('')}
      </div>
    </section>` : ''}

    ${pricing ? `
    <section class="landing-section" id="pricing" data-section="pricing">
      <div class="landing-section-head">
        <div class="landing-kicker">Pricing</div>
        <h2 class="landing-section-title">${escapeHtml(pricing.title ?? '定价清晰，升级路径自然')}</h2>
        <p class="landing-section-subtitle">${escapeHtml(pricing.subtitle ?? '把选择成本压低，让不同阶段的用户都能找到入口。')}</p>
      </div>
      <div class="landing-pricing-grid">
        ${pricing.tiers.map(renderPricingCard).join('')}
      </div>
    </section>` : ''}

    ${testimonials ? `
    <section class="landing-section" id="testimonials" data-section="testimonials">
      <div class="landing-section-head">
        <div class="landing-kicker">Testimonials</div>
        <h2 class="landing-section-title">${escapeHtml(testimonials.title ?? '真实口碑比口号更有说服力')}</h2>
        <p class="landing-section-subtitle">${escapeHtml(testimonials.subtitle ?? '用用户视角把产品价值再确认一遍。')}</p>
      </div>
      <div class="landing-testimonial-grid">
        ${testimonials.items.map(renderTestimonialCard).join('')}
      </div>
    </section>` : ''}

    ${cta ? `
    <section class="landing-section" id="cta" data-section="cta">
      <div class="landing-card landing-cta">
        <div class="landing-kicker">Call To Action</div>
        <h2 class="landing-section-title">${escapeHtml(cta.title ?? '现在就把兴趣变成动作')}</h2>
        <p class="landing-section-subtitle">${escapeHtml(cta.subtitle ?? '把页面的最后一步变成最简单的一步。')}</p>
        <div class="landing-actions">
          ${renderAction(cta.primaryAction, 'primary')}
        </div>
      </div>
    </section>` : ''}

    <footer class="landing-section" id="footer" data-section="footer">
      <div class="landing-card landing-footer">
        <div class="landing-footer-top">
          <div>
            <div class="landing-footer-brand">${escapeHtml(footer.brand ?? config.title)}</div>
            <p class="landing-footer-note">${escapeHtml(footer.note ?? '© 2026')}</p>
          </div>
          <div class="landing-footer-grid">
            ${renderFooterGroups(footer)}
          </div>
        </div>
        <div class="landing-footer-bottom">
          <span>${escapeHtml(config.title)}</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  </main>
</body>
</html>`;
}

function getHeroSection(config: LandingConfig) {
  return config.sections.find(section => section.type === 'hero') as LandingConfig['sections'][number] & { type: 'hero' };
}

function getFeaturesSection(config: LandingConfig): LandingFeaturesSection {
  const section = config.sections.find(item => item.type === 'features') as LandingFeaturesSection | undefined;
  return section ?? {
    type: 'features',
    title: '核心卖点',
    subtitle: config.subtitle,
    items: [
      { title: '价值聚焦', description: '首屏就说清产品为什么存在。', icon: '✦' },
      { title: '结构完整', description: '卖点、价格、口碑和行动入口全部到位。', icon: '▣' },
      { title: '易于迭代', description: '纯 HTML/CSS 页面，后续改版成本低。', icon: '↗' },
    ],
  };
}

function getPricingSection(config: LandingConfig): LandingPricingSection | null {
  return config.sections.find(section => section.type === 'pricing') as LandingPricingSection | null;
}

function getTestimonialsSection(config: LandingConfig): LandingTestimonialsSection | null {
  return config.sections.find(section => section.type === 'testimonials') as LandingTestimonialsSection | null;
}

function getCtaSection(config: LandingConfig): LandingCtaSection | null {
  return config.sections.find(section => section.type === 'cta') as LandingCtaSection | null;
}

function getFooterSection(config: LandingConfig): LandingFooterSection {
  const section = config.sections.find(item => item.type === 'footer') as LandingFooterSection | undefined;
  return section ?? { type: 'footer', brand: config.title, note: config.subtitle, links: [] };
}

function renderAction(action: LandingAction | undefined, variant: 'primary' | 'secondary'): string {
  if (!action?.label) return '';
  const href = escapeHtml(action.href?.trim() || '#cta');
  return `<a class="landing-button landing-button--${variant}" href="${href}">${escapeHtml(action.label)}</a>`;
}

function renderStats(stats: Array<{ label: string; value: string }>): string {
  return `<div class="landing-stats">${stats.map(stat => `
    <div class="landing-stat">
      <div class="landing-stat__value">${escapeHtml(stat.value)}</div>
      <div class="landing-stat__label">${escapeHtml(stat.label)}</div>
    </div>`).join('')}
  </div>`;
}

function renderFeatureCard(item: LandingFeatureItem): string {
  return `<article class="landing-feature-card">
    <div class="landing-feature-card__icon">${escapeHtml(item.icon ?? '✦')}</div>
    <h3 class="landing-feature-card__title">${escapeHtml(item.title)}</h3>
    <p class="landing-feature-card__desc">${escapeHtml(item.description)}</p>
  </article>`;
}

function renderPricingCard(tier: LandingPricingTier): string {
  return `<article class="landing-pricing-card${tier.highlighted ? ' landing-pricing-card--highlighted' : ''}">
    ${tier.badge ? `<div class="landing-pricing-card__badge">${escapeHtml(tier.badge)}</div>` : ''}
    <div>
      <h3 class="landing-pricing-card__title">${escapeHtml(tier.name)}</h3>
      ${tier.description ? `<p class="landing-pricing-card__desc">${escapeHtml(tier.description)}</p>` : ''}
    </div>
    <div class="landing-price">${escapeHtml(tier.price)}</div>
    <ul class="landing-pricing-list">
      ${tier.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('')}
    </ul>
    ${renderAction({ label: tier.ctaLabel ?? '选择方案', href: '#cta' }, tier.highlighted ? 'primary' : 'secondary')}
  </article>`;
}

function renderTestimonialCard(item: LandingTestimonialItem): string {
  return `<article class="landing-testimonial-card">
    <p class="landing-testimonial-card__quote">“${escapeHtml(item.quote)}”</p>
    <h3 class="landing-testimonial-card__name">${escapeHtml(item.name)}</h3>
    ${item.role ? `<div class="landing-testimonial-card__role">${escapeHtml(item.role)}</div>` : ''}
  </article>`;
}

function renderFooterGroups(footer: LandingFooterSection): string {
  const groups = footer.links ?? [];
  if (groups.length === 0) {
    return `<div class="landing-footer-card">
      <h3 class="landing-footer-card__title">Next Step</h3>
      <ul class="landing-footer-links">
        <li><a href="#hero">回到首屏</a></li>
        <li><a href="#cta">立即开始</a></li>
      </ul>
    </div>`;
  }

  return groups.map(group => `<section class="landing-footer-card">
    <h3 class="landing-footer-card__title">${escapeHtml(group.title)}</h3>
    <ul class="landing-footer-links">
      ${group.links.map(link => `<li><a href="${escapeHtml(link.href?.trim() || '#hero')}">${escapeHtml(link.label)}</a></li>`).join('')}
    </ul>
  </section>`).join('');
}

function resolvePalette(config: LandingConfig, theme: ThemePack): LandingPalette {
  const defaults = getDefaultPalette(config.style, config.theme);
  const overrides = config.colors ?? {};
  const primary = normalizeColor(overrides.primary) ?? defaults.primary ?? theme.colorPrimary;
  const secondary = normalizeColor(overrides.secondary) ?? defaults.secondary;
  const accent = normalizeColor(overrides.accent) ?? defaults.accent;
  const background = normalizeColor(overrides.background) ?? defaults.background ?? theme.colorBg;
  const surface = normalizeColor(overrides.surface) ?? defaults.surface;
  const text = normalizeColor(overrides.text) ?? defaults.text;
  const muted = normalizeColor(overrides.muted) ?? defaults.muted;

  return {
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    muted,
    border: config.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
    shadow: config.theme === 'dark' ? 'rgba(2,6,23,0.42)' : 'rgba(15,23,42,0.12)',
    glow: config.theme === 'dark'
      ? `color-mix(in srgb, ${primary} 22%, transparent 78%)`
      : `color-mix(in srgb, ${accent} 18%, transparent 82%)`,
  };
}

function getDefaultPalette(style: LandingStyle, themeMode: 'light' | 'dark'): LandingPalette {
  const lightMap: Record<LandingStyle, LandingPalette> = {
    startup: {
      primary: '#2563eb', secondary: '#0f172a', accent: '#7c3aed', background: '#f8fbff', surface: '#ffffff', text: '#0f172a', muted: '#475569', border: '', shadow: '', glow: '',
    },
    corporate: {
      primary: '#0f766e', secondary: '#164e63', accent: '#0284c7', background: '#f5f7fb', surface: '#ffffff', text: '#0f172a', muted: '#526072', border: '', shadow: '', glow: '',
    },
    creative: {
      primary: '#db2777', secondary: '#4f46e5', accent: '#f97316', background: '#fff8fb', surface: '#ffffff', text: '#1f1833', muted: '#6b5f7c', border: '', shadow: '', glow: '',
    },
    saas: {
      primary: '#4f46e5', secondary: '#0f172a', accent: '#06b6d4', background: '#f4f7ff', surface: '#ffffff', text: '#111827', muted: '#4b5563', border: '', shadow: '', glow: '',
    },
    portfolio: {
      primary: '#0f172a', secondary: '#64748b', accent: '#a855f7', background: '#fafaf9', surface: '#ffffff', text: '#0f172a', muted: '#78716c', border: '', shadow: '', glow: '',
    },
    event: {
      primary: '#dc2626', secondary: '#ea580c', accent: '#f59e0b', background: '#fffbeb', surface: '#ffffff', text: '#1c1917', muted: '#57534e', border: '', shadow: '', glow: '',
    },
  };

  const darkMap: Record<LandingStyle, LandingPalette> = {
    startup: {
      primary: '#60a5fa', secondary: '#c4b5fd', accent: '#a78bfa', background: '#071120', surface: '#0f172a', text: '#f8fafc', muted: '#94a3b8', border: '', shadow: '', glow: '',
    },
    corporate: {
      primary: '#5eead4', secondary: '#7dd3fc', accent: '#38bdf8', background: '#07131a', surface: '#0d1b2a', text: '#ecfeff', muted: '#9fb5c8', border: '', shadow: '', glow: '',
    },
    creative: {
      primary: '#f472b6', secondary: '#c084fc', accent: '#fb923c', background: '#190c1f', surface: '#24102d', text: '#fff7fb', muted: '#d8bfd8', border: '', shadow: '', glow: '',
    },
    saas: {
      primary: '#818cf8', secondary: '#67e8f9', accent: '#22d3ee', background: '#0b1120', surface: '#111827', text: '#f9fafb', muted: '#9ca3af', border: '', shadow: '', glow: '',
    },
    portfolio: {
      primary: '#e2e8f0', secondary: '#94a3b8', accent: '#c084fc', background: '#0c0a09', surface: '#1c1917', text: '#fafaf9', muted: '#a8a29e', border: '', shadow: '', glow: '',
    },
    event: {
      primary: '#f87171', secondary: '#fb923c', accent: '#fbbf24', background: '#1c1008', surface: '#292018', text: '#fef3c7', muted: '#d6d3d1', border: '', shadow: '', glow: '',
    },
  };

  return themeMode === 'dark' ? darkMap[style] : lightMap[style];
}

function buildCssVariables(theme: ThemePack, style: LandingStyle): string {
  const preset = getLandingTypographyPreset(style);
  return [
    Object.entries(theme.cssVariables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n      '),
    getTypographyTokenDeclarations({
      preset,
      headingFamily: theme.fontHeading,
      bodyFamily: theme.fontBody,
    }),
    getSpacingTokenDeclarations(),
    getAnimationTokenDeclarations(),
  ].join('\n      ');
}

function getLandingTypographyPreset(style: LandingStyle): 'serif' | 'sans' | 'mono' {
  switch (style) {
    case 'corporate':
      return 'serif';
    case 'saas':
      return 'mono';
    default:
      return 'sans';
  }
}

function normalizeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

