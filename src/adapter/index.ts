export { OpenClawAdapter } from './openclaw-adapter.js';
export { CLIAdapter } from './cli-adapter.js';

// Infrastructure-level Host Adapter
export type {
  InfraHostAdapter,
  HostConfig,
  ProgressStage,
  OutputPackage,
  HostDeliveryResult,
} from './host-adapter.js';
export { OpenClawInfraAdapter } from './openclaw-infra-adapter.js';
export type { OpenClawAdapterOptions, EventBus, ProgressEvent } from './openclaw-infra-adapter.js';
export { StandaloneAdapter } from './standalone-adapter.js';
export type { StandaloneAdapterOptions } from './standalone-adapter.js';
// HostAdapter factory functions
export {
  createHostAdapter,
  createInfraAdapter,
  detectEnvironment,
} from './adapter-factory.js';
export type { AdapterEnv, AdapterFactoryOptions } from './adapter-factory.js';
