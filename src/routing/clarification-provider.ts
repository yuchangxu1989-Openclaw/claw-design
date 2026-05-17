// ClarificationProvider — content layer per arc42 §5.2.1
// Engine handles rounds/convergence; Provider supplies what to ask.

import type {
  ClarificationGap,
  ClarificationStage,
  DecisionFactorType,
  DefaultPolicy,
  GapLevel,
} from './clarification-types.js';

export interface ClarificationProvider {
  stage: ClarificationStage;
  skillType?: string;
  getGapTemplate(): ClarificationGap[];
  getDecisionFactors(): DecisionFactorType[];
  getDefaultPolicy(gapLevel: GapLevel): DefaultPolicy;
}

/** Default routing-stage provider — covers the 8 decision factors from FR-A09 AC1 */
export class DefaultClarificationProvider implements ClarificationProvider {
  readonly stage: ClarificationStage = 'routing';

  getGapTemplate(): ClarificationGap[] {
    return DEFAULT_ROUTING_GAPS.map(g => ({ ...g }));
  }

  getDecisionFactors(): DecisionFactorType[] {
    return DEFAULT_ROUTING_GAPS.map(g => g.decisionFactorType);
  }

  getDefaultPolicy(gapLevel: GapLevel): DefaultPolicy {
    return gapLevel === 'MUST' ? 'auto_adopt_on_timeout' : 'skip';
  }
}

const DEFAULT_ROUTING_GAPS: ClarificationGap[] = [
  { gapLevel: 'MUST', decisionFactorType: 'audience', description: '目标受众', defaultValue: '通用商务受众', defaultPolicy: 'auto_adopt_on_timeout' },
  { gapLevel: 'MUST', decisionFactorType: 'content_scope', description: '内容范围', defaultValue: null, defaultPolicy: 'auto_adopt_on_timeout' },
  { gapLevel: 'MUST', decisionFactorType: 'delivery_format', description: '交付格式', defaultValue: 'slides', defaultPolicy: 'auto_adopt_on_timeout' },
  { gapLevel: 'SHOULD', decisionFactorType: 'style', description: '风格偏好', defaultValue: '简洁商务', defaultPolicy: 'skip' },
  { gapLevel: 'SHOULD', decisionFactorType: 'brand_tone', description: '品牌调性', defaultValue: '专业', defaultPolicy: 'skip' },
  { gapLevel: 'SHOULD', decisionFactorType: 'color_preference', description: '色彩倾向', defaultValue: null, defaultPolicy: 'skip' },
  { gapLevel: 'SHOULD', decisionFactorType: 'info_density', description: '信息密度', defaultValue: '中等', defaultPolicy: 'skip' },
  { gapLevel: 'SHOULD', decisionFactorType: 'use_case', description: '使用场景', defaultValue: '内部汇报', defaultPolicy: 'skip' },
];
