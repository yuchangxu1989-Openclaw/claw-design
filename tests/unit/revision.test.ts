import { describe, expect, it } from 'vitest';
import {
  canTransition,
  transitionStatus,
  toRevisionable,
  startRevision,
  applyRevision,
  rollbackToRevision,
  getRevisionHistory,
} from '../../src/execution/revision.js';
import type { Artifact } from '../../src/types.js';

function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
  return {
    taskId: 'test-task',
    type: 'chart',
    status: 'ready',
    html: '<div>original</div>',
    pages: 1,
    metadata: {},
    ...overrides,
  };
}

describe('Revision module (FR-B12)', () => {
  describe('canTransition', () => {
    it('allows ready → revision', () => {
      expect(canTransition('ready', 'revision')).toBe(true);
    });
    it('allows revision → ready', () => {
      expect(canTransition('revision', 'ready')).toBe(true);
    });
    it('allows ready → archived', () => {
      expect(canTransition('ready', 'archived')).toBe(true);
    });
    it('blocks archived → ready', () => {
      expect(canTransition('archived', 'ready')).toBe(false);
    });
    it('blocks generating → revision', () => {
      expect(canTransition('generating', 'revision')).toBe(false);
    });
  });

  describe('transitionStatus', () => {
    it('transitions ready → revision', () => {
      const artifact = makeArtifact({ status: 'ready' });
      const result = transitionStatus(artifact, 'revision');
      expect(result.status).toBe('revision');
    });
    it('throws on invalid transition', () => {
      const artifact = makeArtifact({ status: 'archived' });
      expect(() => transitionStatus(artifact, 'ready')).toThrow('Invalid transition');
    });
  });

  describe('revision lifecycle', () => {
    it('AC1: starts revision from ready, applies changes, returns to ready', () => {
      const base = toRevisionable(makeArtifact());
      expect(base.revisions).toHaveLength(0);

      const inRevision = startRevision(base, '调大标题字号');
      expect(inRevision.status).toBe('revision');
      expect(inRevision.revisions).toHaveLength(1);
      expect(inRevision.revisions[0].previousHtml).toBe('<div>original</div>');

      const revised = applyRevision(inRevision, '<div>revised</div>', [
        { type: 'style', target: 'h1', description: '字号从 24px 调到 32px' },
      ]);
      expect(revised.status).toBe('ready');
      expect(revised.html).toBe('<div>revised</div>');
      expect(revised.revisions[0].changes).toHaveLength(1);
    });

    it('AC2: incremental modification preserves previous html', () => {
      let artifact = toRevisionable(makeArtifact({ html: '<div>v1</div>' }));
      artifact = startRevision(artifact, 'first edit');
      artifact = applyRevision(artifact, '<div>v2</div>', [
        { type: 'content', target: 'body', description: 'update content' },
      ]);
      expect(artifact.html).toBe('<div>v2</div>');
      expect(artifact.revisions[0].previousHtml).toBe('<div>v1</div>');

      artifact = startRevision(artifact, 'second edit');
      artifact = applyRevision(artifact, '<div>v3</div>', [
        { type: 'style', target: 'body', description: 'change color' },
      ]);
      expect(artifact.html).toBe('<div>v3</div>');
      expect(artifact.revisions).toHaveLength(2);
      expect(artifact.revisions[1].previousHtml).toBe('<div>v2</div>');
    });

    it('AC3: rollback to previous revision', () => {
      let artifact = toRevisionable(makeArtifact({ html: '<div>v1</div>' }));
      artifact = startRevision(artifact, 'edit 1');
      artifact = applyRevision(artifact, '<div>v2</div>', []);
      artifact = startRevision(artifact, 'edit 2');
      artifact = applyRevision(artifact, '<div>v3</div>', []);

      const rolledBack = rollbackToRevision(artifact, 0);
      expect(rolledBack.status).toBe('ready');
      expect(rolledBack.html).toBe('<div>v1</div>');
      expect(rolledBack.currentRevision).toBe(0);
    });

    it('getRevisionHistory returns all entries', () => {
      let artifact = toRevisionable(makeArtifact());
      artifact = startRevision(artifact, 'r1');
      artifact = applyRevision(artifact, '<div>r1</div>', []);
      artifact = startRevision(artifact, 'r2');
      artifact = applyRevision(artifact, '<div>r2</div>', []);

      const history = getRevisionHistory(artifact);
      expect(history).toHaveLength(2);
      expect(history[0].description).toBe('r1');
      expect(history[1].description).toBe('r2');
    });

    it('throws when starting revision from non-ready state', () => {
      const artifact = toRevisionable(makeArtifact({ status: 'generating' }));
      expect(() => startRevision(artifact, 'test')).toThrow('Cannot start revision');
    });

    it('throws when applying revision from non-revision state', () => {
      const artifact = toRevisionable(makeArtifact({ status: 'ready' }));
      expect(() => applyRevision(artifact, '<div/>', [])).toThrow('Cannot apply revision');
    });

    it('throws on out-of-range rollback index', () => {
      const artifact = toRevisionable(makeArtifact());
      expect(() => rollbackToRevision(artifact, 0)).toThrow('out of range');
    });
  });
});
