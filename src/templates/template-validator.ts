// Template Validator — validates slot inputs against template definitions

import type { TemplateMeta, SlotType } from './template-registry.js';

export interface ValidationError {
  slot: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const TYPE_CHECKERS: Record<SlotType, (v: unknown) => boolean> = {
  text: (v) => typeof v === 'string',
  image: (v) => typeof v === 'string',
  list: (v) => Array.isArray(v),
  chart: (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
};

export function validateSlots(
  template: TemplateMeta,
  input: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const slot of template.slots) {
    const value = input[slot.name];

    if (value === undefined || value === null) {
      if (slot.required) {
        errors.push({ slot: slot.name, message: `Required slot "${slot.name}" is missing` });
      }
      continue;
    }

    const checker = TYPE_CHECKERS[slot.type];
    if (!checker(value)) {
      errors.push({
        slot: slot.name,
        message: `Slot "${slot.name}" expected type "${slot.type}" but got ${typeof value}`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
