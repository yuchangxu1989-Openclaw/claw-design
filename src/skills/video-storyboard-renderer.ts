import type { StoryboardConfig } from './video-editor-types.js';

export interface StoryboardScene {
  id: number;
  timeRange: string;
  title: string;
  description: string;
  visualNotes: string;
  audioNotes: string;
}

/**
 * Parse a text prompt into storyboard scenes.
 * Extracts duration, product name, and generates scene breakdowns.
 */
export function parseStoryboardFromPrompt(config: StoryboardConfig): StoryboardScene[] {
  const { prompt, duration = 15, scenes: sceneCount } = config;
  const totalScenes = sceneCount ?? Math.max(3, Math.ceil(duration / 5));
  const secondsPerScene = Math.round(duration / totalScenes);

  const productName = extractProductName(prompt);
  const templates = buildSceneTemplates(productName, prompt);

  const result: StoryboardScene[] = [];
  for (let i = 0; i < totalScenes; i++) {
    const startSec = i * secondsPerScene;
    const endSec = Math.min((i + 1) * secondsPerScene, duration);
    const tpl = templates[i % templates.length];
    result.push({
      id: i + 1,
      timeRange: `${formatTime(startSec)} – ${formatTime(endSec)}`,
      title: tpl.title,
      description: tpl.description,
      visualNotes: tpl.visualNotes,
      audioNotes: tpl.audioNotes,
    });
  }
  return result;
}

function extractProductName(prompt: string): string {
  const patterns = [
    /产品(?:是|为|叫|名[称为]?)\s*(.+?)(?:[。.；;！!？?]|$)/,
    /(?:介绍|展示|推广|宣传)\s*(.+?)(?:的|[，,。.；;！!？?]|$)/,
    /(?:for|about|of)\s+(.+?)(?:[,.]|$)/i,
  ];
  for (const pat of patterns) {
    const m = prompt.match(pat);
    if (m?.[1]) {
      const name = m[1].trim().replace(/[，,]+$/, '').trim();
      if (name.length > 0 && name.length < 40) return name;
    }
  }
  return '产品';
}

function buildSceneTemplates(product: string, prompt: string): StoryboardScene[] {
  const isIntro = /介绍|展示|宣传|推广|intro|promo/i.test(prompt);
  const isTutorial = /教程|教学|tutorial|how.?to/i.test(prompt);

  if (isTutorial) {
    return [
      { id: 1, timeRange: '', title: '开场 — 问题引入', description: `展示用户常见痛点，引出 ${product} 的解决方案`, visualNotes: '暗色背景 + 问题文字动画浮现', audioNotes: '轻快背景音乐渐入' },
      { id: 2, timeRange: '', title: '步骤演示', description: `${product} 核心操作流程的屏幕录制或动画演示`, visualNotes: '屏幕录制 + 高亮标注关键操作区域', audioNotes: '旁白讲解操作步骤' },
      { id: 3, timeRange: '', title: '效果展示', description: '展示操作完成后的成果和效果对比', visualNotes: '前后对比分屏 / 成果全屏展示', audioNotes: '旁白总结 + 音乐渐强' },
      { id: 4, timeRange: '', title: '结尾 CTA', description: '引导用户尝试，展示下载/访问入口', visualNotes: `${product} Logo + CTA 按钮动画`, audioNotes: '音乐收尾 + 旁白引导' },
    ];
  }

  // Default: product intro
  return [
    { id: 1, timeRange: '', title: '品牌亮相', description: `${product} Logo 动画入场，配合 Slogan 文字`, visualNotes: `纯色/渐变背景，${product} Logo 居中，粒子/光效动画`, audioNotes: '品牌音效 + 轻快背景音乐起' },
    { id: 2, timeRange: '', title: '痛点共鸣', description: isIntro ? `快速展示目标用户面临的核心问题` : `引出 ${product} 要解决的场景`, visualNotes: '快剪画面 / 图标动画展示问题场景', audioNotes: '旁白点出痛点，音乐节奏略紧' },
    { id: 3, timeRange: '', title: '核心功能展示', description: `${product} 的 2-3 个核心功能亮点，配合界面/动画演示`, visualNotes: '产品界面截图 + 功能高亮动画 + 数据可视化', audioNotes: '旁白介绍功能，音乐节奏明快' },
    { id: 4, timeRange: '', title: '价值主张 & CTA', description: `总结 ${product} 的核心价值，引导用户行动`, visualNotes: `Slogan 大字 + ${product} Logo + CTA 按钮/二维码`, audioNotes: '音乐高潮收尾 + 旁白号召行动' },
  ];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Render storyboard scenes into a self-contained HTML page.
 */
export function renderStoryboardHtml(
  config: StoryboardConfig,
  scenes: StoryboardScene[],
): string {
  const product = extractProductName(config.prompt);
  const duration = config.duration ?? 15;
  const title = `分镜脚本 — ${product}（${duration}s）`;

  const sceneCards = scenes.map(s => `
    <div class="scene-card">
      <div class="scene-header">
        <span class="scene-id">Scene ${s.id}</span>
        <span class="scene-time">${esc(s.timeRange)}</span>
      </div>
      <h3 class="scene-title">${esc(s.title)}</h3>
      <p class="scene-desc">${esc(s.description)}</p>
      <div class="scene-notes">
        <div class="note visual">
          <span class="note-label">🎬 画面</span>
          <span>${esc(s.visualNotes)}</span>
        </div>
        <div class="note audio">
          <span class="note-label">🔊 音频</span>
          <span>${esc(s.audioNotes)}</span>
        </div>
      </div>
    </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
      background: #0f0f13;
      color: #e8e8ed;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #2a2a35;
    }
    .header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .header .meta {
      font-size: 0.85rem;
      color: #888;
    }
    .timeline {
      position: relative;
      padding-left: 2rem;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 0.6rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, #6366f1, #a78bfa, #6366f1);
      border-radius: 1px;
    }
    .scene-card {
      position: relative;
      background: #1a1a24;
      border: 1px solid #2a2a35;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
      transition: border-color 0.2s;
    }
    .scene-card:hover { border-color: #6366f1; }
    .scene-card::before {
      content: '';
      position: absolute;
      left: -1.65rem;
      top: 1.5rem;
      width: 10px;
      height: 10px;
      background: #6366f1;
      border-radius: 50%;
      border: 2px solid #0f0f13;
    }
    .scene-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .scene-id {
      font-size: 0.75rem;
      font-weight: 600;
      color: #a78bfa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .scene-time {
      font-size: 0.8rem;
      color: #6366f1;
      font-variant-numeric: tabular-nums;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }
    .scene-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }
    .scene-desc {
      font-size: 0.9rem;
      color: #b0b0be;
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }
    .scene-notes {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .note {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #999;
      line-height: 1.4;
    }
    .note-label {
      flex-shrink: 0;
      font-weight: 500;
    }
    .note.visual .note-label { color: #60a5fa; }
    .note.audio .note-label { color: #34d399; }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #2a2a35;
      font-size: 0.75rem;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${esc(title)}</h1>
      <div class="meta">共 ${scenes.length} 个场景 · 总时长 ${duration} 秒 · ${esc(config.style ?? '产品介绍')}</div>
    </div>
    <div class="timeline">
      ${sceneCards}
    </div>
    <div class="footer">Generated by Claw Design · Video Storyboard</div>
  </div>
</body>
</html>`;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
