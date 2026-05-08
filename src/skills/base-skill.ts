import type { Artifact, ArtifactType, DesignSkill, QualityItem, SkillContract, ThemePack } from '../types.js';

export interface SkillProviderBag extends Record<string, unknown> {}

export interface SkillQualityRuleRef {
  id: string;
  severity?: QualityItem['severity'];
  description?: string;
}

export interface SkillGenerateContext extends Record<string, unknown> {
  taskId?: string;
  providers?: SkillProviderBag;
  qualityRules?: SkillQualityRuleRef[];
}

export interface BaseSkillConfig<
  TType extends ArtifactType,
  TTemplates extends object = Record<string, string>,
> extends Omit<SkillContract, 'artifactType' | 'supportedTypes'> {
  supportedTypes: readonly [TType, ...TType[]];
  templates?: TTemplates;
}

export abstract class BaseSkill<
  TType extends ArtifactType = ArtifactType,
  TContext extends SkillGenerateContext = SkillGenerateContext,
  TTemplates extends object = Record<string, string>,
> implements DesignSkill {
  readonly supportedTypes: TType[];
  readonly contract: SkillContract;
  protected readonly templateMap: Readonly<TTemplates>;

  protected constructor(config: BaseSkillConfig<TType, TTemplates>) {
    this.supportedTypes = [...config.supportedTypes];
    this.templateMap = Object.freeze((config.templates ?? {}) as TTemplates);
    this.contract = {
      ...config,
      artifactType: this.supportedTypes[0],
      supportedTypes: [...this.supportedTypes],
    };
  }

  abstract generate(input: string, theme: ThemePack, context: Record<string, unknown>): Promise<Artifact>;

  protected toContext(context: Record<string, unknown>): TContext {
    return context as TContext;
  }

  protected getTemplates(): TTemplates {
    return { ...this.templateMap } as TTemplates;
  }

  protected getTemplate(name: string): string {
    const templates = this.templateMap as Record<string, string>;
    return templates[name] ?? '';
  }

  protected resolveProvider<T>(context: TContext, ...keys: string[]): T | null {
    const providers = context.providers ?? {};
    for (const key of keys) {
      const direct = context[key];
      if (direct !== undefined && direct !== null) {
        return direct as T;
      }
      const injected = providers[key];
      if (injected !== undefined && injected !== null) {
        return injected as T;
      }
    }
    return null;
  }

  protected getQualityRules(context: TContext): SkillQualityRuleRef[] {
    const rules = context.qualityRules;
    if (!Array.isArray(rules)) return [];

    return rules.filter(isSkillQualityRuleRef);
  }
}

function isSkillQualityRuleRef(value: unknown): value is SkillQualityRuleRef {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string';
}
