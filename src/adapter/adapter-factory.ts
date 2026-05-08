// AdapterFactory — Creates the appropriate HostAdapter based on environment

import type { HostAdapter } from '../types.js';
import type { InfraHostAdapter } from './host-adapter.js';
import { OpenClawAdapter } from './openclaw-adapter.js';
import { CLIAdapter } from './cli-adapter.js';
import { OpenClawInfraAdapter } from './openclaw-infra-adapter.js';
import type { OpenClawAdapterOptions } from './openclaw-infra-adapter.js';
import { StandaloneAdapter } from './standalone-adapter.js';
import type { StandaloneAdapterOptions } from './standalone-adapter.js';

export type AdapterEnv = 'openclaw' | 'cli' | 'standalone';

export interface AdapterFactoryOptions {
  openclaw?: OpenClawAdapterOptions;
  cli?: unknown;
  standalone?: StandaloneAdapterOptions;
}

/**
 * Detect the current runtime environment automatically.
 */
export function detectEnvironment(): AdapterEnv {
  if (process.env.OPENCLAW_SKILL_ID) {
    return 'openclaw';
  }
  if (process.env.CLI_MODE || process.argv[1]?.includes('claw-design')) {
    return 'cli';
  }
  return 'standalone';
}

/**
 * Create the appropriate HostAdapter for the given environment.
 */
export function createHostAdapter(
  env?: AdapterEnv,
  options: AdapterFactoryOptions = {},
): HostAdapter {
  const targetEnv = env ?? detectEnvironment();
  switch (targetEnv) {
    case 'openclaw':
      return new OpenClawAdapter();
    case 'cli':
      return new CLIAdapter();
    case 'standalone':
      return new CLIAdapter();
    default:
      return new CLIAdapter();
  }
}

/**
 * Create the appropriate InfraHostAdapter for the given environment (for infrastructure operations).
 */
export function createInfraAdapter(
  env: AdapterEnv,
  options: AdapterFactoryOptions = {},
): InfraHostAdapter {
  switch (env) {
    case 'openclaw':
      return new OpenClawInfraAdapter(options.openclaw);
    case 'standalone':
      return new StandaloneAdapter(options.standalone);
    default:
      return new StandaloneAdapter(options.standalone);
  }
}
