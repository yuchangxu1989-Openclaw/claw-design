import { describe, expect, it } from 'vitest';
import { DefaultTemplateResolver } from '../../src/template/template-resolver.js';

describe('DefaultTemplateResolver', () => {
  it('resolves the default slides template', async () => {
    const resolver = new DefaultTemplateResolver();

    await expect(resolver.resolve('slides', {})).resolves.toMatchObject({
      id: 'slides-default',
      artifactType: 'slides',
      layoutSlots: 2,
    });
  });

  it('resolves the default chart template', async () => {
    const resolver = new DefaultTemplateResolver();

    await expect(resolver.resolve('chart', { compact: true })).resolves.toMatchObject({
      id: 'chart-default',
      artifactType: 'chart',
    });
  });

  it('returns a fallback descriptor when the artifact type has no built-in template', async () => {
    const resolver = new DefaultTemplateResolver();

    await expect(resolver.resolve('poster', { bold: true })).resolves.toEqual({
      id: 'poster-fallback',
      artifactType: 'poster',
      name: 'Fallback poster',
      layoutSlots: 1,
    });
  });

  it('lists all templates when no artifact type filter is provided', () => {
    const resolver = new DefaultTemplateResolver();

    expect(resolver.list()).toHaveLength(3);
    expect(resolver.list().map(template => template.id)).toEqual([
      'slides-default',
      'chart-default',
      'arch-diagram-default',
    ]);
  });

  it('filters templates by artifact type', () => {
    const resolver = new DefaultTemplateResolver();

    expect(resolver.list('arch-diagram')).toEqual([
      {
        id: 'arch-diagram-default',
        artifactType: 'arch-diagram',
        name: 'Default Architecture',
        layoutSlots: 1,
      },
    ]);
  });
});
