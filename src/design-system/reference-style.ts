import type { ArtifactType, DesignRequest, QualityItem } from '../types.js';

export type ReferenceImageKind = 'path' | 'url';
export type ReferenceImageDeclaredBy = 'cli' | 'metadata' | 'attachment' | 'prompt';
export type ReferenceExtractionStatus = 'complete' | 'partial' | 'insufficient';
export type ReferenceDensity = 'low' | 'medium' | 'high' | 'unknown';

export interface ReferenceImageSource {
  uri: string;
  kind: ReferenceImageKind;
  declaredBy: ReferenceImageDeclaredBy;
}

export interface ReferenceLayoutStyle {
  direction: string;
  proportions: string;
  visualFocus: string;
}

export interface ReferenceTypographyStyle {
  style: string;
  density: ReferenceDensity;
  hierarchy: string;
  alignment: string;
}

export interface ReferenceStyleAnalysis {
  source: ReferenceImageSource;
  status: ReferenceExtractionStatus;
  palette: string[];
  paletteDescription: string;
  layout: ReferenceLayoutStyle;
  typography: ReferenceTypographyStyle;
  informationDensity: ReferenceDensity;
  borrowableFeatures: string[];
  nonBorrowableElements: string[];
  conflicts: string[];
  missingDimensions: string[];
  notes: string[];
}

export interface ReferenceDesignSystemContext {
  id: string;
  name: string;
  source: string;
  content: string;
  tokens: {
    colors: string[];
    fonts: string[];
    fontSizes: string[];
    spacing: string[];
    radius: string[];
    components: string[];
    layoutConstraints: string[];
    forbiddenRules: string[];
  };
  generationConstraints: string[];
  deliveryNotes: string[];
}

export interface ReferenceImageAnalysisRequest {
  source: ReferenceImageSource;
  allSources: ReferenceImageSource[];
  taskInput: string;
  prompt: string;
  context: Record<string, unknown>;
  skillName?: string;
  artifactType?: ArtifactType;
  designSystem?: ReferenceDesignSystemContext;
}

export interface ReferenceImageAnalyzerProvider {
  analyzeReferenceImage(request: ReferenceImageAnalysisRequest): Promise<Partial<ReferenceStyleAnalysis> | null>;
}

export interface ReferenceStyleResolution {
  source: ReferenceImageSource;
  allSources: ReferenceImageSource[];
  analysis: ReferenceStyleAnalysis;
  designMd: string;
  generationConstraints: string[];
  qualityItems: QualityItem[];
  deliveryNotes: string[];
  prompt: string;
}

export interface ResolveReferenceStyleOptions {
  analyzer?: ReferenceImageAnalyzerProvider;
  context?: Record<string, unknown>;
  skillName?: string;
  artifactType?: ArtifactType;
  designSystem?: ReferenceDesignSystemContext;
}

const REQUIRED_DIMENSIONS = [
  'palette',
  'layout.direction',
  'layout.proportions',
  'layout.visualFocus',
  'typography.style',
  'typography.density',
  'informationDensity',
] as const;

const SOURCE_PRIORITY: Record<ReferenceImageDeclaredBy, number> = {
  metadata: 0,
  cli: 0,
  attachment: 1,
  prompt: 2,
};

export async function resolveReferenceStyleForRequest(
  request: DesignRequest,
  options: ResolveReferenceStyleOptions = {},
): Promise<ReferenceStyleResolution | null> {
  const allSources = collectReferenceImageSources(request);
  if (allSources.length === 0) return null;

  const source = allSources[0];
  const prompt = buildReferenceImageAnalysisPrompt(source, request.rawInput, {
    skillName: options.skillName,
    artifactType: options.artifactType,
    designSystem: options.designSystem,
    context: options.context ?? {},
    allSources,
  });

  const ambiguityConflict = allSources.length > 1
    ? `Multiple reference images were supplied. Using ${source.uri} by priority (${source.declaredBy}); ignored: ${allSources.slice(1).map(item => item.uri).join(', ')}.`
    : null;

  const analyzer = options.analyzer;
  const analysis = analyzer
    ? normalizeReferenceStyleAnalysis(
      source,
      await analyzer.analyzeReferenceImage({
        source,
        allSources,
        taskInput: request.rawInput,
        prompt,
        context: options.context ?? {},
        skillName: options.skillName,
        artifactType: options.artifactType,
        designSystem: options.designSystem,
      }),
      ambiguityConflict,
    )
    : buildInsufficientAnalysis(
      source,
      ambiguityConflict
        ? [ambiguityConflict, 'No reference image analyzer provider was injected; vision extraction did not run.']
        : ['No reference image analyzer provider was injected; vision extraction did not run.'],
    );

  return {
    source,
    allSources,
    analysis,
    designMd: analysis.status === 'insufficient' ? '' : buildReferenceStyleDesignMd(analysis),
    generationConstraints: buildReferenceGenerationConstraints(analysis),
    qualityItems: buildReferenceQualityItems(analysis, allSources),
    deliveryNotes: buildReferenceDeliveryNotes(analysis, allSources),
    prompt,
  };
}

