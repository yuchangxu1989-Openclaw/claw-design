import type { Artifact, ThemePack, DesignSkill } from '../types.js';
import type { MultiIntentResult, IntentSegment } from './multi-intent-router.js';

export interface OrchestrationPlan {
  taskId: string;
  steps: OrchestrationStep[];
  sharedContext: Record<string, unknown>;
}

export interface OrchestrationStep {
  index: number;
  segment: IntentSegment;
  dependsOn: number[];
  status: 'pending' | 'running' | 'done' | 'failed';
}

export interface OrchestrationResult {
  taskId: string;
  artifacts: ArtifactWithMeta[];
  sharedContext: Record<string, unknown>;
}

export interface ArtifactWithMeta {
  artifact: Artifact;
  stepIndex: number;
  usage: string;
  recommendedScene: string;
  order: number;
}

export class ProductionOrchestrator {
  private skillMap = new Map<string, DesignSkill>();

  registerSkill(name: string, skill: DesignSkill): void {
    this.skillMap.set(name, skill);
  }

  registerAll(skills: DesignSkill[]): void {
    for (const s of skills) this.skillMap.set(s.contract.name, s);
  }

  buildPlan(result: MultiIntentResult): OrchestrationPlan {
    const depMap = new Map<number, number[]>();
    for (const [from, to] of result.dependencies) {
      const existing = depMap.get(to) ?? [];
      existing.push(from);
      depMap.set(to, existing);
    }

    const steps: OrchestrationStep[] = result.segments.map((seg, i) => ({
      index: i,
      segment: seg,
      dependsOn: depMap.get(i) ?? [],
      status: 'pending' as const,
    }));

    return { taskId: result.taskId, steps, sharedContext: {} };
  }

  async execute(
    plan: OrchestrationPlan,
    theme: ThemePack,
    inputText: string,
  ): Promise<OrchestrationResult> {
    const artifacts: ArtifactWithMeta[] = [];
    const completed = new Set<number>();

    const sortedSteps = this.topologicalSort(plan.steps);

    for (const step of sortedSteps) {
      const allDepsReady = step.dependsOn.every(d => completed.has(d));
      if (!allDepsReady) {
        step.status = 'failed';
        continue;
      }

      step.status = 'running';
      const skill = this.skillMap.get(step.segment.matchedSkill);
      if (!skill) {
        step.status = 'failed';
        continue;
      }

      const context: Record<string, unknown> = {
        ...plan.sharedContext,
        taskId: plan.taskId,
        stepIndex: step.index,
        totalSteps: plan.steps.length,
      };

      const prevArtifacts = artifacts.filter(a => step.dependsOn.includes(a.stepIndex));
      if (prevArtifacts.length > 0) {
        context.previousArtifacts = prevArtifacts.map(a => ({
          type: a.artifact.type,
          html: a.artifact.html,
        }));
      }

      try {
        const artifact = await skill.generate(step.segment.text || inputText, theme, context);
        step.status = 'done';
        completed.add(step.index);

        artifacts.push({
          artifact,
          stepIndex: step.index,
          usage: this.inferUsage(step.segment),
          recommendedScene: this.inferScene(step.segment),
          order: step.index + 1,
        });
      } catch {
        step.status = 'failed';
      }
    }

    return { taskId: plan.taskId, artifacts, sharedContext: plan.sharedContext };
  }

  private topologicalSort(steps: OrchestrationStep[]): OrchestrationStep[] {
    const sorted: OrchestrationStep[] = [];
    const visited = new Set<number>();
    const visiting = new Set<number>();
    const stepMap = new Map(steps.map(s => [s.index, s]));

    const visit = (index: number) => {
      if (visited.has(index)) return;
      if (visiting.has(index)) return;
      visiting.add(index);
      const step = stepMap.get(index);
      if (step) {
        for (const dep of step.dependsOn) visit(dep);
        sorted.push(step);
      }
      visiting.delete(index);
      visited.add(index);
    };

    for (const step of steps) visit(step.index);
    return sorted;
  }

  private inferUsage(segment: IntentSegment): string {
    const usageMap: Partial<Record<string, string>> = {
      slides: '汇报演示',
      chart: '数据展示',
      'arch-diagram': '技术文档',
      flowchart: '流程说明',
      poster: '宣传传播',
      'landing-page': '产品展示',
      prototype: '交互验证',
      'ui-mockup': '界面设计',
      dashboard: '数据监控',
      infographic: '信息图示',
      'logic-diagram': '逻辑梳理',
      video: '视频制作',
    };
    return usageMap[segment.primaryType] ?? '通用交付';
  }

  private inferScene(segment: IntentSegment): string {
    const sceneMap: Partial<Record<string, string>> = {
      slides: '会议汇报、方案评审',
      chart: '经营分析、数据报告',
      'arch-diagram': '技术评审、系统文档',
      flowchart: '流程培训、操作手册',
      poster: '活动推广、社交媒体',
      'landing-page': '产品发布、营销推广',
      prototype: '需求评审、用户测试',
      'ui-mockup': '需求沟通、设计评审',
      dashboard: '运营监控、管理驾驶舱',
      infographic: '内容传播、知识科普',
      'logic-diagram': '技术方案、逻辑验证',
      video: '品牌宣传、产品演示',
    };
    return sceneMap[segment.primaryType] ?? '通用场景';
  }
}
