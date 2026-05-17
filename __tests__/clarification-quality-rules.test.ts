// Clarification Quality Rules — unit tests (FR-A09)

import { describe, expect, it } from 'vitest';
import {
  checkEventBindingIntegrity,
  checkRouteTableDomConsistency,
  checkNavigationLinkValidity,
  checkStateTargetExistence,
  checkStateDeadLoop,
  checkPageReachability,
  checkDataPageUniqueness,
  checkAllClarificationRules,
} from '../src/quality/clarification-quality-rules.ts';
import type { Artifact } from '../src/types.ts';

const makeArtifact = (overrides: Partial<Artifact> = {}): Artifact => ({
  taskId: 'clarify-test-001',
  type: 'slides',
  status: 'ready',
  html: '',
  pages: 1,
  metadata: {},
  ...overrides,
});

describe('checkEventBindingIntegrity', () => {
  it('passes when no data-action elements', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkEventBindingIntegrity(artifact);
    expect(result.passed).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('blocks when data-action present but no event handlers', () => {
    const artifact = makeArtifact({
      html: '<html><body><button data-action="submit">Submit</button></body></html>',
    });
    const result = checkEventBindingIntegrity(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('block');
  });

  it('passes when data-action with event handlers', () => {
    const artifact = makeArtifact({
      html: `<html><body><button data-action="submit">Submit</button></body>
        <script>document.querySelector('[data-action]').addEventListener('click', () => {});</script></html>`,
    });
    const result = checkEventBindingIntegrity(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkRouteTableDomConsistency', () => {
  it('passes when no routes object', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkRouteTableDomConsistency(artifact);
    expect(result.passed).toBe(true);
  });

  it('blocks when route has no matching data-page', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>const routes = { home: '/home', about: '/about' };</script>
        <section data-page="home"><p>Home</p></section>
      </body></html>`,
    });
    const result = checkRouteTableDomConsistency(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('block');
  });

  it('passes when all routes have matching data-page', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>const routes = { home: '/home', about: '/about' };</script>
        <section data-page="home"><p>Home</p></section>
        <section data-page="about"><p>About</p></section>
      </body></html>`,
    });
    const result = checkRouteTableDomConsistency(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkNavigationLinkValidity', () => {
  it('passes when no navigation links', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkNavigationLinkValidity(artifact);
    expect(result.passed).toBe(true);
  });

  it('warns when dead navigation links', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>const routes = { home: '/home' };</script>
        <a href="#/about">About</a>
      </body></html>`,
    });
    const result = checkNavigationLinkValidity(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('passes when all links are valid', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>const routes = { home: '/home', about: '/about' };</script>
        <a href="#/home">Home</a>
      </body></html>`,
    });
    const result = checkNavigationLinkValidity(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkStateTargetExistence', () => {
  it('passes when no data-state-target elements', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkStateTargetExistence(artifact);
    expect(result.passed).toBe(true);
  });

  it('blocks when state target missing component', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <div data-state-target="modal">Trigger</div>
      </body></html>`,
    });
    const result = checkStateTargetExistence(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('block');
  });

  it('passes when state target has matching component', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <div data-state-target="modal">Trigger</div>
        <div data-component="modal">Modal Content</div>
      </body></html>`,
    });
    const result = checkStateTargetExistence(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkStateDeadLoop', () => {
  it('passes when no state transitions', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkStateDeadLoop(artifact);
    expect(result.passed).toBe(true);
  });

  it('blocks when state dead loop detected', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <button data-action="change-state" data-state="open" data-state-target="panel">Toggle</button>
      </body></html>`,
    });
    const result = checkStateDeadLoop(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('block');
  });

  it('passes when no dead loop', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <button data-action="change-state" data-state="open" data-state-target="panel">Open</button>
        <button data-action="change-state" data-state="closed" data-state-target="panel">Close</button>
      </body></html>`,
    });
    const result = checkStateDeadLoop(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkPageReachability', () => {
  it('passes when no routes object', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkPageReachability(artifact);
    expect(result.passed).toBe(true);
  });

  it('warns when unreachable pages', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>const routes = { home: '/home', about: '/about', contact: '/contact' };</script>
        <a href="#/home">Home</a>
      </body></html>`,
    });
    const result = checkPageReachability(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('passes when all pages reachable', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>const routes = { home: '/home', about: '/about', default: '/home' };</script>
        <a href="#/home">Home</a>
        <a href="#/about">About</a>
      </body></html>`,
    });
    const result = checkPageReachability(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkDataPageUniqueness', () => {
  it('passes when no data-page sections', () => {
    const artifact = makeArtifact({ html: '<html><body><p>Content</p></body></html>' });
    const result = checkDataPageUniqueness(artifact);
    expect(result.passed).toBe(true);
  });

  it('blocks when duplicate data-page ids', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <section data-page="home"><p>Home 1</p></section>
        <section data-page="home"><p>Home 2</p></section>
      </body></html>`,
    });
    const result = checkDataPageUniqueness(artifact);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('block');
  });

  it('passes when all data-page ids unique', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <section data-page="home"><p>Home</p></section>
        <section data-page="about"><p>About</p></section>
      </body></html>`,
    });
    const result = checkDataPageUniqueness(artifact);
    expect(result.passed).toBe(true);
  });
});

describe('checkAllClarificationRules', () => {
  it('returns all 7 rule results', () => {
    const artifact = makeArtifact({
      html: `<html><body>
        <script>
          const routes = { home: '/home' };
        </script>
        <section data-page="home"><p>Home</p></section>
      </body></html>`,
    });
    const results = checkAllClarificationRules(artifact);
    expect(results).toHaveLength(7);
    expect(results.every(r => r.rule.length > 0)).toBe(true);
  });
});