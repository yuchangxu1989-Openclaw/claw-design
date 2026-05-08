// CLIAdapter — command-line entry point adapter
// arc42 §5: Host Adapter variant for CLI usage

import { randomUUID } from 'node:crypto';
import type { HostAdapter, DesignRequest, GapItem, DeliveryBundle } from '../types.js';

export class CLIAdapter implements HostAdapter {
  async adapt(rawInput: unknown): Promise<DesignRequest> {
    // CLI input is always a string (argv or piped stdin)
    const input = typeof rawInput === 'string' ? rawInput : String(rawInput);
    return {
      taskId: randomUUID(),
      rawInput: input,
      locale: 'zh-CN',
    };
  }

  async clarify(gaps: GapItem[]): Promise<Record<string, string>> {
    // CLI mode: use defaults for all gaps (no interactive prompt)
    const defaults: Record<string, string> = {};
    for (const gap of gaps) {
      if (gap.defaultHint) {
        defaults[gap.name] = gap.defaultHint;
      }
    }
    return defaults;
  }

  async deliver(bundle: DeliveryBundle): Promise<{ success: boolean; message: string }> {
    // CLI mode: just report the output paths
    const paths = bundle.files.join(', ');
    return {
      success: true,
      message: `Output written to: ${paths}`,
    };
  }
}
