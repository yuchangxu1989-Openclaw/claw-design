import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface HtmlScaffoldOptions {
  title: string;
  styles: string;
  body: string;
  lang?: string;
}

export interface HtmlArtifactOptions {
  taskId: string;
  html: string;
  outputDir?: string;
}

export function renderHtmlScaffold({
  title,
  styles,
  body,
  lang = 'zh-CN',
}: HtmlScaffoldOptions): string {
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
${styles.trim()}
</style>
</head>
<body>
${body.trim()}
</body>
</html>`;
}

export function writeHtmlArtifact({
  taskId,
  html,
  outputDir,
}: HtmlArtifactOptions): string {
  const resolvedOutputDir = outputDir || resolve(process.cwd(), 'output');
  mkdirSync(resolvedOutputDir, { recursive: true });

  const outputPath = join(resolvedOutputDir, `${taskId}.html`);
  writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