export function collectReferenceImageSources(request: DesignRequest): ReferenceImageSource[] {
  const metadata = request.metadata ?? {};
  const rawCandidates: ReferenceImageSource[] = [];

  for (const value of collectStringValues(
    metadata['referenceImage'],
    metadata['referenceImagePath'],
    metadata['referenceImageUrl'],
    metadata['reference_image'],
  )) {
    rawCandidates.push(toReferenceImageSource(value, 'metadata'));
  }

  for (const attachment of request.attachments ?? []) {
    if (isImageLikeReference(attachment)) {
      rawCandidates.push(toReferenceImageSource(attachment, 'attachment'));
    }
  }

  for (const value of extractPromptReferenceImages(request.rawInput)) {
    rawCandidates.push(toReferenceImageSource(value, 'prompt'));
  }

  const seen = new Set<string>();
  return rawCandidates
    .sort((a, b) => SOURCE_PRIORITY[a.declaredBy] - SOURCE_PRIORITY[b.declaredBy])
    .filter(candidate => {
      const key = normalizeReferenceUri(candidate.uri);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function findReferenceImageSource(request: DesignRequest): ReferenceImageSource | null {
  return collectReferenceImageSources(request)[0] ?? null;
}

export function buildReferenceImageAnalysisPrompt(
  source: ReferenceImageSource,
  taskInput: string,
  extras: {
    skillName?: string;
    artifactType?: ArtifactType;
    designSystem?: ReferenceDesignSystemContext;
    context?: Record<string, unknown>;
    allSources?: ReferenceImageSource[];
  } = {},
): string {
  const contextSummary = summarizeContext(extras.context ?? {});
  const selectedDesignSystem = extras.designSystem;
  const additionalSources = (extras.allSources ?? []).slice(1).map(item => item.uri);

  return [
    'Analyze the supplied reference image for Claw Design style extraction.',
    '',
    `Reference image: ${source.uri}`,
    `Reference source kind: ${source.kind}`,
    `Declared by: ${source.declaredBy}`,
    additionalSources.length > 0 ? `Additional ignored reference images that must be treated as ambiguity/conflict context: ${additionalSources.join(', ')}` : '',
    `Task input: ${taskInput}`,
    extras.skillName ? `Target skill: ${extras.skillName}` : '',
    extras.artifactType ? `Artifact type: ${extras.artifactType}` : '',
    selectedDesignSystem ? `Selected DESIGN.md: ${selectedDesignSystem.name} (${selectedDesignSystem.id}, ${selectedDesignSystem.source})` : '',
    selectedDesignSystem ? `Base palette: ${selectedDesignSystem.tokens.colors.join(', ')}` : '',
    selectedDesignSystem ? `Base typography: ${selectedDesignSystem.tokens.fonts.join(' | ')}` : '',
    selectedDesignSystem ? `Base layout constraints: ${selectedDesignSystem.tokens.layoutConstraints.join(' | ')}` : '',
    selectedDesignSystem ? `Base forbidden rules: ${selectedDesignSystem.tokens.forbiddenRules.join(' | ')}` : '',
    contextSummary ? `Explicit task constraints/context: ${contextSummary}` : '',
    '',
    'Return only structured JSON with these fields:',
    '{',
    '  "status": "complete | partial | insufficient",',
    '  "palette": ["#RRGGBB", "..."],',
    '  "paletteDescription": "short explanation of dominant color mood",',
    '  "layout": { "direction": "horizontal | vertical | grid | split | centered | unknown", "proportions": "ratio and spacing notes", "visualFocus": "where the eye lands first" },',
    '  "typography": { "style": "type style", "density": "low | medium | high | unknown", "hierarchy": "heading/body relationship", "alignment": "left | center | right | mixed" },',
    '  "informationDensity": "low | medium | high | unknown",',
    '  "borrowableFeatures": ["style traits that can be reused"],',
    '  "nonBorrowableElements": ["specific content, logos, trademarks, or brand assets that must not be copied"],',
    '  "conflicts": ["conflicts with explicit user requirements, ambiguity between reference images, or the selected design system"],',
    '  "missingDimensions": ["dimensions that could not be extracted reliably"],',
    '  "notes": ["short caveats"]',
    '}',
    '',
    'Extract style direction only. Do not request pixel-level replication, logo copying, trademark reuse, or direct copying of specific content from the image.',
  ].filter(Boolean).join('\n');
}

export function buildReferenceStyleDesignMd(analysis: ReferenceStyleAnalysis): string {
  const palette = buildSemanticPaletteLines(analysis.palette);
  const borrowable = analysis.borrowableFeatures.length > 0
    ? analysis.borrowableFeatures
    : ['Use only the high-level style direction inferred from the reference image.'];
  const nonBorrowable = analysis.nonBorrowableElements.length > 0
    ? analysis.nonBorrowableElements
    : ['Do not copy logos, trademarks, exact content, proprietary illustrations, or pixel layout from the reference image.'];

  return [
    '# Reference Image Style Overlay',
    '',
    '## Design System Name',
    'Reference Image Style Overlay',
    '',
    '## Applicable Scenarios',
    '- Applies only to the current generation task when a reference image is supplied.',
    '- Use for style direction consistency, not pixel-level or brand/content copying.',
    '',
    '## Brand Colors / Palette',
    ...palette,
    analysis.paletteDescription ? `- Palette direction: ${analysis.paletteDescription}` : '',
    '',
    '## Font Stack',
    '- Keep the current DESIGN.md font stacks; only shift the mood, weight, and density toward the reference image.',
    '',
    '## Type Scale',
    `- Typography style: ${analysis.typography.style || 'unknown'}`,
    `- Typography density: ${analysis.typography.density}`,
    `- Hierarchy: ${analysis.typography.hierarchy || 'unknown'}`,
    `- Alignment: ${analysis.typography.alignment || 'unknown'}`,
    '',
    '## Spacing System',
    `- Information density: ${analysis.informationDensity}`,
    `- Layout proportions: ${analysis.layout.proportions || 'unknown'}`,
    '- Preserve the current DESIGN.md spacing and radius token system unless an explicit stricter density direction is stated here.',
    '',
    '## Component Library Path or Component Description',
    '- Components remain generated by Claw Design; this overlay only constrains visual direction.',
    '- Prefer existing component classes and tokens over one-off values.',
    '',
    '## Layout Constraints',
    `- Layout direction: ${analysis.layout.direction || 'unknown'}`,
    `- Visual focus: ${analysis.layout.visualFocus || 'unknown'}`,
    `- Information density: ${analysis.informationDensity}`,
    ...borrowable.map(feature => `- Borrowable reference trait: ${feature}`),
    '- Priority: explicit user requirements > selected DESIGN.md/brand package hard constraints > reference image style overlay > default aesthetics.',
    '',
    '## Reference Examples',
    `- Generate a current-task artifact with ${analysis.layout.direction || 'unknown'} composition, ${analysis.informationDensity} information density, and typography that feels ${analysis.typography.style || 'consistent with the reference'}.`,
    '',
    '## Forbidden Rules',
    '- Do not perform pixel-level replication of the reference image.',
    ...nonBorrowable.map(item => `- Do not copy reference-specific element: ${item}`),
    '- Do not silently ignore conflicts; keep the stated priority order visible in task metadata.',
  ].join('\n');
}

function buildReferenceGenerationConstraints(analysis: ReferenceStyleAnalysis): string[] {
  if (analysis.status === 'insufficient') {
    return [`Reference image "${analysis.source.uri}" was supplied but could not be converted into stable style constraints.`];
  }

  return [
    `Use reference image style overlay for this task only: ${analysis.source.uri}`,
    analysis.palette.length > 0 ? `Reference palette direction: ${analysis.palette.join(', ')}` : '',
    `Reference layout direction: ${analysis.layout.direction}; proportions: ${analysis.layout.proportions}; visual focus: ${analysis.layout.visualFocus}`,
    `Reference typography: ${analysis.typography.style}; density: ${analysis.typography.density}; hierarchy: ${analysis.typography.hierarchy}; alignment: ${analysis.typography.alignment}`,
    `Reference information density: ${analysis.informationDensity}`,
    'Borrow only style traits; do not copy logos, brand marks, exact content, or pixel layout from the reference image.',
    'Resolve conflicts by priority: explicit user requirements > selected DESIGN.md/brand package hard constraints > reference image style overlay > default aesthetics.',
  ].filter(Boolean);
}

function buildReferenceQualityItems(
  analysis: ReferenceStyleAnalysis,
  sources: ReferenceImageSource[],
): QualityItem[] {
  const items: QualityItem[] = [{
    rule: 'reference-style:source',
    passed: analysis.status !== 'insufficient',
    severity: analysis.status === 'insufficient' ? 'warn' : 'info',
    message: analysis.status === 'insufficient'
      ? `Reference image supplied (${analysis.source.uri}) but style extraction is insufficient.`
      : `Reference image style extracted from ${analysis.source.uri}.`,
  }];

  if (sources.length > 1) {
    items.push({
      rule: 'reference-style:multiple-sources',
      passed: false,
      severity: 'warn',
      message: `Multiple reference images were supplied. Using ${sources[0]?.uri}; ignored: ${sources.slice(1).map(item => item.uri).join(', ')}.`,
    });
  }

  if (analysis.missingDimensions.length > 0) {
    items.push({
      rule: 'reference-style:missing-dimensions',
      passed: false,
      severity: 'warn',
      message: `Reference style extraction missing dimensions: ${analysis.missingDimensions.join(', ')}.`,
    });
  }

  if (analysis.conflicts.length > 0) {
    items.push({
      rule: 'reference-style:conflicts',
      passed: false,
      severity: 'warn',
      message: `Reference style conflicts resolved by priority order: ${analysis.conflicts.join('; ')}`,
    });
  }

  items.push({
    rule: 'reference-style:no-copying',
    passed: true,
    severity: 'info',
    message: 'Reference image is used for style direction only; exact content, logos, brand marks, and pixel-level copying are forbidden.',
  });

  return items;
}

function buildReferenceDeliveryNotes(
  analysis: ReferenceStyleAnalysis,
  sources: ReferenceImageSource[],
): string[] {
  return [
    `Reference image: ${analysis.source.uri}`,
    `Reference extraction status: ${analysis.status}`,
    sources.length > 1 ? `Ignored additional reference images: ${sources.slice(1).map(item => item.uri).join(', ')}` : '',
    analysis.palette.length > 0 ? `Reference palette: ${analysis.palette.join(', ')}` : '',
    `Reference layout: ${analysis.layout.direction}; ${analysis.layout.proportions}`,
    `Reference typography density: ${analysis.typography.density}`,
    analysis.missingDimensions.length > 0 ? `Missing reference dimensions: ${analysis.missingDimensions.join(', ')}` : '',
    analysis.conflicts.length > 0 ? `Reference conflicts: ${analysis.conflicts.join('; ')}` : '',
  ].filter(Boolean);
}

function normalizeReferenceStyleAnalysis(
  source: ReferenceImageSource,
  incoming: Partial<ReferenceStyleAnalysis> | null,
  ambiguityConflict: string | null,
): ReferenceStyleAnalysis {
  if (!incoming) return buildInsufficientAnalysis(source, ambiguityConflict ? [ambiguityConflict, 'Reference image analyzer returned no result.'] : ['Reference image analyzer returned no result.']);

  const analysis: ReferenceStyleAnalysis = {
    source,
    status: normalizeStatus(incoming.status),
    palette: normalizePalette(incoming.palette),
    paletteDescription: normalizeText(incoming.paletteDescription),
    layout: {
      direction: normalizeText(incoming.layout?.direction) || 'unknown',
      proportions: normalizeText(incoming.layout?.proportions),
      visualFocus: normalizeText(incoming.layout?.visualFocus),
    },
    typography: {
      style: normalizeText(incoming.typography?.style),
      density: normalizeDensity(incoming.typography?.density),
      hierarchy: normalizeText(incoming.typography?.hierarchy),
      alignment: normalizeText(incoming.typography?.alignment),
    },
    informationDensity: normalizeDensity(incoming.informationDensity),
    borrowableFeatures: normalizeStringArray(incoming.borrowableFeatures),
    nonBorrowableElements: normalizeStringArray(incoming.nonBorrowableElements),
    conflicts: normalizeStringArray(incoming.conflicts),
    missingDimensions: normalizeStringArray(incoming.missingDimensions),
    notes: normalizeStringArray(incoming.notes),
  };

  if (ambiguityConflict) analysis.conflicts.unshift(ambiguityConflict);
  analysis.missingDimensions = mergeMissingDimensions(analysis);
  if (analysis.status === 'complete' && analysis.missingDimensions.length > 0) analysis.status = 'partial';
  if (analysis.status === 'partial' && analysis.missingDimensions.length === REQUIRED_DIMENSIONS.length) analysis.status = 'insufficient';
  return analysis;
}

function buildInsufficientAnalysis(source: ReferenceImageSource, notes: string[]): ReferenceStyleAnalysis {
  return {
    source,
    status: 'insufficient',
    palette: [],
    paletteDescription: '',
    layout: { direction: 'unknown', proportions: '', visualFocus: '' },
    typography: { style: '', density: 'unknown', hierarchy: '', alignment: '' },
    informationDensity: 'unknown',
    borrowableFeatures: [],
    nonBorrowableElements: [],
    conflicts: notes.filter(note => note.startsWith('Multiple reference images were supplied.')),
    missingDimensions: [...REQUIRED_DIMENSIONS],
    notes,
  };
}

function mergeMissingDimensions(analysis: ReferenceStyleAnalysis): string[] {
  const missing = new Set(analysis.missingDimensions);
  if (analysis.palette.length === 0) missing.add('palette');
  if (!analysis.layout.direction || analysis.layout.direction === 'unknown') missing.add('layout.direction');
  if (!analysis.layout.proportions) missing.add('layout.proportions');
  if (!analysis.layout.visualFocus) missing.add('layout.visualFocus');
  if (!analysis.typography.style) missing.add('typography.style');
  if (analysis.typography.density === 'unknown') missing.add('typography.density');
  if (analysis.informationDensity === 'unknown') missing.add('informationDensity');
  return [...missing];
}

function collectStringValues(...values: unknown[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      result.push(value.trim());
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) result.push(item.trim());
      }
    }
  }
  return result;
}

