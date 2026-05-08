import type { ArtifactType } from '../types.js';
import type { TemplateMeta, TemplateFilter } from './template-registry.js';

export interface TemplateVariant {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  artifactType: ArtifactType;
  variantType: 'style' | 'layout' | 'theme';
  tags: string[];
  skeleton: string;
  thumbnail?: string;
}

export interface VariantSelection {
  templateId: string;
  variantId: string;
  reason?: string;
}

const VARIANT_TEMPLATES: TemplateVariant[] = [
  {
    id: 'slides-business',
    templateId: 'presentation-basic',
    name: 'Business',
    description: '布局：标准标题封面 + 内容页；字体：Inter + Noto Sans SC；配色：corporate-blue；特效：渐变封面与标题下划线。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'business', 'professional', 'corporate-blue'],
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
  .cd-presentation { font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif; }
  .cd-slide { padding: 3rem 4rem; min-height: 450px; background: #fff; }
  .cd-slide--title { background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cd-slide--title h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 600; }
  .cd-slide--title .subtitle { font-size: 1.5rem; opacity: 0.9; }
  .cd-slide h2 { font-size: 2rem; color: #1a73e8; border-bottom: 3px solid #1a73e8; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
  .cd-slide .content { font-size: 1.25rem; line-height: 1.7; color: #333; }
</style>`,
  },
  {
    id: 'slides-tech',
    templateId: 'presentation-basic',
    name: 'Tech Dark',
    description: '布局：深色封面 + 代码内容页；字体：JetBrains Mono + Fira Code；配色：neon-tech；特效：暗底高亮与代码卡片。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'tech', 'developer', 'dark', 'neon-tech'],
    skeleton: `<div class="cd-presentation">
  <section class="cd-slide cd-slide--title">
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide">
    <h2>{{this.heading}}</h2>
    <pre class="code-block"><code>{{this.body}}</code></pre>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
  .cd-slide { padding: 3rem 4rem; min-height: 450px; background: #1e1e2e; color: #e0e0e0; }
  .cd-slide--title { background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cd-slide--title h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700; }
  .cd-slide--title .subtitle { font-size: 1.25rem; opacity: 0.85; color: #90caf9; }
  .cd-slide h2 { font-size: 1.75rem; color: #4fc3f7; margin-bottom: 1.25rem; }
  .code-block { background: #121212; padding: 1.25rem; border-radius: 8px; font-size: 1rem; overflow-x: auto; border: 1px solid #333; }
</style>`,
  },
  {
    id: 'slides-academic',
    templateId: 'presentation-basic',
    name: 'Academic Fresh',
    description: '布局：学院封面 + 正文页；字体：Georgia + Noto Serif SC；配色：forest-green；特效：左侧章节标尺。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'academic', 'education', 'clean', 'forest-green'],
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
  .cd-presentation { font-family: 'Georgia', 'Noto Serif SC', serif; }
  .cd-slide { padding: 3rem 4rem; min-height: 450px; background: #fafafa; color: #333; }
  .cd-slide--title { background: #2e7d32; color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cd-slide--title h1 { font-size: 2.75rem; margin-bottom: 0.75rem; }
  .cd-slide--title .subtitle { font-size: 1.35rem; opacity: 0.95; font-style: italic; }
  .cd-slide h2 { font-size: 1.85rem; color: #2e7d32; border-left: 4px solid #2e7d32; padding-left: 1rem; margin-bottom: 1.25rem; }
  .cd-slide .content { font-size: 1.2rem; line-height: 1.75; color: #444; }
</style>`,
  },
  {
    id: 'slides-creative',
    templateId: 'presentation-basic',
    name: 'Creative Colorful',
    description: '布局：中心封面 + 鲜艳内容页；字体：Poppins + Noto Sans SC；配色：sunset-gradient；特效：高饱和渐变与大写标题。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'creative', 'colorful', 'marketing', 'sunset-gradient'],
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
  .cd-presentation { font-family: 'Poppins', 'Noto Sans SC', system-ui, sans-serif; }
  .cd-slide { padding: 3rem 4rem; min-height: 450px; background: #fff; }
  .cd-slide--title { background: linear-gradient(135deg, #e91e63 0%, #f48fb1 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cd-slide--title h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
  .cd-slide--title .subtitle { font-size: 1.4rem; opacity: 0.95; letter-spacing: 1px; }
  .cd-slide h2 { font-size: 2rem; color: #e91e63; margin-bottom: 1.25rem; }
  .cd-slide .content { font-size: 1.25rem; line-height: 1.7; color: #333; }
</style>`,
  },
  {
    id: 'slides-minimal',
    templateId: 'presentation-basic',
    name: 'Minimal B&W',
    description: '布局：极简封面 + 左侧强调条正文；字体：Helvetica Neue + Noto Sans SC；配色：monochrome-elegant；特效：黑白强对比。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'minimal', 'bw', 'modern', 'monochrome-elegant'],
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
  .cd-presentation { font-family: 'Helvetica Neue', 'Noto Sans SC', Arial, sans-serif; }
  .cd-slide { padding: 3rem 4rem; min-height: 450px; background: #fafafa; color: #212121; }
  .cd-slide--title { background: #212121; color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cd-slide--title h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 300; letter-spacing: 3px; }
  .cd-slide--title .subtitle { font-size: 1.1rem; opacity: 0.7; font-weight: 300; }
  .cd-slide h2 { font-size: 1.75rem; color: #212121; margin-bottom: 1.5rem; font-weight: 500; }
  .cd-slide .content { font-size: 1.1rem; line-height: 1.8; color: #424242; }
  .cd-slide { border-left: 8px solid #212121; }
</style>`,
  },
  {
    id: 'slides-editorial',
    templateId: 'presentation-basic',
    name: 'Editorial Magazine',
    description: '布局：满版封面图 + 文字叠加，正文双栏；字体：Playfair Display + Inter；配色：rose-gold；特效：暗角遮罩、杂志标题层叠。',
    artifactType: 'slides',
    variantType: 'layout',
    tags: ['slides', 'editorial', 'magazine', 'rose-gold', 'overlay'],
    skeleton: `<div class="cd-presentation cd-presentation--editorial">
  <section class="cd-slide cd-slide--title">
    <div class="eyebrow">FEATURE STORY</div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--editorial">
    <div class="meta">{{this.heading}}</div>
    <div class="editorial-grid">
      <h2>{{this.heading}}</h2>
      <div class="content">{{this.body}}</div>
    </div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--editorial { font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif; color: #241315; }
  .cd-slide { min-height: 480px; }
  .cd-slide--title {
    padding: 4rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background:
      linear-gradient(180deg, rgba(32, 16, 20, 0.05) 0%, rgba(32, 16, 20, 0.72) 100%),
      radial-gradient(circle at top left, rgba(255,255,255,0.22) 0%, transparent 40%),
      linear-gradient(135deg, #f5d0d6 0%, #e9a5b3 48%, #b76e79 100%);
    color: #fff7f8;
    position: relative;
    overflow: hidden;
  }
  .cd-slide--title::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent 50%);
    mix-blend-mode: screen;
  }
  .eyebrow { position: relative; z-index: 1; font-size: 0.85rem; letter-spacing: 0.35em; text-transform: uppercase; opacity: 0.82; margin-bottom: 1rem; }
  .cd-slide--title h1 { position: relative; z-index: 1; font-family: 'Playfair Display', 'Noto Serif SC', serif; font-size: 3.4rem; line-height: 0.98; margin: 0 0 1rem; max-width: 12ch; }
  .cd-slide--title .subtitle { position: relative; z-index: 1; font-size: 1.2rem; max-width: 28rem; line-height: 1.7; margin: 0; }
  .cd-slide--editorial { padding: 3rem 4rem; background: #fff8f7; }
  .meta { color: #b76e79; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.22em; margin-bottom: 1.4rem; }
  .editorial-grid { display: grid; grid-template-columns: minmax(220px, 0.95fr) minmax(0, 1.4fr); gap: 2rem; align-items: start; }
  .editorial-grid h2 { font-family: 'Playfair Display', 'Noto Serif SC', serif; font-size: 2.4rem; line-height: 1.05; margin: 0; color: #4a1d24; }
  .editorial-grid .content { font-size: 1.1rem; line-height: 1.85; color: #6f3f46; column-count: 2; column-gap: 1.5rem; }
</style>`,
  },
  {
    id: 'slides-bauhaus',
    templateId: 'presentation-basic',
    name: 'Bauhaus Geometry',
    description: '布局：几何分区封面 + 模块化正文；字体：Futura + Inter；配色：sunset-gradient；特效：包豪斯圆形与矩形色块。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'bauhaus', 'geometry', 'sunset-gradient', 'modernist'],
    skeleton: `<div class="cd-presentation cd-presentation--bauhaus">
  <section class="cd-slide cd-slide--title">
    <div class="shape shape--circle"></div>
    <div class="shape shape--block"></div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--bauhaus">
    <div class="index">0{{@index}}</div>
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--bauhaus { font-family: 'Futura', 'Avenir Next', 'Inter', 'Noto Sans SC', sans-serif; }
  .cd-slide { position: relative; min-height: 460px; overflow: hidden; }
  .cd-slide--title { padding: 4rem; background: #f8fafc; color: #111827; }
  .shape { position: absolute; }
  .shape--circle { width: 220px; height: 220px; border-radius: 50%; background: #fb7185; top: -60px; right: 8%; }
  .shape--block { width: 280px; height: 28px; background: #0f172a; left: 4rem; top: 6rem; }
  .cd-slide--title h1 { position: relative; z-index: 1; max-width: 9ch; font-size: 3.2rem; line-height: 0.95; letter-spacing: -0.04em; margin: 6rem 0 1rem; }
  .cd-slide--title .subtitle { position: relative; z-index: 1; font-size: 1.15rem; max-width: 32rem; }
  .cd-slide--bauhaus { padding: 3rem 4rem; background: linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%); }
  .cd-slide--bauhaus::before { content: ''; position: absolute; left: -30px; bottom: 2rem; width: 160px; height: 160px; background: #f97316; }
  .cd-slide--bauhaus::after { content: ''; position: absolute; right: 8%; top: 2rem; width: 120px; height: 120px; border-radius: 50%; background: #facc15; }
  .index { position: relative; z-index: 1; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; margin-bottom: 1rem; }
  .cd-slide--bauhaus h2 { position: relative; z-index: 1; font-size: 2.3rem; max-width: 10ch; margin: 0 0 1rem; color: #111827; }
  .cd-slide--bauhaus .content { position: relative; z-index: 1; max-width: 40rem; background: rgba(255,255,255,0.82); padding: 1.4rem 1.6rem; border-left: 8px solid #0f172a; font-size: 1.08rem; line-height: 1.75; }
</style>`,
  },
  {
    id: 'slides-glassmorphism',
    templateId: 'presentation-basic',
    name: 'Glassmorphism',
    description: '布局：居中玻璃封面卡片 + 浮层正文卡片；字体：Inter + SF Pro Display；配色：ocean-deep；特效：毛玻璃、模糊背景、高光边框。',
    artifactType: 'slides',
    variantType: 'theme',
    tags: ['slides', 'glassmorphism', 'frosted', 'ocean-deep', 'blur'],
    skeleton: `<div class="cd-presentation cd-presentation--glass">
  <section class="cd-slide cd-slide--title">
    <div class="glass-panel">
      <div class="label">FROSTED DECK</div>
      <h1>{{title}}</h1>
      <p class="subtitle">{{subtitle}}</p>
    </div>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--glass">
    <div class="glass-panel glass-panel--content">
      <h2>{{this.heading}}</h2>
      <div class="content">{{this.body}}</div>
    </div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--glass { font-family: 'Inter', 'SF Pro Display', 'Noto Sans SC', sans-serif; }
  .cd-slide {
    min-height: 470px;
    padding: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.45), transparent 30%),
      radial-gradient(circle at 80% 15%, rgba(14, 165, 233, 0.35), transparent 26%),
      radial-gradient(circle at 75% 80%, rgba(45, 212, 191, 0.30), transparent 28%),
      linear-gradient(135deg, #082f49 0%, #0f766e 52%, #164e63 100%);
  }
  .glass-panel {
    width: min(760px, 92%);
    padding: 2rem 2.25rem;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    color: #ecfeff;
  }
  .label { font-size: 0.82rem; letter-spacing: 0.28em; text-transform: uppercase; opacity: 0.8; margin-bottom: 1rem; }
  .glass-panel h1 { font-size: 3rem; line-height: 1.02; margin: 0 0 1rem; }
  .glass-panel .subtitle { font-size: 1.15rem; line-height: 1.7; color: rgba(236, 254, 255, 0.84); margin: 0; }
  .glass-panel--content h2 { font-size: 2rem; margin: 0 0 1rem; color: #ccfbf1; }
  .glass-panel--content .content { font-size: 1.05rem; line-height: 1.78; color: rgba(240, 253, 250, 0.92); }
</style>`,
  },
  {
    id: 'slides-gradient-mesh',
    templateId: 'presentation-basic',
    name: 'Gradient Mesh',
    description: '布局：中心标题 + 宽边距正文；字体：Space Grotesk + Inter；配色：pastel-soft；特效：渐变网格、多层柔雾。',
    artifactType: 'slides',
    variantType: 'theme',
    tags: ['slides', 'gradient', 'mesh', 'pastel-soft', 'soft-light'],
    skeleton: `<div class="cd-presentation cd-presentation--mesh">
  <section class="cd-slide cd-slide--title">
    <div class="mesh-noise"></div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--mesh-content">
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--mesh { font-family: 'Space Grotesk', 'Inter', 'Noto Sans SC', sans-serif; }
  .cd-slide {
    position: relative;
    min-height: 470px;
    padding: 3.5rem 4rem;
    overflow: hidden;
    background:
      radial-gradient(circle at 18% 20%, rgba(249, 168, 212, 0.88), transparent 28%),
      radial-gradient(circle at 75% 18%, rgba(103, 232, 249, 0.78), transparent 26%),
      radial-gradient(circle at 78% 78%, rgba(139, 92, 246, 0.72), transparent 30%),
      radial-gradient(circle at 24% 82%, rgba(221, 214, 254, 0.96), transparent 22%),
      linear-gradient(135deg, #fdfcff 0%, #f5f3ff 100%);
    color: #312e81;
  }
  .mesh-noise {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px);
    background-size: 36px 36px;
    opacity: 0.45;
  }
  .cd-slide--title { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
  .cd-slide--title h1, .cd-slide--title .subtitle { position: relative; z-index: 1; }
  .cd-slide--title h1 { font-size: 3.3rem; line-height: 0.95; max-width: 10ch; margin: 0 0 1rem; }
  .cd-slide--title .subtitle { font-size: 1.15rem; line-height: 1.75; max-width: 34rem; color: #5b4d86; }
  .cd-slide--mesh-content h2 { position: relative; z-index: 1; font-size: 2.1rem; margin: 0 0 1rem; }
  .cd-slide--mesh-content .content { position: relative; z-index: 1; max-width: 42rem; font-size: 1.08rem; line-height: 1.82; background: rgba(255,255,255,0.42); padding: 1.5rem 1.75rem; border-radius: 24px; }
</style>`,
  },
  {
    id: 'slides-retro',
    templateId: 'presentation-basic',
    name: 'Retro Warm',
    description: '布局：海报式封面 + 卡片正文；字体：Cormorant Garamond + Libre Baskerville；配色：warm-earth；特效：纸张肌理、复古边框。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'retro', 'warm-earth', 'serif', 'texture'],
    skeleton: `<div class="cd-presentation cd-presentation--retro">
  <section class="cd-slide cd-slide--title">
    <div class="stamp">ARCHIVE</div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--retro-content">
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--retro { font-family: 'Libre Baskerville', 'Noto Serif SC', serif; color: #3e2723; }
  .cd-slide {
    min-height: 470px;
    padding: 3.5rem 4rem;
    background:
      linear-gradient(rgba(255,248,238,0.96), rgba(255,248,238,0.96)),
      repeating-linear-gradient(0deg, rgba(141,110,99,0.06), rgba(141,110,99,0.06) 2px, transparent 2px, transparent 10px);
    border: 16px solid #d7ccc8;
    box-shadow: inset 0 0 0 1px rgba(62,39,35,0.12);
  }
  .stamp { display: inline-block; padding: 0.4rem 0.8rem; border: 1px solid #8d6e63; letter-spacing: 0.2em; font-size: 0.8rem; color: #8d6e63; margin-bottom: 1.5rem; }
  .cd-slide--title h1 { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif; font-size: 3.5rem; line-height: 0.95; margin: 0 0 1rem; max-width: 11ch; }
  .cd-slide--title .subtitle { font-size: 1.1rem; line-height: 1.8; max-width: 36rem; color: #6d4c41; }
  .cd-slide--retro-content h2 { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif; font-size: 2.5rem; margin: 0 0 1rem; color: #5d4037; }
  .cd-slide--retro-content .content { background: rgba(255,255,255,0.54); padding: 1.4rem 1.6rem; border-left: 6px solid #ff8a65; font-size: 1.04rem; line-height: 1.82; }
</style>`,
  },
  {
    id: 'slides-neon-dark',
    templateId: 'presentation-basic',
    name: 'Neon Dark',
    description: '布局：暗黑舞台封面 + 发光正文面板；字体：Orbitron + Inter；配色：neon-tech；特效：霓虹描边、发光阴影。',
    artifactType: 'slides',
    variantType: 'theme',
    tags: ['slides', 'neon', 'dark', 'neon-tech', 'gaming'],
    skeleton: `<div class="cd-presentation cd-presentation--neon">
  <section class="cd-slide cd-slide--title">
    <div class="halo"></div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--neon-content">
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--neon { font-family: 'Inter', 'Noto Sans SC', sans-serif; }
  .cd-slide {
    position: relative;
    min-height: 470px;
    padding: 3.25rem 4rem;
    overflow: hidden;
    background: radial-gradient(circle at center, rgba(17,24,39,0.92) 0%, #050816 62%, #02030a 100%);
    color: #ecfeff;
  }
  .halo {
    position: absolute; inset: 12% auto auto 10%; width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,245,212,0.28) 0%, rgba(124,58,237,0.16) 45%, transparent 70%);
    filter: blur(14px);
  }
  .cd-slide--title h1 { position: relative; z-index: 1; font-family: 'Orbitron', 'Inter', sans-serif; font-size: 3.2rem; line-height: 1; margin: 6rem 0 1rem; color: #00f5d4; text-shadow: 0 0 18px rgba(0,245,212,0.46), 0 0 42px rgba(124,58,237,0.28); }
  .cd-slide--title .subtitle { position: relative; z-index: 1; font-size: 1.12rem; max-width: 34rem; line-height: 1.75; color: #c4b5fd; }
  .cd-slide--neon-content h2 { font-family: 'Orbitron', 'Inter', sans-serif; font-size: 2rem; color: #f72585; margin: 0 0 1rem; text-shadow: 0 0 12px rgba(247,37,133,0.35); }
  .cd-slide--neon-content .content { max-width: 40rem; border: 1px solid rgba(0,245,212,0.28); background: rgba(17,24,39,0.62); box-shadow: 0 0 28px rgba(0,245,212,0.10); padding: 1.4rem 1.6rem; border-radius: 20px; line-height: 1.8; }
</style>`,
  },
  {
    id: 'slides-watercolor',
    templateId: 'presentation-basic',
    name: 'Watercolor Wash',
    description: '布局：手绘留白封面 + 水彩块正文；字体：DM Serif Display + Source Sans；配色：pastel-soft；特效：水彩晕染、柔和笔触。',
    artifactType: 'slides',
    variantType: 'style',
    tags: ['slides', 'watercolor', 'pastel-soft', 'artistic', 'soft'],
    skeleton: `<div class="cd-presentation cd-presentation--watercolor">
  <section class="cd-slide cd-slide--title">
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--watercolor-content">
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--watercolor { font-family: 'Source Sans 3', 'Noto Sans SC', sans-serif; color: #43326b; }
  .cd-slide {
    min-height: 470px;
    padding: 3.5rem 4rem;
    background:
      radial-gradient(circle at 15% 18%, rgba(249,168,212,0.34), transparent 20%),
      radial-gradient(circle at 82% 20%, rgba(103,232,249,0.28), transparent 24%),
      radial-gradient(circle at 72% 80%, rgba(139,92,246,0.22), transparent 20%),
      linear-gradient(180deg, #fdfcff 0%, #fbf7ff 100%);
  }
  .cd-slide--title h1 { font-family: 'DM Serif Display', 'Noto Serif SC', serif; font-size: 3.3rem; line-height: 0.95; margin: 0 0 1rem; max-width: 10ch; color: #312e81; }
  .cd-slide--title .subtitle { max-width: 34rem; font-size: 1.12rem; line-height: 1.8; color: #6d6293; }
  .cd-slide--watercolor-content h2 { display: inline-block; font-family: 'DM Serif Display', 'Noto Serif SC', serif; font-size: 2.25rem; margin: 0 0 1rem; padding: 0.2rem 0.6rem; background: rgba(255,255,255,0.52); box-shadow: 0 0 0 12px rgba(221,214,254,0.45); color: #4c1d95; }
  .cd-slide--watercolor-content .content { max-width: 40rem; font-size: 1.06rem; line-height: 1.84; background: rgba(255,255,255,0.5); padding: 1.35rem 1.6rem; border-radius: 26px; }
</style>`,
  },
  {
    id: 'slides-isometric',
    templateId: 'presentation-basic',
    name: 'Isometric Illustration',
    description: '布局：等距舞台封面 + 卡片模块正文；字体：Manrope + Inter；配色：ocean-deep；特效：等距阴影、模块块面。',
    artifactType: 'slides',
    variantType: 'layout',
    tags: ['slides', 'isometric', 'illustration', 'ocean-deep', '3d'],
    skeleton: `<div class="cd-presentation cd-presentation--isometric">
  <section class="cd-slide cd-slide--title">
    <div class="iso-stack">
      <span></span><span></span><span></span>
    </div>
    <div class="title-copy">
      <h1>{{title}}</h1>
      <p class="subtitle">{{subtitle}}</p>
    </div>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--iso-content">
    <div class="iso-card">
      <h2>{{this.heading}}</h2>
      <div class="content">{{this.body}}</div>
    </div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--isometric { font-family: 'Manrope', 'Inter', 'Noto Sans SC', sans-serif; }
  .cd-slide { min-height: 470px; padding: 3.5rem 4rem; background: linear-gradient(180deg, #ecfeff 0%, #f0fdfa 100%); color: #082f49; }
  .cd-slide--title { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; align-items: center; }
  .iso-stack { position: relative; width: 280px; height: 240px; }
  .iso-stack span { position: absolute; inset: auto 0 0 auto; width: 220px; height: 140px; border-radius: 24px; transform: skew(-24deg, -12deg); box-shadow: 0 16px 36px rgba(8,47,73,0.16); }
  .iso-stack span:nth-child(1) { background: #0f766e; top: 0; left: 0; }
  .iso-stack span:nth-child(2) { background: #0284c7; top: 34px; left: 22px; }
  .iso-stack span:nth-child(3) { background: #38bdf8; top: 68px; left: 44px; }
  .title-copy h1 { font-size: 3rem; line-height: 0.96; margin: 0 0 1rem; }
  .title-copy .subtitle { font-size: 1.12rem; line-height: 1.75; color: #155e75; }
  .cd-slide--iso-content { display: flex; align-items: center; }
  .iso-card { max-width: 42rem; padding: 1.8rem 2rem; background: #ffffff; border-radius: 26px; box-shadow: 24px 24px 0 rgba(8,47,73,0.10); border: 1px solid #a5f3fc; }
  .iso-card h2 { font-size: 2rem; margin: 0 0 1rem; color: #0f766e; }
  .iso-card .content { font-size: 1.06rem; line-height: 1.82; color: #0f3b4c; }
</style>`,
  },
  {
    id: 'slides-data-heavy',
    templateId: 'presentation-basic',
    name: 'Data Heavy',
    description: '布局：KPI 顶栏 + 双列数据区；字体：IBM Plex Sans + IBM Plex Mono；配色：corporate-blue；特效：指标卡、图表占位网格。',
    artifactType: 'slides',
    variantType: 'layout',
    tags: ['slides', 'data-heavy', 'analytics', 'corporate-blue', 'dashboard'],
    skeleton: `<div class="cd-presentation cd-presentation--data">
  <section class="cd-slide cd-slide--title">
    <div class="kpi-row">
      <div class="kpi-card"><span>ARR</span><strong>128%</strong></div>
      <div class="kpi-card"><span>NPS</span><strong>62</strong></div>
      <div class="kpi-card"><span>MAU</span><strong>2.4M</strong></div>
    </div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--data-content">
    <header>
      <h2>{{this.heading}}</h2>
      <span class="chip">ANALYTICS VIEW</span>
    </header>
    <div class="data-grid">
      <div class="chart-block"></div>
      <div class="content">{{this.body}}</div>
      <div class="metric-strip">
        <div></div><div></div><div></div>
      </div>
      <div class="table-block"></div>
    </div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--data { font-family: 'IBM Plex Sans', 'Inter', 'Noto Sans SC', sans-serif; color: #0f172a; }
  .cd-slide { min-height: 500px; padding: 2.5rem 3rem; background: #f8fbff; }
  .kpi-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .kpi-card { background: #ffffff; border: 1px solid #bfdbfe; border-radius: 18px; padding: 1rem 1.2rem; box-shadow: 0 8px 24px rgba(37,99,235,0.08); }
  .kpi-card span { display: block; font-size: 0.8rem; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; margin-bottom: 0.4rem; }
  .kpi-card strong { font-size: 2rem; color: #2563eb; }
  .cd-slide--title h1 { font-size: 2.9rem; margin: 0 0 0.8rem; }
  .cd-slide--title .subtitle { max-width: 38rem; color: #475569; font-size: 1.08rem; }
  .cd-slide--data-content header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
  .cd-slide--data-content h2 { margin: 0; font-size: 2rem; color: #0f172a; }
  .chip { display: inline-flex; padding: 0.45rem 0.85rem; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; }
  .data-grid { display: grid; grid-template-columns: 1.2fr 1fr; grid-template-rows: 180px auto; gap: 1rem; }
  .chart-block, .table-block, .metric-strip, .content { background: #ffffff; border: 1px solid #dbeafe; border-radius: 18px; padding: 1.2rem; }
  .chart-block { background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); position: relative; }
  .chart-block::before { content: ''; position: absolute; inset: 20px; border-radius: 12px; background: linear-gradient(90deg, rgba(37,99,235,0.18) 16%, transparent 16% 22%, rgba(37,99,235,0.18) 22% 38%, transparent 38% 44%, rgba(37,99,235,0.18) 44% 62%, transparent 62% 68%, rgba(37,99,235,0.18) 68% 86%, transparent 86%); }
  .content { font-size: 1.02rem; line-height: 1.78; color: #334155; }
  .metric-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; align-items: stretch; }
  .metric-strip div { border-radius: 14px; background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%); border: 1px solid #bfdbfe; }
  .table-block { background-image: linear-gradient(#e2e8f0 1px, transparent 1px); background-size: 100% 32px; }
</style>`,
  },
  {
    id: 'slides-storytelling',
    templateId: 'presentation-basic',
    name: 'Storytelling Timeline',
    description: '布局：大留白封面 + 时间线正文；字体：Fraunces + Inter；配色：midnight-purple；特效：时间轴节点与章节过渡。',
    artifactType: 'slides',
    variantType: 'layout',
    tags: ['slides', 'storytelling', 'timeline', 'midnight-purple', 'narrative'],
    skeleton: `<div class="cd-presentation cd-presentation--story">
  <section class="cd-slide cd-slide--title">
    <div class="story-kicker">CHAPTER ONE</div>
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </section>
  {{#each slides}}
  <section class="cd-slide cd-slide--story-content">
    <div class="timeline-rail"></div>
    <div class="timeline-dot"></div>
    <div class="story-meta">Act {{@index}}</div>
    <h2>{{this.heading}}</h2>
    <div class="content">{{this.body}}</div>
  </section>
  {{/each}}
</div>
<style>
  .cd-presentation--story { font-family: 'Inter', 'Noto Sans SC', sans-serif; background: #0f0a19; }
  .cd-slide { position: relative; min-height: 500px; padding: 4rem 5rem 4rem 8rem; color: #f5f3ff; background: linear-gradient(180deg, #0f0a19 0%, #1e1630 100%); }
  .cd-slide--title { display: flex; flex-direction: column; justify-content: center; }
  .story-kicker { font-size: 0.84rem; letter-spacing: 0.32em; text-transform: uppercase; color: #22d3ee; margin-bottom: 1.25rem; }
  .cd-slide--title h1 { font-family: 'Fraunces', 'Noto Serif SC', serif; font-size: 3.5rem; line-height: 0.95; max-width: 11ch; margin: 0 0 1rem; }
  .cd-slide--title .subtitle { font-size: 1.14rem; line-height: 1.8; max-width: 36rem; color: #c4b5fd; }
  .timeline-rail { position: absolute; left: 4rem; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, rgba(34,211,238,0.18) 0%, rgba(139,92,246,0.6) 50%, rgba(34,211,238,0.18) 100%); }
  .timeline-dot { position: absolute; left: calc(4rem - 7px); top: 4.6rem; width: 16px; height: 16px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 0 10px rgba(34,211,238,0.12); }
  .story-meta { color: #22d3ee; font-size: 0.84rem; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 1rem; }
  .cd-slide--story-content h2 { font-family: 'Fraunces', 'Noto Serif SC', serif; font-size: 2.4rem; line-height: 1.02; max-width: 12ch; margin: 0 0 1rem; }
  .cd-slide--story-content .content { max-width: 36rem; font-size: 1.08rem; line-height: 1.88; color: #ddd6fe; }
</style>`,
  },
  {
    id: 'chart-business',
    templateId: 'chart-dashboard',
    name: 'Business Blue',
    description: '布局：响应式卡片网格；字体：Inter；配色：business-blue；特效：浅蓝渐变图表区域。',
    artifactType: 'chart',
    variantType: 'theme',
    tags: ['chart', 'business', 'blue', 'professional', 'business-blue'],
    skeleton: `<div class="cd-dashboard">
  <header><h1>{{title}}</h1></header>
  <div class="cd-grid">
    {{#each charts}}
    <div class="cd-card">
      <h3>{{this.label}}</h3>
      <div class="cd-chart-area" data-type="{{this.type}}" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);"></div>
    </div>
    {{/each}}
  </div>
  <footer>{{summary}}</footer>
</div>
<style>
  .cd-dashboard { font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif; padding: 1.5rem; background: #f5f5f5; }
  header h1 { color: #1565c0; font-size: 1.75rem; margin-bottom: 1.5rem; }
  .cd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; }
  .cd-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
  .cd-card h3 { color: #1976d2; font-size: 1.1rem; margin-bottom: 1rem; }
  .cd-chart-area { min-height: 200px; border-radius: 4px; }
</style>`,
  },
  {
    id: 'chart-dark',
    templateId: 'chart-dashboard',
    name: 'Dark Tech',
    description: '布局：深色数据网格；字体：JetBrains Mono；配色：tech-dark；特效：暗底发光图表区。',
    artifactType: 'chart',
    variantType: 'theme',
    tags: ['chart', 'dark', 'tech', 'developer', 'tech-dark'],
    skeleton: `<div class="cd-dashboard">
  <header><h1>{{title}}</h1></header>
  <div class="cd-grid">
    {{#each charts}}
    <div class="cd-card">
      <h3>{{this.label}}</h3>
      <div class="cd-chart-area" data-type="{{this.type}}" style="background: linear-gradient(135deg, #263238 0%, #37474f 100%);"></div>
    </div>
    {{/each}}
  </div>
  <footer>{{summary}}</footer>
</div>
<style>
  .cd-dashboard { font-family: 'JetBrains Mono', 'Fira Code', monospace; padding: 1.5rem; background: #121212; color: #e0e0e0; }
  header h1 { color: #4fc3f7; font-size: 1.75rem; margin-bottom: 1.5rem; }
  .cd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; }
  .cd-card { background: #1e1e2e; border: 1px solid #333; border-radius: 8px; padding: 1.25rem; }
  .cd-card h3 { color: #4fc3f7; font-size: 1.1rem; margin-bottom: 1rem; }
  .cd-chart-area { min-height: 200px; border-radius: 4px; }
</style>`,
  },
  {
    id: 'chart-vibrant',
    templateId: 'chart-dashboard',
    name: 'Vibrant',
    description: '布局：圆角卡片图表板；字体：Poppins；配色：sunset-gradient；特效：粉色阴影与柔和渐变。',
    artifactType: 'chart',
    variantType: 'theme',
    tags: ['chart', 'vibrant', 'colorful', 'creative', 'sunset-gradient'],
    skeleton: `<div class="cd-dashboard">
  <header><h1>{{title}}</h1></header>
  <div class="cd-grid">
    {{#each charts}}
    <div class="cd-card">
      <h3>{{this.label}}</h3>
      <div class="cd-chart-area" data-type="{{this.type}}" style="background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);"></div>
    </div>
    {{/each}}
  </div>
  <footer>{{summary}}</footer>
</div>
<style>
  .cd-dashboard { font-family: 'Poppins', 'Noto Sans SC', system-ui, sans-serif; padding: 1.5rem; background: #fafafa; color: #333; }
  header h1 { color: #e91e63; font-size: 1.75rem; margin-bottom: 1.5rem; font-weight: 600; }
  .cd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; }
  .cd-card { background: #fff; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 12px rgba(233,30,99,0.15); }
  .cd-card h3 { color: #c2185b; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500; }
  .cd-chart-area { min-height: 200px; border-radius: 8px; }
</style>`,
  },
  {
    id: 'arch-wireframe',
    templateId: 'architecture-diagram',
    name: 'Wireframe Simple',
    description: '布局：分层行布局；字体：system-ui；配色：单色线框；特效：极简边框。',
    artifactType: 'arch-diagram',
    variantType: 'layout',
    tags: ['arch', 'diagram', 'wireframe', 'simple'],
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
  .cd-arch h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #333; }
  .cd-desc { color: #666; margin-bottom: 1.5rem; }
  .cd-layers { display: flex; flex-direction: column; gap: 1rem; }
  .cd-layer { display: flex; align-items: stretch; gap: 1rem; }
  .cd-layer-label { min-width: 140px; font-weight: 500; background: #f5f5f5; padding: 0.75rem 1rem; border-radius: 4px; }
  .cd-components { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .cd-component { padding: 0.5rem 1rem; background: #fff; border: 1px solid #ddd; border-radius: 4px; }
</style>`,
  },
  {
    id: 'arch-dark-tech',
    templateId: 'architecture-diagram',
    name: 'Dark Tech',
    description: '布局：深色分层图；字体：JetBrains Mono；配色：tech-dark；特效：深色模块块面。',
    artifactType: 'arch-diagram',
    variantType: 'theme',
    tags: ['arch', 'diagram', 'dark', 'tech', 'tech-dark'],
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
  .cd-arch { font-family: 'JetBrains Mono', monospace; padding: 2rem; background: #1e1e2e; color: #e0e0e0; }
  .cd-arch h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #4fc3f7; }
  .cd-desc { color: #90caf9; margin-bottom: 1.5rem; }
  .cd-layers { display: flex; flex-direction: column; gap: 0.75rem; }
  .cd-layer { display: flex; align-items: stretch; gap: 1rem; background: #263238; padding: 0.5rem; border-radius: 6px; }
  .cd-layer-label { min-width: 140px; font-weight: 600; color: #4fc3f7; padding: 0.5rem; }
  .cd-components { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .cd-component { padding: 0.5rem 1rem; background: #37474f; border: 1px solid #546e7a; border-radius: 4px; color: #cfd8dc; }
</style>`,
  },
  {
    id: 'arch-layered',
    templateId: 'architecture-diagram',
    name: 'Layered Color',
    description: '布局：彩色层叠架构图；字体：Poppins；配色：多色层条；特效：彩色层标签。',
    artifactType: 'arch-diagram',
    variantType: 'layout',
    tags: ['arch', 'diagram', 'colorful', 'layered'],
    skeleton: `<div class="cd-arch">
  <h1>{{title}}</h1>
  <p class="desc">{{description}}</p>
  <div class="cd-layers">
    {{#each layers}}
    <div class="cd-layer" style="background: {{lookup ../colors @index}}20;">
      <div class="cd-layer-label" style="background: {{lookup ../colors @index}};">{{this.name}}</div>
      <div class="cd-components">
        {{#each this.components}}
        <div class="cd-component" style="border-color: {{lookup ../colors @index}};">{{this}}</div>
        {{/each}}
      </div>
    </div>
    {{/each}}
  </div>
</div>
<style>
  .cd-arch { font-family: 'Poppins', system-ui, sans-serif; padding: 2rem; }
  .cd-arch h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: #333; }
  .cd-desc { color: #666; margin-bottom: 2rem; }
  .cd-layers { display: flex; flex-direction: column; gap: 1.25rem; }
  .cd-layer { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; }
  .cd-layer-label { min-width: 120px; padding: 0.75rem 1rem; border-radius: 8px; color: #fff; font-weight: 600; text-align: center; }
  .cd-components { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .cd-component { padding: 0.5rem 1rem; background: #fff; border: 2px solid #1976d2; border-radius: 6px; font-weight: 500; }
</style>`,
  },
];

export class TemplateVariantRegistry {
  private variants = new Map<string, TemplateVariant[]>();

  register(variant: TemplateVariant): void {
    const list = this.variants.get(variant.templateId) ?? [];
    list.push(variant);
    this.variants.set(variant.templateId, list);
  }

  registerAll(variants: TemplateVariant[]): void {
    for (const v of variants) this.register(v);
  }

  getVariants(templateId: string): TemplateVariant[] {
    return this.variants.get(templateId) ?? [];
  }

  getByArtifactType(type: ArtifactType): TemplateVariant[] {
    const result: TemplateVariant[] = [];
    for (const list of this.variants.values()) {
      for (const v of list) {
        if (v.artifactType === type) result.push(v);
      }
    }
    return result;
  }

  filter(templateId: string, filter: {
    variantType?: TemplateVariant['variantType'];
    tags?: string[];
  }): TemplateVariant[] {
    let list = this.getVariants(templateId);
    if (filter.variantType) {
      list = list.filter(v => v.variantType === filter.variantType);
    }
    if (filter.tags && filter.tags.length > 0) {
      list = list.filter(v => filter.tags!.some(tag => v.tags.includes(tag)));
    }
    return list;
  }

  selectVariant(
    templateId: string,
    type: ArtifactType,
    preferences?: { variantType?: TemplateVariant['variantType']; tags?: string[] }
  ): TemplateVariant | null {
    const filtered = this.filter(templateId, preferences ?? {});
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  list(): TemplateVariant[] {
    const all: TemplateVariant[] = [];
    for (const list of this.variants.values()) all.push(...list);
    return all;
  }
}

export function createVariantRegistry(): TemplateVariantRegistry {
  const registry = new TemplateVariantRegistry();
  registry.registerAll(VARIANT_TEMPLATES);
  return registry;
}
