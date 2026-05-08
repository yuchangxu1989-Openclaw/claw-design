// HTML Formatter — wraps raw HTML with proper document structure

import type { OutputFormatter, OutputFormat, FormatOptions } from './output-formatter.js';

export class HtmlFormatter implements OutputFormatter {
  readonly format: OutputFormat = 'html';

  supports(format: OutputFormat): boolean {
    return format === 'html';
  }

  async render(html: string, options?: FormatOptions): Promise<string> {
    const width = options?.width ? `max-width:${options.width}px;` : '';
    const scale = options?.scale && options.scale !== 1
      ? `transform:scale(${options.scale});transform-origin:top left;`
      : '';
    const style = width || scale ? ` style="${width}${scale}"` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="generator" content="Claw Design">
</head>
<body${style}>
${html}
</body>
</html>`;
  }
}
