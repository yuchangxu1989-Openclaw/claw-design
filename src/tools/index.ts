/**
 * FR-H02: Design tools — dev-time utilities for brand package management.
 * These are development tools, not runtime dependencies (AC6).
 */
export {
  convert,
  convertFile,
  convertBatch,
  extractTokens,
  extractColors,
  extractTypography,
  extractSpacing,
  extractRadius,
  extractComponents,
  generateTypeScript,
} from './md-to-ts-converter.js';

export type {
  ConvertOptions,
  ConversionResult,
  BatchConversionReport,
  ExtractedTokens,
} from './md-to-ts-converter.js';
