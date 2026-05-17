import type { PipelineResult } from './video-editor-types.js';
import { escapeHtml } from '../utils.js';

/**
 * Build a minimal HTML summary for video processing results.
 * Since video skills produce files rather than visual HTML,
 * this provides a human-readable status page with output paths.
 */
export function renderVideoResultHtml(
  action: string,
  result: PipelineResult,
): string {
  const title = `Video — ${action}`;
  const statusLabel = result.status === 'ok' ? '✅ 完成' : '❌ 失败';
  const outputs = result.outputs ?? [];
  const outputList = outputs.length > 0
    ? outputs.map(p => `<li><code>${escapeHtml(p)}</code></li>`).join('\n        ')
    : '<li>无输出文件</li>';

  const metaEntries = result.metadata
    ? Object.entries(result.metadata)
        .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td><code>${escapeHtml(String(v))}</code></td></tr>`)
        .join('\n        ')
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.25rem; }
    .status { font-size: 1.1rem; margin: 1rem 0; }
    ul { padding-left: 1.5rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; font-size: 0.9rem; }
    code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="status">${statusLabel}</p>
  ${result.message ? `<p>${escapeHtml(result.message)}</p>` : ''}
  <h2>输出文件</h2>
  <ul>
    ${outputList}
  </ul>
  ${metaEntries ? `<h2>元数据</h2><table>${metaEntries}</table>` : ''}
</body>
</html>`;
}

