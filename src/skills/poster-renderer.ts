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
import type { PosterConfig, PosterSize, PosterSizeSpec, PosterStyle } from './poster-types.js';

const SIZE_SPECS: Record<PosterSize, PosterSizeSpec> = {
  A4: { width: '210mm', height: '297mm', label: 'A4' },
  social: { width: '1080px', height: '1080px', label: '社交媒体' },
  banner: { width: '1200px', height: '628px', label: '横幅' },
  square: { width: '800px', height: '800px', label: '方图' },
  portrait: { width: '1080px', height: '1920px', label: '竖版' },
  landscape: { width: '1920px', height: '1080px', label: '横版' },
};

interface PosterPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  shadow: string;
  highlight: string;
}

export function renderPosterHtml(config: PosterConfig, theme: ThemePack): string {
  const size = SIZE_SPECS[config.size];
  const palette = resolvePalette(config, theme);
  const bodyParagraphs = splitBody(config.body);
  const subtitle = config.subtitle?.trim() || `${config.title}，敬请关注。`;
  const backgroundImage = config.backgroundImage?.trim() ?? '';
  const styleClass = `poster--${config.style}`;
  const themeClass = `theme--${config.theme}`;
  const imageStyle = backgroundImage
    ? `--poster-bg-image: url('${escapeCssUrl(backgroundImage)}');`
    : '--poster-bg-image: none;';

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${config.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)} — Poster</title>
  <style>
    :root {
      ${buildCssVariables(theme, config.style)}
      --poster-width: ${size.width};
      --poster-height: ${size.height};
      --poster-primary: ${palette.primary};
      --poster-secondary: ${palette.secondary};
      --poster-accent: ${palette.accent};
      --poster-background: ${palette.background};
      --poster-surface: ${palette.surface};
      --poster-text: ${palette.text};
      --poster-muted: ${palette.mutedText};
      --poster-border: ${palette.border};
      --poster-shadow: ${palette.shadow};
      --poster-highlight: ${palette.highlight};
      ${imageStyle}
    }
    * { box-sizing: border-box; }
    ${getTypographyUtilityCss({ preset: getPosterTypographyPreset(config.style) })}
    ${getSpacingResponsiveCss()}
    ${getAnimationUtilityCss()}
    html, body { margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: var(--cd-page-margin);
      background: radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 36%), #0b1020;
      font-family: var(--cd-font-body, 'Noto Sans SC', 'Noto Sans', sans-serif);
      color: var(--poster-text);
    }
    .poster-frame {
      width: min(100%, var(--poster-width));
      display: flex;
      justify-content: center;
      padding-inline: var(--cd-page-margin-inline);
    }
    .poster {
      position: relative;
      width: var(--poster-width);
      height: var(--poster-height);
      overflow: hidden;
      border-radius: clamp(24px, 3vw, 36px);
      background:
        linear-gradient(135deg, rgba(255,255,255,0.08), transparent 42%),
        linear-gradient(160deg, var(--poster-background) 0%, var(--poster-surface) 100%);
      color: var(--poster-text);
      box-shadow: 0 32px 80px var(--poster-shadow);
      isolation: isolate;
      border: 1px solid var(--poster-border);
      transition: transform var(--cd-duration-normal) var(--cd-ease-out), box-shadow var(--cd-duration-normal) var(--cd-ease-out);
    }
    .poster::before,
    .poster::after {
      content: '';
      position: absolute;
      inset: auto;
      pointer-events: none;
      z-index: 0;
    }
    .poster::before {
      width: 58%;
      aspect-ratio: 1;
      top: -18%;
      right: -16%;
      border-radius: 999px;
      background: radial-gradient(circle, var(--poster-highlight) 0%, transparent 72%);
      filter: blur(8px);
      opacity: 0.88;
    }
    .poster::after {
      width: 42%;
      aspect-ratio: 1;
      bottom: -12%;
      left: -10%;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
      opacity: 0.8;
    }
    .poster__image {
      position: absolute;
      inset: 0;
      background-image: var(--poster-bg-image);
      background-size: cover;
      background-position: center;
      opacity: 0.16;
      mix-blend-mode: screen;
      z-index: 0;
    }
    .poster__grid {
      position: absolute;
      inset: 0;
      z-index: 0;
      opacity: 0.16;
      background-image:
        linear-gradient(var(--poster-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--poster-border) 1px, transparent 1px);
      background-size: clamp(24px, 5vw, 42px) clamp(24px, 5vw, 42px);
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.4), transparent 88%);
    }
    .poster__content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--cd-section-inset);
      gap: clamp(18px, 2.5vw, 30px);
      animation: cd-fade-in var(--cd-duration-slow) var(--cd-ease-out) both;
    }
    .poster__top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .poster__badge,
    .poster__chip,
    .poster__stat {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      border: 1px solid var(--poster-border);
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(14px);
    }
    .poster__badge {
      padding: 10px 16px;
      letter-spacing: 0.24em;
      font-size: 0.74rem;
      font-weight: 800;
    }
    .poster__chip {
      padding: 8px 14px;
      font-size: 0.76rem;
      text-transform: uppercase;
      color: var(--poster-muted);
    }
    .poster__hero {
      display: flex;
      flex-direction: column;
      gap: clamp(12px, 2vw, 18px);
      max-width: 78%;
      animation: cd-slide-up var(--cd-duration-slow) var(--cd-ease-spring) both;
    }
    .poster__title {
      margin: 0;
      font-family: var(--cd-font-heading, 'Inter', sans-serif);
      font-size: var(--cd-type-h1-size);
      line-height: var(--cd-type-h1-line-height);
      letter-spacing: var(--cd-type-h1-letter-spacing);
      font-weight: var(--cd-type-h1-weight);
      text-wrap: balance;
    }
    .poster__subtitle {
      margin: 0;
      color: var(--poster-muted);
      font-size: var(--cd-type-lead-size);
      line-height: var(--cd-type-lead-line-height);
      letter-spacing: var(--cd-type-lead-letter-spacing);
      max-width: var(--cd-reading-measure);
    }
    .poster__main {
      margin-top: auto;
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.8fr);
      gap: clamp(18px, 2.6vw, 28px);
      align-items: end;
    }
    .poster__story {
      display: flex;
      flex-direction: column;
      gap: var(--cd-paragraph-gap-tight);
    }
    .poster__story p {
      margin: 0;
      color: var(--poster-text);
      font-size: var(--cd-type-body-size);
      line-height: var(--cd-type-body-line-height);
      letter-spacing: var(--cd-type-body-letter-spacing);
    }
    .poster__panel {
      padding: var(--cd-card-padding);
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
      border: 1px solid var(--poster-border);
      display: flex;
      flex-direction: column;
      gap: var(--cd-card-gap);
      min-height: 180px;
      animation: cd-scale-in var(--cd-duration-slow) var(--cd-ease-spring) both;
      transition: transform var(--cd-duration-fast) var(--cd-ease-out), box-shadow var(--cd-duration-fast) var(--cd-ease-out), border-color var(--cd-duration-fast) var(--cd-ease-out);
    }
    .poster__panel:hover {
      transform: translateY(var(--cd-hover-translate-y));
    }
    .poster__panel-title {
      font-family: var(--cd-font-mono, 'JetBrains Mono', monospace);
      font-size: var(--cd-type-label-size);
      line-height: var(--cd-type-label-line-height);
      text-transform: uppercase;
      letter-spacing: var(--cd-type-label-letter-spacing);
      color: var(--poster-muted);
    }
    .poster__panel-copy {
      font-size: var(--cd-type-body-size);
      line-height: var(--cd-type-body-line-height);
      color: var(--poster-text);
    }
    .poster__stats {
      display: flex;
      flex-wrap: wrap;
      gap: var(--cd-cluster-gap);
      margin-top: auto;
    }
    .poster__stat {
      padding: 10px 14px;
      font-family: var(--cd-font-mono, 'JetBrains Mono', monospace);
      font-size: var(--cd-type-caption-size);
      line-height: var(--cd-type-caption-line-height);
      color: var(--poster-text);
    }
    .poster__footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 18px;
    }
    .poster__footer-copy {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 70%;
    }
    .poster__eyebrow {
      text-transform: uppercase;
      letter-spacing: var(--cd-type-label-letter-spacing);
      font-family: var(--cd-font-mono, 'JetBrains Mono', monospace);
      font-size: var(--cd-type-label-size);
      color: var(--poster-muted);
    }
    .poster__cta {
      padding: var(--cd-button-padding-block) var(--cd-button-padding-inline);
      border-radius: 18px;
      background: linear-gradient(135deg, var(--poster-primary) 0%, var(--poster-accent) 100%);
      color: #ffffff;
      font-weight: 700;
      letter-spacing: 0.02em;
      min-width: 180px;
      text-align: center;
      box-shadow: 0 18px 32px rgba(0,0,0,0.18);
      transition: transform var(--cd-duration-fast) var(--cd-ease-bounce), box-shadow var(--cd-duration-fast) var(--cd-ease-out);
    }
    .poster__cta:hover {
      transform: translateY(var(--cd-hover-translate-y));
    }
    .poster__cta:active {
      transform: scale(var(--cd-press-scale));
    }
    .poster--modern .poster__title {
      text-transform: uppercase;
      max-width: 10ch;
    }
    .poster--modern .poster__content {
      background: linear-gradient(180deg, rgba(7,12,25,0.08), transparent 30%);
    }
    .poster--modern .poster__panel {
      transform: translateY(10px);
    }
    .poster--classic {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.1)),
        linear-gradient(160deg, var(--poster-background) 0%, var(--poster-surface) 100%);
    }
    .poster--classic .poster__content {
      border: 1px solid rgba(255,255,255,0.08);
      margin: clamp(14px, 2vw, 20px);
      height: calc(100% - clamp(28px, 4vw, 40px));
      padding: clamp(24px, 4vw, 44px);
    }
    .poster--classic .poster__title {
      letter-spacing: -0.02em;
      font-size: clamp(2.4rem, 5.4vw, 4.6rem);
      max-width: 12ch;
    }
    .poster--classic .poster__badge,
    .poster--classic .poster__chip,
    .poster--classic .poster__stat {
      background: rgba(20, 24, 32, 0.18);
    }
    .poster--classic .poster__panel {
      background: rgba(12, 17, 26, 0.28);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .poster--minimal::before,
    .poster--minimal::after,
    .poster--minimal .poster__grid {
      opacity: 0.1;
    }
    .poster--minimal .poster__content {
      gap: 20px;
    }
    .poster--minimal .poster__title {
      font-size: clamp(2.1rem, 5vw, 4rem);
      max-width: 12ch;
    }
    .poster--minimal .poster__panel,
    .poster--minimal .poster__badge,
    .poster--minimal .poster__chip,
    .poster--minimal .poster__stat {
      background: rgba(255,255,255,0.04);
      backdrop-filter: none;
      box-shadow: none;
    }
    .poster--minimal .poster__main {
      grid-template-columns: 1fr;
    }
    .poster--bold {
      background:
        linear-gradient(145deg, rgba(255,255,255,0.08), transparent 28%),
        linear-gradient(125deg, var(--poster-primary) 0%, var(--poster-background) 55%, var(--poster-surface) 100%);
    }
    .poster--bold .poster__title {
      font-size: clamp(2.8rem, 7vw, 5.6rem);
      max-width: 9ch;
    }
    .poster--bold .poster__subtitle {
      font-size: clamp(1rem, 2vw, 1.4rem);
      color: rgba(255,255,255,0.82);
    }
    .poster--bold .poster__panel {
      background: rgba(10, 14, 24, 0.28);
      transform: rotate(-2deg);
      transform-origin: bottom right;
    }
    .poster--bold .poster__cta {
      transform: translateY(-4px);
    }
    /* ── Industry: Tech Launch ── */
    .poster--tech-launch {
      background:
        linear-gradient(160deg, #0a0e27 0%, #0d1b3e 40%, #1a0a2e 100%);
    }
    .poster--tech-launch::before {
      background: radial-gradient(circle, rgba(0,200,255,0.35) 0%, transparent 68%);
    }
    .poster--tech-launch::after {
      background: radial-gradient(circle, rgba(120,80,255,0.25) 0%, transparent 70%);
    }
    .poster--tech-launch .poster__grid {
      opacity: 0.25;
      background-image:
        linear-gradient(rgba(0,200,255,0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,200,255,0.15) 1px, transparent 1px);
    }
    .poster--tech-launch .poster__title {
      text-transform: uppercase;
      max-width: 10ch;
      background: linear-gradient(135deg, #00c8ff, #7b5cff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .poster--tech-launch .poster__badge {
      background: rgba(0,200,255,0.12);
      border-color: rgba(0,200,255,0.3);
      color: #00c8ff;
    }
    .poster--tech-launch .poster__panel {
      background: rgba(0,200,255,0.06);
      border-color: rgba(0,200,255,0.2);
      backdrop-filter: blur(20px);
    }
    .poster--tech-launch .poster__cta {
      background: linear-gradient(135deg, #00c8ff 0%, #7b5cff 100%);
      box-shadow: 0 18px 40px rgba(0,200,255,0.25);
    }
    /* ── Industry: Music Festival ── */
    .poster--music-fest {
      background:
        linear-gradient(145deg, #1a0533 0%, #2d0a4e 35%, #0a1628 100%);
    }
    .poster--music-fest::before {
      background: radial-gradient(circle, rgba(255,0,128,0.4) 0%, transparent 65%);
      animation: pulse-glow 4s ease-in-out infinite;
    }
    .poster--music-fest::after {
      background: radial-gradient(circle, rgba(255,200,0,0.3) 0%, transparent 70%);
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.08); }
    }
    .poster--music-fest .poster__title {
      font-size: clamp(3rem, 8vw, 6.5rem);
      line-height: 0.88;
      text-transform: uppercase;
      max-width: 8ch;
      background: linear-gradient(135deg, #ff0080, #ff8c00, #ff0080);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 6s ease infinite;
    }
    @keyframes gradient-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .poster--music-fest .poster__badge {
      background: rgba(255,0,128,0.15);
      border-color: rgba(255,0,128,0.4);
      color: #ff0080;
    }
    .poster--music-fest .poster__panel {
      background: rgba(255,0,128,0.08);
      border-color: rgba(255,0,128,0.25);
      backdrop-filter: blur(16px);
      transform: rotate(-1.5deg);
    }
    .poster--music-fest .poster__cta {
      background: linear-gradient(135deg, #ff0080 0%, #ff8c00 100%);
      box-shadow: 0 18px 40px rgba(255,0,128,0.3);
    }
    /* ── Industry: Education Lecture ── */
    .poster--edu-lecture {
      background:
        linear-gradient(180deg, #faf8f5 0%, #f0ebe3 100%);
    }
    .poster--edu-lecture::before {
      background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%);
    }
    .poster--edu-lecture::after {
      background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%);
    }
    .poster--edu-lecture .poster__grid {
      opacity: 0.06;
      background-image:
        linear-gradient(rgba(37,99,235,0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37,99,235,0.2) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    .poster--edu-lecture .poster__title {
      color: #1e293b;
      letter-spacing: -0.02em;
      max-width: 14ch;
      font-size: clamp(2.2rem, 5vw, 4.2rem);
    }
    .poster--edu-lecture .poster__subtitle,
    .poster--edu-lecture .poster__story p { color: #475569; }
    .poster--edu-lecture .poster__badge {
      background: rgba(37,99,235,0.08);
      border-color: rgba(37,99,235,0.2);
      color: #2563eb;
    }
    .poster--edu-lecture .poster__panel {
      background: #fff;
      border-color: rgba(37,99,235,0.12);
      box-shadow: 0 8px 32px rgba(15,23,42,0.06);
    }
    .poster--edu-lecture .poster__cta {
      background: linear-gradient(135deg, #2563eb 0%, #10b981 100%);
    }
    .poster--edu-lecture .poster__eyebrow { color: #64748b; }
    .poster--edu-lecture .poster__chip { color: #64748b; }
    .poster--edu-lecture .poster__panel-title { color: #64748b; }
    .poster--edu-lecture .poster__panel-copy { color: #334155; }
    .poster--edu-lecture .poster__stat { color: #334155; border-color: rgba(37,99,235,0.15); background: rgba(37,99,235,0.04); }
    /* ── Industry: E-commerce ── */
    .poster--ecommerce {
      background:
        linear-gradient(145deg, #ff2d2d 0%, #ff6b35 30%, #1a0a0a 70%);
    }
    .poster--ecommerce::before {
      background: radial-gradient(circle, rgba(255,215,0,0.45) 0%, transparent 60%);
    }
    .poster--ecommerce::after {
      background: radial-gradient(circle, rgba(255,45,45,0.3) 0%, transparent 65%);
    }
    .poster--ecommerce .poster__title {
      font-size: clamp(3.2rem, 8vw, 6rem);
      text-transform: uppercase;
      max-width: 8ch;
      color: #ffd700;
      text-shadow: 0 4px 24px rgba(255,215,0,0.3);
    }
    .poster--ecommerce .poster__badge {
      background: rgba(255,215,0,0.2);
      border-color: rgba(255,215,0,0.5);
      color: #ffd700;
      font-size: 0.9rem;
    }
    .poster--ecommerce .poster__panel {
      background: rgba(255,215,0,0.08);
      border-color: rgba(255,215,0,0.25);
      backdrop-filter: blur(14px);
    }
    .poster--ecommerce .poster__cta {
      background: linear-gradient(135deg, #ffd700 0%, #ff6b35 100%);
      color: #1a0a0a;
      font-size: 1.1rem;
      box-shadow: 0 18px 40px rgba(255,215,0,0.3);
    }
    /* ── Industry: Recruitment ── */
    .poster--recruitment {
      background:
        linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
    }
    .poster--recruitment::before {
      background: radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 68%);
    }
    .poster--recruitment::after {
      background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%);
    }
    .poster--recruitment .poster__title {
      max-width: 12ch;
      font-size: clamp(2.4rem, 6vw, 4.8rem);
    }
    .poster--recruitment .poster__badge {
      background: rgba(16,185,129,0.12);
      border-color: rgba(16,185,129,0.3);
      color: #10b981;
    }
    .poster--recruitment .poster__panel {
      background: rgba(16,185,129,0.06);
      border-color: rgba(16,185,129,0.2);
      backdrop-filter: blur(18px);
    }
    .poster--recruitment .poster__cta {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      box-shadow: 0 18px 40px rgba(16,185,129,0.25);
    }
    /* ── Industry: Wedding ── */
    .poster--wedding {
      background:
        linear-gradient(180deg, #fdf2f8 0%, #fce7f3 40%, #fff1f2 100%);
    }
    .poster--wedding::before {
      background: radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 70%);
    }
    .poster--wedding::after {
      background: radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%);
    }
    .poster--wedding .poster__grid { opacity: 0; }
    .poster--wedding .poster__title {
      color: #831843;
      font-size: clamp(2.6rem, 6vw, 5rem);
      letter-spacing: -0.02em;
      max-width: 12ch;
      font-style: italic;
    }
    .poster--wedding .poster__subtitle,
    .poster--wedding .poster__story p { color: #9d174d; }
    .poster--wedding .poster__badge {
      background: rgba(244,114,182,0.1);
      border-color: rgba(244,114,182,0.3);
      color: #ec4899;
    }
    .poster--wedding .poster__panel {
      background: rgba(255,255,255,0.7);
      border-color: rgba(244,114,182,0.2);
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(244,114,182,0.08);
    }
    .poster--wedding .poster__cta {
      background: linear-gradient(135deg, #ec4899 0%, #f59e0b 100%);
    }
    .poster--wedding .poster__eyebrow { color: #be185d; }
    .poster--wedding .poster__chip { color: #be185d; }
    .poster--wedding .poster__panel-title { color: #be185d; }
    .poster--wedding .poster__panel-copy { color: #831843; }
    .poster--wedding .poster__stat { color: #831843; border-color: rgba(244,114,182,0.2); background: rgba(244,114,182,0.06); }
    .poster.theme--light {
      color-scheme: light;
    }
    .poster.theme--dark {
      color-scheme: dark;
    }
    .poster[data-size="banner"] .poster__content {
      padding: clamp(22px, 4vw, 34px);
      gap: 14px;
    }
    .poster[data-size="banner"] .poster__hero {
      max-width: 62%;
    }
    .poster[data-size="banner"] .poster__title {
      font-size: clamp(2rem, 5vw, 4rem);
    }
    .poster[data-size="banner"] .poster__main {
      grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.75fr);
      align-items: center;
    }
    .poster[data-size="social"] .poster__hero,
    .poster[data-size="square"] .poster__hero {
      max-width: 100%;
    }
    .poster[data-size="social"] .poster__main,
    .poster[data-size="square"] .poster__main {
      grid-template-columns: 1fr;
    }
    .poster[data-size="social"] .poster__footer-copy,
    .poster[data-size="square"] .poster__footer-copy {
      max-width: 100%;
    }
    .poster[data-size="A4"] .poster__content {
      padding: 22mm 18mm 18mm;
    }
    .poster[data-size="portrait"] .poster__content {
      padding: clamp(36px, 5vw, 64px) clamp(24px, 4vw, 48px);
      gap: clamp(24px, 3vw, 40px);
    }
    .poster[data-size="portrait"] .poster__hero { max-width: 100%; }
    .poster[data-size="portrait"] .poster__title {
      font-size: clamp(3rem, 7vw, 5.5rem);
    }
    .poster[data-size="portrait"] .poster__main {
      grid-template-columns: 1fr;
    }
    .poster[data-size="portrait"] .poster__footer-copy { max-width: 100%; }
    .poster[data-size="landscape"] .poster__content {
      padding: clamp(22px, 3vw, 40px) clamp(28px, 4vw, 56px);
      gap: clamp(14px, 2vw, 24px);
    }
    .poster[data-size="landscape"] .poster__hero { max-width: 65%; }
    .poster[data-size="landscape"] .poster__title {
      font-size: clamp(2.2rem, 5vw, 4.2rem);
    }
    .poster[data-size="landscape"] .poster__main {
      grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.7fr);
      align-items: center;
    }
    @media (max-width: 920px) {
      body { padding: calc(var(--cd-page-margin) * 0.75); }
      .poster-frame { width: 100%; }
      .poster {
        width: min(100%, var(--poster-width));
        height: auto;
        min-height: 80vh;
      }
      .poster__main,
      .poster__footer {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: flex-start;
      }
      .poster__footer-copy,
      .poster__hero {
        max-width: 100%;
      }
      .poster__cta {
        min-width: 0;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="poster-frame">
    <article class="poster ${styleClass} ${themeClass} cd-cjk-mix" data-size="${config.size}" data-style="${config.style}">
      <div class="poster__image" aria-hidden="true"></div>
      <div class="poster__grid" aria-hidden="true"></div>
      <div class="poster__content">
        <div class="poster__top">
        </div>
        <header class="poster__hero">
          <p class="poster__eyebrow">活动宣传</p>
          <h1 class="poster__title">${escapeHtml(config.title)}</h1>
          <p class="poster__subtitle">${escapeHtml(subtitle)}</p>
        </header>
        <section class="poster__main">
          <div class="poster__story">
            ${bodyParagraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('\n            ')}
          </div>
          <aside class="poster__panel">
            <div class="poster__panel-title">核心信息</div>
            <div class="poster__panel-copy">${escapeHtml(buildCallout(config))}</div>
            <div class="poster__stats">
              <div class="poster__stat">时间 · 即将公布</div>
              <div class="poster__stat">地点 · 线上线下同步</div>
              <div class="poster__stat">名额 · 限量开放</div>
            </div>
          </aside>
        </section>
        <footer class="poster__footer">
          <div class="poster__footer-copy">
            <div class="poster__eyebrow">了解更多</div>
            <div class="poster__subtitle">${escapeHtml(buildFooterNote(config))}</div>
          </div>
          <div class="poster__cta">${escapeHtml(buildCta(config))}</div>
        </footer>
      </div>
    </article>
  </div>
</body>
</html>`;
}

function resolvePalette(config: PosterConfig, theme: ThemePack): PosterPalette {
  const fallbackPrimary = config.colors?.primary ?? theme.colorPrimary ?? '#3b82f6';
  const isDark = config.theme === 'dark';

  const industryPalettes: Partial<Record<PosterStyle, Partial<PosterPalette>>> = {
    'tech-launch': { primary: '#00c8ff', secondary: '#7b5cff', accent: '#00ffa3', background: '#0a0e27', surface: '#0d1b3e', text: '#e8f4ff' },
    'music-fest': { primary: '#ff0080', secondary: '#ff8c00', accent: '#ffd700', background: '#1a0533', surface: '#2d0a4e', text: '#fff0f6' },
    'edu-lecture': { primary: '#2563eb', secondary: '#10b981', accent: '#7c3aed', background: '#faf8f5', surface: '#ffffff', text: '#1e293b' },
    ecommerce: { primary: '#ff2d2d', secondary: '#ffd700', accent: '#ff6b35', background: '#1a0a0a', surface: '#2a1010', text: '#fff5e6' },
    recruitment: { primary: '#10b981', secondary: '#3b82f6', accent: '#06b6d4', background: '#0f172a', surface: '#1e3a5f', text: '#ecfdf5' },
    wedding: { primary: '#ec4899', secondary: '#f59e0b', accent: '#f472b6', background: '#fdf2f8', surface: '#ffffff', text: '#831843' },
  };

  const industry = industryPalettes[config.style];

  return {
    primary: config.colors?.primary ?? industry?.primary ?? fallbackPrimary,
    secondary: config.colors?.secondary ?? industry?.secondary ?? (isDark ? '#8b5cf6' : '#0f172a'),
    accent: config.colors?.accent ?? industry?.accent ?? (isDark ? '#22d3ee' : '#7c3aed'),
    background: config.colors?.background ?? industry?.background ?? (isDark ? '#08111f' : '#f7f4ee'),
    surface: config.colors?.surface ?? industry?.surface ?? (isDark ? '#13233a' : '#fffdf8'),
    text: config.colors?.text ?? industry?.text ?? (isDark ? '#f7fafc' : '#111827'),
    mutedText: isDark ? 'rgba(241,245,249,0.78)' : 'rgba(17,24,39,0.72)',
    border: isDark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.12)',
    shadow: isDark ? 'rgba(2,6,23,0.55)' : 'rgba(15,23,42,0.18)',
    highlight: isDark ? 'rgba(34,211,238,0.28)' : 'rgba(124,58,237,0.18)',
  };
}

function splitBody(body: string): string[] {
  const normalized = body
    .split(/\n+/)
    .map(part => part.trim())
    .filter(Boolean);

  if (normalized.length > 0) return normalized.slice(0, 3);

  const compact = body.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return ['活动详情即将公布。'];
  }

  const segments = compact.match(/[^。！？.!?]+[。！？.!?]?/g) ?? [compact];
  return segments.map(segment => segment.trim()).filter(Boolean).slice(0, 3);
}

function buildCallout(config: PosterConfig): string {
  const firstLine = splitBody(config.body)[0] ?? config.body;
  if (config.style === 'classic') return `精选信息：${firstLine}`;
  if (config.style === 'minimal') return `聚焦核心：${firstLine}`;
  if (config.style === 'bold') return `醒目呈现：${firstLine}`;
  return `重点呈现：${firstLine}`;
}

function buildFooterNote(config: PosterConfig): string {
  if (config.style === 'tech-launch') return '扫码关注，获取最新发布动态';
  if (config.style === 'music-fest') return '扫码购票，锁定最佳席位';
  if (config.style === 'edu-lecture') return '扫码报名，预留学习席位';
  if (config.style === 'ecommerce') return '扫码领券，开启限时优惠';
  if (config.style === 'recruitment') return '扫码投递，开启职业新篇章';
  if (config.style === 'wedding') return '期待您的莅临，共同见证幸福时刻';
  return '扫码了解详情，获取更多精彩内容';
}

function buildCta(config: PosterConfig): string {
  if (config.style === 'classic') return '立即预约';
  if (config.style === 'minimal') return '查看详情';
  if (config.style === 'bold') return '立即参与';
  return '立即报名';
}

function buildCssVariables(theme: ThemePack, style: PosterStyle): string {
  const preset = getPosterTypographyPreset(style);
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

function getPosterTypographyPreset(style: PosterStyle): 'serif' | 'sans' | 'mono' {
  switch (style) {
    case 'classic':
    case 'edu-lecture':
    case 'wedding':
      return 'serif';
    case 'tech-launch':
      return 'mono';
    default:
      return 'sans';
  }
}


function escapeCssUrl(value: string): string {
  return value.replace(/'/g, "\\'");
}
