// Claw Design — Core Domain Types

/** Artifact lifecycle: generating → ready ⇄ revision → archived */
export type ArtifactStatus = 'generating' | 'ready' | 'revision' | 'archived';

/** Quality gate conclusion */
export type QualityConclusion = 'pass' | 'warn' | 'block';

/** Supported design artifact types */
export type ArtifactType =
  | 'slides'
  | 'chart'
  | 'arch-diagram'

  | 'flowchart'
  | 'poster'
  | 'landing-page'
  | 'prototype'

  | 'ui-mockup'
  | 'dashboard'
  | 'infographic'
  | 'logic-diagram'

  | 'video';

/** User request standardized by Host Adapter */
export interface DesignRequest {
  taskId: string;
  rawInput: string;
  attachments?: string[];
  locale?: string;
  metadata?: Record<string, unknown>;
}

/** Routing result — what to build, what's missing, which skill to use */
export interface IntentPacket {
  taskId: string;
  primaryType: ArtifactType;
  secondaryTypes: ArtifactType[];
  confidence: number;
  gaps: GapItem[];
  context: Record<string, unknown>;
  matchedSkill: string | null;
  /** true when routed via KeywordFallbackClassifier (degraded mode) */
  degraded?: boolean;
  /** Reasoning from LLM classifier, if available */
  reasoning?: string;
}

export interface GapItem {
  name: string;
  reason: string;
  priority: 'required' | 'optional';
  defaultHint?: string;
}

/** Visual context container */
export interface ThemePack {
  colorPrimary: string;
  colorBg: string;
  fontHeading: string;
  fontBody: string;
  spacingUnit: string;
  radius: string;
  cssVariables: Record<string, string>;
  brandKit?: BrandKit;
  baselineLabel?: string;
}

export interface BrandKit {
  colors?: string[];
  fonts?: string[];
  logo?: {
    required?: boolean;
    alt?: string;
    selectors?: string[];
  };
  layoutRhythm?: {
    maxSectionsPerPage?: number;
  };
  confirmationStatus?: 'provided' | 'inferred' | 'confirmed';
  evidence?: {
    colors?: string[];
    fonts?: string[];
    logos?: string[];
    spacing?: string[];
  };
}

/** Design artifact — the main output of a Skill */
export interface Artifact {
  taskId: string;
  type: ArtifactType;
  status: ArtifactStatus;
  html: string;
  pages: number;
  metadata: Record<string, unknown>;
}

/** Single quality check item */
export interface QualityItem {
  rule: string;
  passed: boolean;
  severity: 'block' | 'warn' | 'info';
  message: string;
  location?: string;
  suggestion?: string;
  group?: string;
}

/** Quality gate output */
export interface QualityReport {
  taskId: string;
  conclusion: QualityConclusion;
  items: QualityItem[];
  checkedAt: string;
}

export interface ExportFormatSnapshot {
  format: 'html' | 'pptx' | 'pdf' | 'png' | 'svg';
  pageCount: number;
  titles: string[];
  keyPoints: string[];
  note?: string;
}

export interface FormatConsistencyReport {
  checkedFormats: Array<ExportFormatSnapshot['format']>;
  items: QualityItem[];
  snapshots: ExportFormatSnapshot[];
}

export interface SemanticValidationConfig {
  enabled?: boolean;
  userAcknowledgedCost?: boolean;
}

export interface SemanticValidationResult {
  provider: string;
  score: number;
  passed: boolean;
  rationale: string;
}

/** Final delivery bundle */
export interface DeliveryBundle {
  taskId: string;
  htmlPath: string;
  pptxPath?: string;
  pdfPath?: string;
  pngPath?: string;
  pngPaths?: string[];
  svgPaths?: string[];
  qualitySummary: QualityConclusion;
  files: string[];
  consistency?: FormatConsistencyReport;
  notes?: string[];
}

/** Skill lifecycle status */
export type SkillStatus = 'registered' | 'active' | 'deprecated' | 'retired';

/** Skill contract — what a Design Skill declares (FR-F01/F02) */
export interface SkillContract {
  name: string;
  artifactType: ArtifactType;
  supportedTypes?: ArtifactType[];
  description: string;
  triggerKeywords: string[];
  /** LLM 路由用：Skill 能力摘要，供 IntentClassifier 读取 */
  capabilities?: string[];
  /** LLM 路由用：示例用户输入，帮助 LLM 理解何时匹配此 Skill */
  examplePrompts?: string[];
  // FR-F01 AC1: applicable scenarios
  applicableScenes?: string[];
  // FR-F01 AC1: input range description
  inputRange?: { minLength?: number; maxLength?: number; acceptsAttachments?: boolean };
  // FR-F02 AC2: required Theme Pack fields
  requiredContext?: string[];
  // FR-F02 AC1: supported output formats beyond HTML
  supportedOutputs?: string[];
  // FR-F01 AC1: quality expectations this skill commits to
  qualityExpectations?: { minPages?: number; maxPages?: number; maxDensityPerPage?: number };
  // FR-F03: lifecycle
  version?: string;
  status?: SkillStatus;
}

/** Design Skill interface — all skills implement this */
export interface DesignSkill {
  readonly contract: SkillContract;
  generate(input: string, theme: ThemePack, context: Record<string, unknown>): Promise<Artifact>;
}

/** Host Adapter interface */
export interface HostAdapter {
  adapt(rawInput: unknown): Promise<DesignRequest>;
  clarify(gaps: GapItem[]): Promise<Record<string, string>>;
  deliver(bundle: DeliveryBundle): Promise<{ success: boolean; message: string }>;
}
