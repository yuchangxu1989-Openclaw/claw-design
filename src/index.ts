// Claw Design — Main Entry Point
// Wires all modules: Router → Executor → Quality Gate → Export → Adapter

export type {
  ArtifactType, ArtifactStatus, QualityConclusion, SkillStatus,
  DesignRequest, IntentPacket, GapItem, ThemePack,
  Artifact, QualityItem, QualityReport, DeliveryBundle,
  SkillContract, DesignSkill, HostAdapter, BrandKit,
} from './types.js';

export { IntentRouter, ClarifyNeededError } from './routing/index.js';
export type { IntentRouterOptions } from './routing/index.js';
export { CompositeRouter, ExactMatchStrategy, FuzzyMatchStrategy } from './routing/index.js';
export type { RoutingStrategy, RouteCandidate } from './routing/index.js';
export { KeywordFallbackClassifier } from './routing/index.js';
export type { IntentClassifierProvider, SkillDescription, ClassificationResult } from './routing/index.js';
export { SkillExecutor, buildArtifact, DEFAULT_THEME, discoverSkills, discoverSkillsFromDir } from './execution/index.js';
export { SlidesSkill } from './execution/slides-skill.js';
export { ChartSkill, parseChartInput } from './execution/chart-skill.js';
export { ArchDiagramSkill } from './execution/arch-diagram-skill.js';
export { PrototypeSkill, PROTOTYPE_ROUTE_TEMPLATE, PROTOTYPE_COMPONENT_TEMPLATE, PROTOTYPE_STATE_TEMPLATE } from './skills/prototype-skill.js';
export { renderPrototypeHtml } from './skills/prototype-renderer.js';
export { FlowchartSkill } from './skills/flowchart-skill.js';
export { PosterSkill } from './skills/poster-skill.js';
export { LandingSkill } from './skills/landing-skill.js';
export { VideoEditorSkill, canHandleVideoIntent } from './skills/video-editor-skill.js';
export { renderVideoResultHtml } from './skills/video-editor-renderer.js';
export { UiMockupSkill } from './skills/ui-mockup-skill.js';
export { DashboardSkill } from './skills/dashboard-skill.js';
export { LogicDiagramSkill } from './skills/logic-diagram-skill.js';
export { InfographicSkill } from './skills/infographic-skill.js';
export { BaseSkill } from './skills/base-skill.js';
export type { BaseSkillConfig, SkillGenerateContext, SkillProviderBag, SkillQualityRuleRef } from './skills/base-skill.js';
export { SkillRegistry } from './skills/skill-registry.js';
export { computeFlowchartLayout, renderFlowchartHtml, renderFlowchartSvg } from './skills/flowchart-renderer.js';
export { renderPosterHtml } from './skills/poster-renderer.js';
export { renderLandingHtml } from './skills/landing-renderer.js';
export type {
  FlowNode, FlowEdge, FlowchartLayout, FlowchartConfig, FlowchartPlan,
  FlowchartProviderContext, FlowchartProviderResult, FlowchartContentProvider, FlowchartSkillContext,
} from './skills/flowchart-types.js';
export type {
  PosterColors, PosterConfig, PosterSize, PosterSizeSpec, PosterStyle, PosterTheme,
} from './skills/poster-types.js';
export type {
  LandingAction, LandingColors, LandingConfig, LandingFeatureItem, LandingFeaturesSection,
  LandingFooterLinkGroup, LandingFooterSection, LandingPricingSection, LandingPricingTier,
  LandingSection, LandingSectionType, LandingSkillContext, LandingStat, LandingStyle,
  LandingTestimonialItem, LandingTestimonialsSection, LandingTheme,
} from './skills/landing-types.js';
export type {
  PrototypeConfig, PrototypeStyle, PrototypeTheme, InteractionType,
  PrototypeCardSpec, PrototypeFormFieldSpec, PrototypeTabSpec, PrototypeSectionSpec,
  PrototypeInteractionSpec, PrototypePageSpec,
  PrototypeProviderTemplates, PrototypeProviderContext,
  PrototypeProviderResult, PrototypeContentProvider, PrototypeSkillContext,
} from './skills/prototype-types.js';
export { QualityGateL1 } from './quality/index.js';
export { QualityGateL2Stub, QualityGateL2Impl } from './quality/index.js';
export type { QualityGateL2 } from './quality/index.js';
export { QualityGateL3Stub, QualityGateL3Impl, DEFAULT_ANTI_PATTERN_RULES, HeuristicSemanticValidator } from './quality/index.js';
export type { QualityGateL3, SemanticValidationOptions, SemanticValidator } from './quality/index.js';
export { ExportAdapter } from './export/index.js';
export { OpenClawAdapter } from './adapter/index.js';
export { CLIAdapter } from './adapter/index.js';
export { OpenClawInfraAdapter } from './adapter/index.js';
export { StandaloneAdapter } from './adapter/index.js';
export { createHostAdapter, createInfraAdapter, detectEnvironment } from './adapter/index.js';
export type {
  InfraHostAdapter, HostConfig, ProgressStage, OutputPackage, HostDeliveryResult,
  OpenClawAdapterOptions, EventBus, ProgressEvent,
  StandaloneAdapterOptions, AdapterEnv, AdapterFactoryOptions,
} from './adapter/index.js';
export { DefaultTemplateResolver } from './template/index.js';
export { BrandKitExtractor } from './template/index.js';
export type { TemplateResolver, TemplateDescriptor } from './template/index.js';
export type { BrandKitSource, ExtractedBrandKit } from './template/index.js';
export { TemplateRegistry, validateSlots, BUILT_IN_TEMPLATES } from './templates/index.js';
export type { TemplateMeta, SlotDef, SlotType, TemplateFilter, ValidationResult, ValidationError } from './templates/index.js';
export { DefaultPackagingService } from './packaging/index.js';
export type { PackagingService, PackagingOptions } from './packaging/index.js';
export { PdfExporter } from './packaging/index.js';
export type { PdfExportResult } from './packaging/index.js';
export { ImageExporter } from './packaging/index.js';
export type { ImageExportResult } from './packaging/index.js';
export { PackagingEngine } from './packaging/index.js';
export type { PackagingConfig, PackageFormat, PackageResult } from './packaging/index.js';
export { AssetBundler } from './packaging/index.js';
export type { BundleOptions, ResolvedAsset } from './packaging/index.js';
export { MetadataInjector } from './packaging/index.js';
export type { PackageMetadata } from './packaging/index.js';
export { DeliveryAdapter } from './packaging/index.js';
export type {
  DeliveryChannel, DeliveryResult, DeliveryOptions,
  HttpResponsePayload, MessageAttachmentPayload,
} from './packaging/index.js';
export { HtmlFormatter, SvgFormatter, FormatRegistry } from './output/index.js';
export type { OutputFormatter, OutputFormat, FormatOptions } from './output/index.js';
export { MultiIntentRouter } from './routing/index.js';
export type { IntentSegment, MultiIntentResult, RouteExplanation } from './routing/index.js';
export { ProductionOrchestrator } from './routing/index.js';
export type { OrchestrationPlan, OrchestrationStep, OrchestrationResult, ArtifactWithMeta } from './routing/index.js';
export { RouteObserver } from './routing/index.js';
export type { RouteEvent, RouteStats, RouteAnomaly, RouteOutcome } from './routing/index.js';
export {
  LAYOUT_SKELETONS, getLayoutSkeleton, getLayoutCss,
  BUILT_IN_PALETTES, getPalette, paletteToCssVars, deriveContrastColor,
  DEFAULT_FONT_SCALE, COMPACT_FONT_SCALE, fontSpecToCss, fontScaleToCssBlock, getFontScale,
  TYPOGRAPHY_SYSTEMS, getTypographySystem, getTypographyTokenDeclarations, getTypographyUtilityCss,
  BASE_GRID_UNIT, SPACING_SCALE, BREAKPOINTS, COMPONENT_SPACING,
  getSpacingTokenDeclarations, getSpacingResponsiveCss, getBreakpointMinWidth,
  ENTRANCE_ANIMATIONS, INTERACTION_ANIMATIONS, TIMING_CURVES,
  generateKeyframes, getAnimationTokenDeclarations, getAnimationUtilityCss,
  getIcon, getIconsByCategory, getAllIcons, renderIcon,
  ANTI_PATTERN_RULES, checkAntiPatterns,
} from './skills/shared/index.js';
export type {
  LayoutSlot, LayoutSkeleton, ColorPalette, FontSpec, FontScale,
  TypographyPresetId, HeadingLevel, TypographyLevel, TypographySystem, TypographyCssOptions,
  BreakpointId, BreakpointSpec, SpacingScale, ComponentSpacingSpec,
  EntranceAnimation, InteractionAnimation, TimingCurve, MotionSpec, AnimationKeyframeConfig,
  IconDef, AntiPatternRule, AntiPatternViolation,
} from './skills/shared/index.js';

