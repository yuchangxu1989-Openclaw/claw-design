import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateRegistry, validateSlots, BUILT_IN_TEMPLATES } from '../src/templates/index.js';
import type { TemplateMeta } from '../src/templates/index.js';

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  it('registers and retrieves a template', () => {
    const meta: TemplateMeta = {
      id: 'test-1', name: 'Test', description: 'A test template',
      category: 'test', tags: ['unit'], slots: [],
    };
    registry.registerTemplate(meta);
    expect(registry.getTemplate('test-1')).toEqual(meta);
  });

  it('returns undefined for unknown id', () => {
    expect(registry.getTemplate('nonexistent')).toBeUndefined();
  });

  it('overwrites on duplicate id', () => {
    const v1: TemplateMeta = { id: 'dup', name: 'V1', description: '', category: 'a', tags: [], slots: [] };
    const v2: TemplateMeta = { id: 'dup', name: 'V2', description: '', category: 'b', tags: [], slots: [] };
    registry.registerTemplate(v1);
    registry.registerTemplate(v2);
    expect(registry.getTemplate('dup')!.name).toBe('V2');
  });

  it('lists all templates without filter', () => {
    BUILT_IN_TEMPLATES.forEach(t => registry.registerTemplate(t));
    expect(registry.listTemplates()).toHaveLength(BUILT_IN_TEMPLATES.length);
  });

  it('filters by category', () => {
    BUILT_IN_TEMPLATES.forEach(t => registry.registerTemplate(t));
    const presentations = registry.listTemplates({ category: 'presentation' });
    expect(presentations.every(t => t.category === 'presentation')).toBe(true);
    expect(presentations.length).toBeGreaterThan(0);
  });

  it('filters by tags (OR match)', () => {
    BUILT_IN_TEMPLATES.forEach(t => registry.registerTemplate(t));
    const dataRelated = registry.listTemplates({ tags: ['data'] });
    expect(dataRelated.every(t => t.tags.includes('data'))).toBe(true);
    expect(dataRelated.length).toBeGreaterThan(0);
  });

  it('filters by category + tags combined', () => {
    BUILT_IN_TEMPLATES.forEach(t => registry.registerTemplate(t));
    const result = registry.listTemplates({ category: 'dashboard', tags: ['chart'] });
    expect(result.length).toBe(4);
    expect(result.map(t => t.id)).toContain('chart-dashboard');
  });

  it('returns empty array for non-matching filter', () => {
    BUILT_IN_TEMPLATES.forEach(t => registry.registerTemplate(t));
    expect(registry.listTemplates({ category: 'nonexistent' })).toHaveLength(0);
  });
});

describe('BUILT_IN_TEMPLATES', () => {
  const expectedIds = [
    'presentation-basic', 'chart-dashboard', 'architecture-diagram',
    'poster-event', 'chart-dashboard-grid2x2', 'chart-dashboard-sidebar',
    'chart-dashboard-fullscreen', 'infographic',
  ];

  it('contains all 8 built-in templates', () => {
    expect(BUILT_IN_TEMPLATES).toHaveLength(8);
  });

  it.each(expectedIds)('includes template "%s"', (id) => {
    const found = BUILT_IN_TEMPLATES.find(t => t.id === id);
    expect(found).toBeDefined();
    expect(found!.slots.length).toBeGreaterThan(0);
    expect(found!.skeleton).toBeTruthy();
  });

  it('every template has required fields', () => {
    for (const t of BUILT_IN_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.tags.length).toBeGreaterThan(0);
    }
  });
});

describe('validateSlots', () => {
  const template: TemplateMeta = {
    id: 'val-test', name: 'Validator Test', description: '', category: 'test', tags: [],
    slots: [
      { name: 'title', type: 'text', required: true },
      { name: 'items', type: 'list', required: true },
      { name: 'cover', type: 'image', required: false },
      { name: 'config', type: 'chart', required: false },
      { name: 'note', type: 'text', required: false, default: 'N/A' },
    ],
  };

  it('passes with all required slots provided correctly', () => {
    const result = validateSlots(template, { title: 'Hello', items: ['a', 'b'] });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when required slot is missing', () => {
    const result = validateSlots(template, { title: 'Hello' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].slot).toBe('items');
  });

  it('fails when multiple required slots are missing', () => {
    const result = validateSlots(template, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    const slotNames = result.errors.map(e => e.slot);
    expect(slotNames).toContain('title');
    expect(slotNames).toContain('items');
  });

  it('does not fail for missing optional slots', () => {
    const result = validateSlots(template, { title: 'Hi', items: [] });
    expect(result.valid).toBe(true);
  });

  it('fails on type mismatch — text slot given number', () => {
    const result = validateSlots(template, { title: 123, items: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].slot).toBe('title');
    expect(result.errors[0].message).toContain('text');
  });

  it('fails on type mismatch — list slot given string', () => {
    const result = validateSlots(template, { title: 'Ok', items: 'not-a-list' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].slot).toBe('items');
  });

  it('fails on type mismatch — chart slot given array', () => {
    const result = validateSlots(template, { title: 'Ok', items: [], config: [1, 2] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].slot).toBe('config');
  });

  it('accepts correct optional types', () => {
    const result = validateSlots(template, {
      title: 'Ok', items: ['x'], cover: 'img.png', config: { type: 'bar' }, note: 'hi',
    });
    expect(result.valid).toBe(true);
  });

  it('validates image slot accepts string', () => {
    const result = validateSlots(template, { title: 'Ok', items: [], cover: '/path/to/img.png' });
    expect(result.valid).toBe(true);
  });

  it('rejects image slot with non-string', () => {
    const result = validateSlots(template, { title: 'Ok', items: [], cover: 42 });
    expect(result.valid).toBe(false);
    expect(result.errors[0].slot).toBe('cover');
  });
});
