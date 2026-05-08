// OpenClawAdapter — Host Adapter for OpenClaw skill environment
// Implements the three-method contract: adapt / clarify / deliver

import { randomUUID } from 'node:crypto';
import type { HostAdapter, DesignRequest, GapItem, DeliveryBundle } from '../types.js';

export class OpenClawAdapter implements HostAdapter {
  async adapt(rawInput: unknown): Promise<DesignRequest> {
    // Normalize various input shapes into DesignRequest
    if (typeof rawInput === 'string') {
      return {
        taskId: randomUUID(),
        rawInput,
        locale: 'zh-CN',
      };
    }

    if (typeof rawInput === 'object' && rawInput !== null) {
      const obj = rawInput as Record<string, unknown>;
      return {
        taskId: (obj['taskId'] as string) ?? randomUUID(),
        rawInput: (obj['rawInput'] as string) ?? (obj['input'] as string) ?? '',
        attachments: (obj['attachments'] as string[]) ?? [],
        locale: (obj['locale'] as string) ?? 'zh-CN',
        metadata: (obj['metadata'] as Record<string, unknown>) ?? {},
      };
    }

    return {
      taskId: randomUUID(),
      rawInput: String(rawInput),
      locale: 'zh-CN',
    };
  }

  async clarify(gaps: GapItem[]): Promise<Record<string, string>> {
    // In OpenClaw context, gaps would be forwarded to the user via the host.
    // Skeleton: return empty (no interactive clarification yet).
    // The caller should check gaps and decide whether to proceed with defaults.
    const defaults: Record<string, string> = {};
    for (const gap of gaps) {
      if (gap.defaultHint) {
        defaults[gap.name] = gap.defaultHint;
      }
    }
    return defaults;
  }

  async deliver(bundle: DeliveryBundle): Promise<{ success: boolean; message: string }> {
    // In OpenClaw context, delivery means writing files to output dir
    // and returning the path. The host handles actual distribution.
    return {
      success: true,
      message: `Delivered to ${bundle.htmlPath} (${bundle.files.length} files)`,
    };
  }
}