export {
  DesignSystemRegistry, HardcodedValueDetector, ConstraintInjector,
  VisualVerifier, DARK_SCI_FI_PACKAGE, MAX_RETRY_ATTEMPTS,
} from './design-system/index.js';
export type {
  DesignSystemPackage, DesignTokens, DesignSpacingScale, TypographyScale,
  ComponentClass, ReferencePage, DesignConstraints, ConstraintRule,
  ConstraintViolation, PromptConstraintBlock, VisualVerificationResult,
  GenerationAttempt, ScreenshotProvider, ImageComparator, VisualVerifierOptions,
} from './design-system/index.js';

import { IntentRouter } from './routing/index.js';
import type { IntentRouterOptions } from './routing/index.js';
import type { IntentClassifierProvider } from './routing/index.js';
import { ClarifyNeededError } from './routing/index.js';
import { SkillRegistry } from './skills/skill-registry.js';
import { SkillExecutor, DEFAULT_THEME } from './execution/index.js';
import { QualityGateL1 } from './quality/index.js';
import { QualityGateL2Impl } from './quality/index.js';
import { QualityGateL3Impl } from './quality/index.js';
import { SlopChecker } from './quality/index.js';
import { ExportAdapter } from './export/index.js';
import { OpenClawAdapter } from './adapter/index.js';
import type { ThemePack, DeliveryBundle, QualityReport, QualityConclusion, DesignSkill } from './types.js';
import type { SemanticValidator } from './quality/index.js';

