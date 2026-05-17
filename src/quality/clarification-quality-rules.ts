// Clarification Quality Rules — L1 interactive prototype integrity checks (FR-A09)
// Validates HTML prototypes for event binding, routing, state consistency.

import type { Artifact } from '../types.js';

export interface ClarificationRuleResult {
  rule: string;
  passed: boolean;
  severity: 'block' | 'warn' | 'info';
  message: string;
}

export function checkEventBindingIntegrity(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';
  const hasDataAction = /data-action\s*=\s*["']([^"']+)["']/gi.test(html);

  if (!hasDataAction) {
    return {
      rule: 'event-binding-integrity',
      passed: true,
      severity: 'info',
      message: 'No data-action elements found',
    };
  }

  const actionMatches = [...html.matchAll(/data-action\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
  const hasScript = /<script[\s>]/i.test(html);
  const hasEventHandlers = hasScript && /addEventListener|on\w+\s*=|\.on\(/i.test(html);

  if (!hasEventHandlers) {
    return {
      rule: 'event-binding-integrity',
      passed: false,
      severity: 'block',
      message: `Found ${actionMatches.length} data-action element(s) but no event handlers`,
    };
  }

  return {
    rule: 'event-binding-integrity',
    passed: true,
    severity: 'info',
    message: `Event bindings present for ${actionMatches.length} action(s)`,
  };
}

export function checkRouteTableDomConsistency(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';

  const routeMatch = html.match(/routes\s*=\s*\{([^}]+)\}/i);
  if (!routeMatch) {
    return {
      rule: 'route-table-dom-consistency',
      passed: true,
      severity: 'info',
      message: 'No routes object found',
    };
  }

  const routeKeys = [...routeMatch[1].matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map(m => m[1]);
  const pageMatches = [...html.matchAll(/data-page\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);

  const missingPages = routeKeys.filter(key => !pageMatches.includes(key));

  if (missingPages.length > 0) {
    return {
      rule: 'route-table-dom-consistency',
      passed: false,
      severity: 'block',
      message: `Routes without matching [data-page]: ${missingPages.join(', ')}`,
    };
  }

  return {
    rule: 'route-table-dom-consistency',
    passed: true,
    severity: 'info',
    message: `All ${routeKeys.length} routes have matching data-page sections`,
  };
}

export function checkNavigationLinkValidity(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';
  const linkMatches = [...html.matchAll(/href\s*=\s*["']#\/([^"']*)["']/gi)].map(m => m[1]);

  if (linkMatches.length === 0) {
    return {
      rule: 'navigation-link-validity',
      passed: true,
      severity: 'info',
      message: 'No hash navigation links found',
    };
  }

  const routeMatch = html.match(/routes\s*=\s*\{([^}]+)\}/i);
  const routeKeys = routeMatch
    ? [...routeMatch[1].matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map(m => m[1])
    : [];

  const deadLinks = linkMatches.filter(link => link && !routeKeys.includes(link));

  if (deadLinks.length > 0) {
    return {
      rule: 'navigation-link-validity',
      passed: false,
      severity: 'warn',
      message: `Dead links found: ${deadLinks.map(l => '#/' + l).join(', ')}`,
    };
  }

  return {
    rule: 'navigation-link-validity',
    passed: true,
    severity: 'info',
    message: 'All navigation links are valid',
  };
}

export function checkStateTargetExistence(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';
  const targetMatches = [...html.matchAll(/data-state-target\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);

  if (targetMatches.length === 0) {
    return {
      rule: 'state-target-existence',
      passed: true,
      severity: 'info',
      message: 'No data-state-target elements found',
    };
  }

  const componentMatches = [...html.matchAll(/data-component\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
  const missingTargets = targetMatches.filter(target => !componentMatches.includes(target));

  if (missingTargets.length > 0) {
    return {
      rule: 'state-target-existence',
      passed: false,
      severity: 'block',
      message: `State targets without matching components: ${missingTargets.join(', ')}`,
    };
  }

  return {
    rule: 'state-target-existence',
    passed: true,
    severity: 'info',
    message: `All ${targetMatches.length} state targets have matching components`,
  };
}

export function checkStateDeadLoop(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';

  const stateActions: { state: string; target: string }[] = [];
  const actionPattern = /data-action\s*=\s*["']change-state["']/gi;
  let match;
  while ((match = actionPattern.exec(html)) !== null) {
    const start = match.index;
    const searchWindow = html.slice(start, start + 200);
    const stateMatch = searchWindow.match(/data-state\s*=\s*["']([^"']+)["']/);
    const targetMatch = searchWindow.match(/data-state-target\s*=\s*["']([^"']+)["']/);
    if (stateMatch && targetMatch) {
      stateActions.push({ state: stateMatch[1], target: targetMatch[1] });
    }
  }

  if (stateActions.length === 0) {
    return {
      rule: 'state-dead-loop',
      passed: true,
      severity: 'info',
      message: 'No state transitions found',
    };
  }

  const uniqueStates = new Set(stateActions.map(a => a.state));
  const uniqueTargets = new Set(stateActions.map(a => a.target));

  if (stateActions.length === 1 && uniqueStates.size === 1) {
    return {
      rule: 'state-dead-loop',
      passed: false,
      severity: 'block',
      message: 'State dead loop detected: single self-referencing transition',
    };
  }

  if (stateActions.length > 1 && uniqueStates.size === 1 && uniqueTargets.size === 1) {
    return {
      rule: 'state-dead-loop',
      passed: false,
      severity: 'block',
      message: 'State dead loop detected: all transitions lead to same state',
    };
  }

  return {
    rule: 'state-dead-loop',
    passed: true,
    severity: 'info',
    message: 'No state dead loops detected',
  };
}

export function checkPageReachability(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';

  const routeMatch = html.match(/routes\s*=\s*\{([^}]+)\}/i);
  if (!routeMatch) {
    return {
      rule: 'page-reachability',
      passed: true,
      severity: 'info',
      message: 'No routes object found',
    };
  }

  const routeKeys = [...routeMatch[1].matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map(m => m[1]);
  const defaultKey = routeMatch[1].match(/(?:^|[,\s])default\s*:/)?.[0]?.replace(/[\s,:]*/g, '').replace('default', '');
  const defaultRoute = routeMatch[1].match(/default:\s*["']([^"']+)["']/)?.[1] ?? routeKeys[0];

  if (!defaultRoute) {
    return {
      rule: 'page-reachability',
      passed: true,
      severity: 'info',
      message: 'No default route specified',
    };
  }

  const navLinkMatches = [...html.matchAll(/href\s*=\s*["']#\/([^"']+)["']/gi)].map(m => m[1]);
  const reachable = new Set<string>([defaultRoute, ...navLinkMatches]);

  const pagesToCheck = routeKeys.filter(key => key !== 'default' && key !== defaultRoute);
  const unreachable = pagesToCheck.filter(key => !reachable.has(key));

  if (unreachable.length > 0) {
    return {
      rule: 'page-reachability',
      passed: false,
      severity: 'warn',
      message: `Unreachable pages: ${unreachable.join(', ')}`,
    };
  }

  return {
    rule: 'page-reachability',
    passed: true,
    severity: 'info',
    message: 'All pages are reachable',
  };
}

export function checkDataPageUniqueness(artifact: Artifact): ClarificationRuleResult {
  const html = artifact.html ?? '';
  const pageMatches = [...html.matchAll(/data-page\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);

  if (pageMatches.length === 0) {
    return {
      rule: 'data-page-uniqueness',
      passed: true,
      severity: 'info',
      message: 'No data-page sections found',
    };
  }

  const uniquePages = new Set(pageMatches);
  if (uniquePages.size !== pageMatches.length) {
    const duplicates = pageMatches.filter((page, i) => pageMatches.indexOf(page) !== i);
    return {
      rule: 'data-page-uniqueness',
      passed: false,
      severity: 'block',
      message: `Duplicate data-page ids: ${[...new Set(duplicates)].join(', ')}`,
    };
  }

  return {
    rule: 'data-page-uniqueness',
    passed: true,
    severity: 'info',
    message: `All ${pageMatches.length} data-page ids are unique`,
  };
}

export function checkAllClarificationRules(artifact: Artifact): ClarificationRuleResult[] {
  return [
    checkEventBindingIntegrity(artifact),
    checkRouteTableDomConsistency(artifact),
    checkNavigationLinkValidity(artifact),
    checkStateTargetExistence(artifact),
    checkStateDeadLoop(artifact),
    checkPageReachability(artifact),
    checkDataPageUniqueness(artifact),
  ];
}
