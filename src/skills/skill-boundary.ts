export interface ExecutionBoundary {
  skillName: string;
  maxExecutionTime: number;
  maxMemoryMB: number;
  maxOutputSizeKB: number;
  allowedDomains: string[];
  blockedAPIs: string[];
  networkAccess: boolean;
  filesystemAccess: 'none' | 'read-only' | 'read-write';
}

export interface ExecutionContext {
  skillName: string;
  inputSize: number;
  expectedOutputSize: number;
  timeout: number;
}

export interface BoundaryViolation {
  skillName: string;
  violationType: 'timeout' | 'memory' | 'output-size' | 'forbidden-api' | 'network' | 'filesystem';
  details: string;
  blocked: boolean;
}

export interface ExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
  boundaryViolations: BoundaryViolation[];
}

export class ExecutionBoundaryEnforcer {
  private boundaries = new Map<string, ExecutionBoundary>();

  private readonly DEFAULT_BOUNDARY: ExecutionBoundary = {
    skillName: 'default',
    maxExecutionTime: 60000,
    maxMemoryMB: 512,
    maxOutputSizeKB: 2048,
    allowedDomains: [],
    blockedAPIs: ['eval', 'Function', 'importScripts'],
    networkAccess: false,
    filesystemAccess: 'none',
  };

  setBoundary(skillName: string, boundary: Partial<ExecutionBoundary>): void {
    this.boundaries.set(skillName, { ...this.DEFAULT_BOUNDARY, skillName, ...boundary });
  }

  getBoundary(skillName: string): ExecutionBoundary {
    return this.boundaries.get(skillName) ?? this.DEFAULT_BOUNDARY;
  }

  removeBoundary(skillName: string): boolean {
    return this.boundaries.delete(skillName);
  }

  checkInputSize(skillName: string, inputSize: number): BoundaryViolation | null {
    const boundary = this.getBoundary(skillName);
    const maxInputSize = boundary.maxOutputSizeKB * 1024;

    if (inputSize > maxInputSize) {
      return {
        skillName,
        violationType: 'output-size',
        details: `Input size ${inputSize} exceeds limit ${maxInputSize}`,
        blocked: true,
      };
    }
    return null;
  }

  checkOutputSize(skillName: string, outputSize: number): BoundaryViolation | null {
    const boundary = this.getBoundary(skillName);
    const maxSizeKB = boundary.maxOutputSizeKB;

    if (outputSize > maxSizeKB * 1024) {
      return {
        skillName,
        violationType: 'output-size',
        details: `Output size ${outputSize}KB exceeds limit ${maxSizeKB}KB`,
        blocked: true,
      };
    }
    return null;
  }

  checkTimeout(skillName: string, executionTime: number): BoundaryViolation | null {
    const boundary = this.getBoundary(skillName);

    if (executionTime > boundary.maxExecutionTime) {
      return {
        skillName,
        violationType: 'timeout',
        details: `Execution time ${executionTime}ms exceeds limit ${boundary.maxExecutionTime}ms`,
        blocked: true,
      };
    }
    return null;
  }

  checkForbiddenAPI(skillName: string, api: string): BoundaryViolation | null {
    const boundary = this.getBoundary(skillName);

    if (boundary.blockedAPIs.includes(api)) {
      return {
        skillName,
        violationType: 'forbidden-api',
        details: `API '${api}' is forbidden for skill '${skillName}'`,
        blocked: true,
      };
    }
    return null;
  }

  checkNetworkAccess(skillName: string, url: string): BoundaryViolation | null {
    const boundary = this.getBoundary(skillName);

    if (!boundary.networkAccess) {
      return {
        skillName,
        violationType: 'network',
        details: `Network access denied for skill '${skillName}'`,
        blocked: true,
      };
    }

    if (boundary.allowedDomains.length > 0) {
      try {
        const hostname = new URL(url).hostname;
        const allowed = boundary.allowedDomains.some(d => hostname.endsWith(d));
        if (!allowed) {
          return {
            skillName,
            violationType: 'network',
            details: `Domain '${hostname}' not in allowed list for skill '${skillName}'`,
            blocked: true,
          };
        }
      } catch {
        return {
          skillName,
          violationType: 'network',
          details: `Invalid URL: ${url}`,
          blocked: true,
        };
      }
    }

    return null;
  }

  checkFilesystemAccess(
    skillName: string,
    operation: 'read' | 'write',
    path: string
  ): BoundaryViolation | null {
    const boundary = this.getBoundary(skillName);

    if (boundary.filesystemAccess === 'none') {
      return {
        skillName,
        violationType: 'filesystem',
        details: `Filesystem access denied for skill '${skillName}'`,
        blocked: true,
      };
    }

    if (operation === 'write' && boundary.filesystemAccess === 'read-only') {
      return {
        skillName,
        violationType: 'filesystem',
        details: `Write access denied for skill '${skillName}'`,
        blocked: true,
      };
    }

    return null;
  }

  validateContract(contract: { requiredContext?: string[]; name?: string }): {
    valid: boolean;
    violations: BoundaryViolation[];
  } {
    const violations: BoundaryViolation[] = [];
    const skillName = contract.name ?? 'unknown';

    if (!contract.requiredContext) {
      violations.push({
        skillName,
        violationType: 'forbidden-api',
        details: 'Skill contract must declare required context',
        blocked: false,
      });
    }

    return { valid: violations.filter(v => v.blocked).length === 0, violations };
  }

  wrapExecution<T>(
    skillName: string,
    fn: () => Promise<T>,
    context: ExecutionContext
  ): Promise<ExecutionResult<T>> {
    const startTime = Date.now();
    const violations: BoundaryViolation[] = [];

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        const execTime = Date.now() - startTime;
        const violation = this.checkTimeout(skillName, execTime);
        if (violation) violations.push(violation);

        resolve({
          success: false,
          error: `Execution timeout after ${execTime}ms`,
          executionTime: execTime,
          boundaryViolations: violations,
        });
      }, context.timeout);

      fn()
        .then((data) => {
          clearTimeout(timeoutId);
          const execTime = Date.now() - startTime;

          const outputSizeBytes = JSON.stringify(data).length;
          const sizeViolation = this.checkOutputSize(skillName, outputSizeBytes);
          if (sizeViolation) violations.push(sizeViolation);

          resolve({
            success: violations.filter(v => v.blocked).length === 0,
            data,
            executionTime: execTime,
            boundaryViolations: violations,
          });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          const execTime = Date.now() - startTime;

          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            executionTime: execTime,
            boundaryViolations: violations,
          });
        });
    });
  }
}

export function createBoundaryEnforcer(): ExecutionBoundaryEnforcer {
  return new ExecutionBoundaryEnforcer();
}