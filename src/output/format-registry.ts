// Format Registry — manages available output formatters

import type { OutputFormatter, OutputFormat } from './output-formatter.js';

export class FormatRegistry {
  private formatters = new Map<OutputFormat, OutputFormatter>();

  registerFormatter(formatter: OutputFormatter): void {
    this.formatters.set(formatter.format, formatter);
  }

  getFormatter(format: OutputFormat): OutputFormatter | undefined {
    return this.formatters.get(format);
  }

  listFormats(): OutputFormat[] {
    return [...this.formatters.keys()];
  }
}
