import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExecutionBoundaryEnforcer,
  createBoundaryEnforcer,
} from '../../src/skills/skill-boundary.js';

describe('ExecutionBoundaryEnforcer (FR-F04)', () => {
  let enforcer: ExecutionBoundaryEnforcer;

  beforeEach(() => {
    enforcer = createBoundaryEnforcer();
  });

  describe('getBoundary', () => {
    it('returns default boundary for unknown skill', () => {
      const boundary = enforcer.getBoundary('unknown-skill');
      expect(boundary.maxExecutionTime).toBe(60000);
    });

    it('returns custom boundary for configured skill', () => {
      enforcer.setBoundary('test-skill', { maxExecutionTime: 30000 });
      const boundary = enforcer.getBoundary('test-skill');
      expect(boundary.maxExecutionTime).toBe(30000);
    });
  });

  describe('setBoundary', () => {
    it('sets custom boundary', () => {
      enforcer.setBoundary('custom-skill', {
        maxExecutionTime: 10000,
        maxMemoryMB: 256,
        networkAccess: true,
      });

      const boundary = enforcer.getBoundary('custom-skill');
      expect(boundary.maxExecutionTime).toBe(10000);
      expect(boundary.maxMemoryMB).toBe(256);
      expect(boundary.networkAccess).toBe(true);
    });
  });

  describe('checkOutputSize', () => {
    it('allows output within limit', () => {
      const violation = enforcer.checkOutputSize('test-skill', 1024);
      expect(violation).toBeNull();
    });

    it('blocks output exceeding limit', () => {
      const violation = enforcer.checkOutputSize('test-skill', 3 * 1024 * 1024);
      expect(violation).not.toBeNull();
      expect(violation?.blocked).toBe(true);
      expect(violation?.violationType).toBe('output-size');
    });
  });

  describe('checkTimeout', () => {
    it('allows execution within timeout', () => {
      const violation = enforcer.checkTimeout('test-skill', 5000);
      expect(violation).toBeNull();
    });

    it('blocks execution exceeding timeout', () => {
      const violation = enforcer.checkTimeout('test-skill', 70000);
      expect(violation).not.toBeNull();
      expect(violation?.blocked).toBe(true);
      expect(violation?.violationType).toBe('timeout');
    });
  });

  describe('checkForbiddenAPI', () => {
    it('allows non-forbidden API', () => {
      const violation = enforcer.checkForbiddenAPI('test-skill', 'fetch');
      expect(violation).toBeNull();
    });

    it('blocks forbidden API', () => {
      const violation = enforcer.checkForbiddenAPI('test-skill', 'eval');
      expect(violation).not.toBeNull();
      expect(violation?.blocked).toBe(true);
      expect(violation?.violationType).toBe('forbidden-api');
    });
  });

  describe('checkNetworkAccess', () => {
    it('blocks network when disabled', () => {
      enforcer.setBoundary('test-skill', { networkAccess: false });
      const violation = enforcer.checkNetworkAccess('test-skill', 'https://api.example.com');
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('network');
    });

    it('allows network when enabled', () => {
      enforcer.setBoundary('test-skill', { networkAccess: true });
      const violation = enforcer.checkNetworkAccess('test-skill', 'https://api.example.com');
      expect(violation).toBeNull();
    });

    it('validates allowed domains', () => {
      enforcer.setBoundary('test-skill', {
        networkAccess: true,
        allowedDomains: ['example.com'],
      });

      const allowed = enforcer.checkNetworkAccess('test-skill', 'https://api.example.com');
      expect(allowed).toBeNull();

      const blocked = enforcer.checkNetworkAccess('test-skill', 'https://evil.com');
      expect(blocked).not.toBeNull();
    });
  });

  describe('checkFilesystemAccess', () => {
    it('blocks when filesystem disabled', () => {
      enforcer.setBoundary('test-skill', { filesystemAccess: 'none' });
      const violation = enforcer.checkFilesystemAccess('test-skill', 'read', '/path');
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('filesystem');
    });

    it('allows read when read-only', () => {
      enforcer.setBoundary('test-skill', { filesystemAccess: 'read-only' });
      const violation = enforcer.checkFilesystemAccess('test-skill', 'read', '/path');
      expect(violation).toBeNull();
    });

    it('blocks write when read-only', () => {
      enforcer.setBoundary('test-skill', { filesystemAccess: 'read-only' });
      const violation = enforcer.checkFilesystemAccess('test-skill', 'write', '/path');
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('filesystem');
    });

    it('allows read/write when read-write', () => {
      enforcer.setBoundary('test-skill', { filesystemAccess: 'read-write' });
      const readViolation = enforcer.checkFilesystemAccess('test-skill', 'read', '/path');
      const writeViolation = enforcer.checkFilesystemAccess('test-skill', 'write', '/path');
      expect(readViolation).toBeNull();
      expect(writeViolation).toBeNull();
    });
  });

  describe('wrapExecution', () => {
    it('resolves with data on success', async () => {
      const result = await enforcer.wrapExecution(
        'test-skill',
        async () => 'success',
        { skillName: 'test', inputSize: 100, expectedOutputSize: 100, timeout: 5000 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('rejects on error', async () => {
      const result = await enforcer.wrapExecution(
        'test-skill',
        async () => {
          throw new Error('Test error');
        },
        { skillName: 'test', inputSize: 100, expectedOutputSize: 100, timeout: 5000 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });

    it('tracks boundary violations', async () => {
      enforcer.setBoundary('test-skill', { maxOutputSizeKB: 1 });
      const result = await enforcer.wrapExecution(
        'test-skill',
        async () => 'x'.repeat(3000),
        { skillName: 'test', inputSize: 100, expectedOutputSize: 100, timeout: 5000 }
      );

      expect(result.boundaryViolations.length).toBeGreaterThan(0);
    });
  });
});