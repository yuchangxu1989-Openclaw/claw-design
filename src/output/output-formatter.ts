// Output Formatter — core interface and types for multi-format export

/** Supported output formats */
export type OutputFormat = 'html' | 'pdf' | 'png' | 'svg';

/** Options for format rendering */
export interface FormatOptions {
  width?: number;
  height?: number;
  quality?: number;
  scale?: number;
}

/** All formatters implement this contract */
export interface OutputFormatter {
  readonly format: OutputFormat;
  render(html: string, options?: FormatOptions): Promise<Buffer | string>;
  supports(format: OutputFormat): boolean;
}