export interface PipelineResult {
  bundle: DeliveryBundle | null;
  quality: QualityReport;
  deliveryMessage: string;
}

export interface CreatePipelineOptions {
  semanticValidator?: SemanticValidator;
  /** LLM intent classifier injected by host. Omit for keyword fallback (degraded). */
  classifierProvider?: IntentClassifierProvider;
  /** Additional skills to register beyond auto-discovered built-ins */
  additionalSkills?: DesignSkill[];
}

/**
 * Create a fully wired Claw Design pipeline.
 *
 * Skills are auto-discovered from built-in directories (no manual `new Skill()`).
 * Intent routing uses LLM semantic classification when a classifierProvider is injected;
 * falls back to keyword matching (degraded mode) otherwise.
 */
export async function createPipeline(theme?: ThemePack, options: CreatePipelineOptions = {}) {
  const registry = new SkillRegistry();

  // 1. Auto-discover built-in skills from execution/ and skills/ directories
  await registry.discoverBuiltIn();

  // 2. Auto-discover external skills (execution/skills/ subdirectory)
  await registry.discoverAndRegister();

  // 3. Register host-injected additional skills
  if (options.additionalSkills) {
    registry.registerAll(options.additionalSkills);
  }

  // 4. Construct IntentRouter with LLM provider (or fallback)
  const router = new IntentRouter({
    classifierProvider: options.classifierProvider,
    skills: registry.list(),
  });

  const executor = new SkillExecutor(router);
  const qualityGate = new QualityGateL1();
  const qualityGateL2 = new QualityGateL2Impl();
  const qualityGateL3 = new QualityGateL3Impl(options.semanticValidator);
  const slopChecker = new SlopChecker();
  const exporter = new ExportAdapter();
  const adapter = new OpenClawAdapter();

  const activeTheme = theme ?? DEFAULT_THEME;

  return {
    router,
    registry,
    executor,
    qualityGate,
    exporter,
    adapter,

    async run(rawInput: string | unknown, outputDir = './output'): Promise<PipelineResult> {
      // 1. Adapt input
      const request = await adapter.adapt(rawInput);

      // 2. Route intent (async — LLM primary, keyword fallback)
      const intent = await router.route(request);

      // 3. Handle low confidence — per arc42 §6.1 Clarify flow
      const hasRequiredGaps = intent.gaps.some(g => g.priority === 'required');
      if (intent.confidence < 0.3 && hasRequiredGaps) {
        const filled = await adapter.clarify(intent.gaps);
        if (Object.keys(filled).length === 0) {
          throw new ClarifyNeededError(request.taskId, intent.confidence, intent.gaps);
        }
        Object.assign(intent.context, filled);
      } else if (intent.gaps.length > 0) {
        const filled = await adapter.clarify(intent.gaps);
        Object.assign(intent.context, filled);
      }

      // 4. Execute skill
      const artifact = await executor.execute(intent, request.rawInput, activeTheme);
      artifact.metadata['qualityContext'] = {
        requestInput: request.rawInput,
        theme: activeTheme,
        semanticValidation: request.metadata?.['semanticValidation'],
        allowStyleExceptions: request.metadata?.['allowStyleExceptions'],
      };

      // 5. Quality check — L1 (sync) then L2/L3 (async) if L1 passes
      const l1Report = qualityGate.check(artifact);
      let quality: QualityReport = l1Report;

      if (l1Report.conclusion !== 'block') {
        const l2Report = await qualityGateL2.check(artifact);
        const l3Report = await qualityGateL3.check(artifact, {
          requestInput: request.rawInput,
          semanticValidation: request.metadata?.['semanticValidation'] as { enabled?: boolean; userAcknowledgedCost?: boolean } | undefined,
        });
        const mergedItems = [...l1Report.items, ...l2Report.items, ...l3Report.items];
        const hasBlock = mergedItems.some(i => !i.passed && i.severity === 'block');
        const hasWarn = mergedItems.some(i => !i.passed && i.severity === 'warn');
        let conclusion: QualityConclusion = 'pass';
        if (hasBlock) conclusion = 'block';
        else if (hasWarn) conclusion = 'warn';
        quality = {
          taskId: artifact.taskId,
          conclusion,
          items: mergedItems,
          checkedAt: new Date().toISOString(),
        };
      }

      // 5b. Slop check — runs after brand constraint checks (FR-D11 AC1/AC7)
      if (quality.conclusion !== 'block') {
        const slopResult = slopChecker.check(artifact.html ?? '');
        if (!slopResult.passed) {
          // Convert slop blockers to quality items
          for (const v of slopResult.blockers) {
            quality.items.push({
              rule: `slop:${v.ruleId}`,
              passed: false,
              severity: 'block',
              message: `[Slop] ${v.ruleName}: ${v.message}`,
            });
          }
          quality.conclusion = 'block';
        }
        // Add warnings regardless
        for (const v of slopResult.warnings) {
          quality.items.push({
            rule: `slop:${v.ruleId}`,
            passed: false,
            severity: 'warn',
            message: `[Slop] ${v.ruleName}: ${v.message}`,
          });
        }
        if (slopResult.warnings.length > 0 && quality.conclusion === 'pass') {
          quality.conclusion = 'warn';
        }
      }

      // 6. Export (only if not blocked)
      let bundle: DeliveryBundle | null = null;
      if (quality.conclusion !== 'block') {
        bundle = await exporter.export(artifact, activeTheme, outputDir);
        bundle.qualitySummary = quality.conclusion;
        if (bundle.consistency) {
          quality.items.push(...bundle.consistency.items);
          const hasBlock = quality.items.some(i => !i.passed && i.severity === 'block');
          const hasWarn = quality.items.some(i => !i.passed && i.severity === 'warn');
          quality.conclusion = hasBlock ? 'block' : hasWarn ? 'warn' : 'pass';
          bundle.qualitySummary = quality.conclusion;
        }
      }

      // 7. Deliver
      const deliveryResult = bundle
        ? await adapter.deliver(bundle)
        : { success: false, message: `Blocked by quality gate: ${quality.items.filter(i => !i.passed && i.severity === 'block').map(i => i.message).join('; ')}` };

      return { bundle, quality, deliveryMessage: deliveryResult.message };
    },
  };
}