function extractPromptReferenceImages(input: string): string[] {
  const matches = Array.from(input.matchAll(/\[reference-image:\s*([^\]]+)\]/gi)).map(match => match[1]?.trim() ?? '').filter(Boolean);
  const inline = input.match(/(?:referenceImage|reference_image)\s*[:=]\s*(\S+)/i)?.[1]?.trim();
  return inline ? [...matches, inline] : matches;
}

function toReferenceImageSource(uri: string, declaredBy: ReferenceImageDeclaredBy): ReferenceImageSource {
  return {
    uri,
    kind: /^https?:\/\//i.test(uri) || /^data:image\//i.test(uri) ? 'url' : 'path',
    declaredBy,
  };
}

function isImageLikeReference(value: string): boolean {
  if (/^https?:\/\//i.test(value)) return /\.(?:png|jpe?g|webp|gif|bmp|svg)(?:[?#].*)?$/i.test(value);
  if (/^data:image\//i.test(value)) return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|svg)$/i.test(value);
}

function normalizeReferenceUri(uri: string): string {
  return uri.trim();
}

function normalizeStatus(value: unknown): ReferenceExtractionStatus {
  return value === 'complete' || value === 'partial' || value === 'insufficient' ? value : 'partial';
}

function normalizeDensity(value: unknown): ReferenceDensity {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'unknown' ? value : 'unknown';
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string' ? item.trim() : '').filter(Boolean);
}

function normalizePalette(value: unknown): string[] {
  return normalizeStringArray(value).filter(color => /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(color));
}

function buildSemanticPaletteLines(colors: string[]): string[] {
  if (colors.length === 0) return ['- Palette fallback: Use current DESIGN.md palette; reference image did not yield stable colors.'];
  if (colors.length === 1) return [`- Canvas: ${colors[0]}`];
  if (colors.length === 2) return [`- Canvas: ${colors[0]}`, `- Primary: ${colors[1]}`];
  return [
    `- Canvas: ${colors[0]}`,
    `- Surface: ${colors[2]}`,
    `- Primary: ${colors[1]}`,
    ...colors.slice(3).map((color, index) => `- Accent ${index + 1}: ${color}`),
  ];
}

function summarizeContext(context: Record<string, unknown>): string {
  const entries = Object.entries(context)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    .filter(([key]) => !/^plugin/i.test(key) && key !== 'referenceImage' && key !== 'referenceImagePath' && key !== 'referenceImageUrl')
    .slice(0, 12)
    .map(([key, value]) => `${key}=${String(value)}`);
  return entries.join('; ');
}
