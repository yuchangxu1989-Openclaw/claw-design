export { ExportAdapter } from './export-adapter.js';
export { buildFormatConsistencyReport } from './format-consistency.js';
export {
  extractPptxPageAnalyses,
  buildFallbackImageData,
  buildFallbackNote,
} from './pptx-fallback.js';
export {
  parseHtmlToSlideBlocks,
} from './pptx-structure-parser.js';
export type {
  PptxBlock,
  PptxSlideBlocks,
} from './pptx-structure-parser.js';
export {
  SLIDE_WIDTH_INCHES,
  SLIDE_HEIGHT_INCHES,
  SLIDE_WIDTH_PX,
  SLIDE_HEIGHT_PX,
} from './export-constants.js';
