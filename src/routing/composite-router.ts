import type { DesignRequest, IntentPacket, DesignSkill } from '../types.js';

/** A scoring result from a routing strategy */
export interface RouteCandidate {
  skill: DesignSkill;
  score: number;
  strategy: string;
}

/** Pluggable routing strategy — scores all registered skills against a request */
export interface RoutingStrategy {
  readonly name: string;
  score(request: DesignRequest, skills: DesignSkill[]): RouteCandidate[];
}

/** Keyword-based scoring utility (NOT LLM intent routing — used by CompositeRouter/MultiIntentRouter for heuristic scoring) */
export class ExactMatchStrategy implements RoutingStrategy {
  readonly name = 'exact';

  score(request: DesignRequest, skills: DesignSkill[]): RouteCandidate[] {
    const input = request.rawInput.toLowerCase();
    const candidates: RouteCandidate[] = [];

    for (const skill of skills) {
      if (skill.contract.status === 'retired') continue;
      let hits = 0;
      for (const kw of skill.contract.triggerKeywords) {
        if (input.includes(kw.toLowerCase())) hits++;
      }
      if (hits > 0) {
        candidates.push({ skill, score: hits, strategy: this.name });
      }
    }
    return candidates;
  }
}

/** Fuzzy matching: token overlap + partial substring scoring */
export class FuzzyMatchStrategy implements RoutingStrategy {
  readonly name = 'fuzzy';

  score(request: DesignRequest, skills: DesignSkill[]): RouteCandidate[] {
    const input = request.rawInput.toLowerCase();
    const tokens = input.split(/[\s,;.!?，。；！？]+/).filter(t => t.length > 1);
    const candidates: RouteCandidate[] = [];

    for (const skill of skills) {
      if (skill.contract.status === 'retired') continue;
      let totalScore = 0;

      for (const kw of skill.contract.triggerKeywords) {
        const kwLower = kw.toLowerCase();
        for (const token of tokens) {
          if (token === kwLower) {
            totalScore += 1.0;
          } else if (token.includes(kwLower) || kwLower.includes(token)) {
            totalScore += 0.5;
          }
        }
      }

      // Also score against description words
      const descWords = skill.contract.description.toLowerCase().split(/\s+/);
      for (const token of tokens) {
        if (descWords.includes(token)) totalScore += 0.3;
      }

      if (totalScore > 0) {
        candidates.push({ skill, score: totalScore, strategy: this.name });
      }
    }
    return candidates;
  }
}

/**
 * CompositeRouter — runs multiple RoutingStrategy instances, merges scores,
 * and picks the best match. Exact match acts as highest-priority strategy;
 * fuzzy match provides fallback for ambiguous inputs.
 */
export class CompositeRouter {
  private skills: DesignSkill[] = [];
  private strategies: RoutingStrategy[];

  constructor(strategies?: RoutingStrategy[]) {
    this.strategies = strategies ?? [new ExactMatchStrategy(), new FuzzyMatchStrategy()];
  }

  register(skill: DesignSkill): void {
    this.skills.push(skill);
  }

  registerAll(skills: DesignSkill[]): void {
    skills.forEach(s => this.register(s));
  }

  route(request: DesignRequest): IntentPacket {
    const allCandidates: RouteCandidate[] = [];

    for (const strategy of this.strategies) {
      allCandidates.push(...strategy.score(request, this.skills));
    }

    // Merge scores per skill — exact match scores weighted 2x
    const merged = new Map<string, { skill: DesignSkill; total: number }>();
    for (const c of allCandidates) {
      const weight = c.strategy === 'exact' ? 2.0 : 1.0;
      const existing = merged.get(c.skill.contract.name);
      if (existing) {
        existing.total += c.score * weight;
      } else {
        merged.set(c.skill.contract.name, { skill: c.skill, total: c.score * weight });
      }
    }

    // Sort by total score descending
    const ranked = [...merged.values()].sort((a, b) => b.total - a.total);
    const best = ranked[0] ?? null;

    const maxPossible = this.strategies.length * 3;
    const confidence = best ? Math.min(best.total / maxPossible, 1.0) : 0;

    return {
      taskId: request.taskId,
      primaryType: best?.skill.contract.artifactType ?? 'slides',
      secondaryTypes: [],
      confidence,
      gaps: confidence < 0.3
        ? [{ name: 'intent', reason: 'Cannot determine artifact type', priority: 'required' as const }]
        : [],
      context: request.metadata ?? {},
      matchedSkill: best?.skill.contract.name ?? null,
    };
  }

  getSkillByName(name: string): DesignSkill | undefined {
    return this.skills.find(s => s.contract.name === name);
  }

  listSkills(): string[] {
    return this.skills.map(s => s.contract.name);
  }
}
