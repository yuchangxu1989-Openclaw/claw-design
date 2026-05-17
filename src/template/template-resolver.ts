// TemplateResolver — resolves design templates for artifact generation
// arc42 §5: Template domain — maps artifact type + user hints to a concrete template

import type { ArtifactType, ThemePack } from '../types.js';

export interface TemplateDescriptor {
  id: string;
  artifactType: ArtifactType;
  name: string;
  layoutSlots: number;
  previewHtml?: string;
}

export interface TemplateResolver {
  resolve(artifactType: ArtifactType, hints: Record<string, unknown>): Promise<TemplateDescriptor>;
  list(artifactType?: ArtifactType): TemplateDescriptor[];
}

/** Returns a default template per artifact type */
export class DefaultTemplateResolver implements TemplateResolver {
  private templates: TemplateDescriptor[] = [
    { id: 'slides-default', artifactType: 'slides', name: 'Default Slides', layoutSlots: 2 },
    { id: 'chart-default', artifactType: 'chart', name: 'Default Chart', layoutSlots: 1 },
    { id: 'arch-diagram-default', artifactType: 'arch-diagram', name: 'Default Architecture', layoutSlots: 1 },
  ];

  async resolve(artifactType: ArtifactType, _hints: Record<string, unknown>): Promise<TemplateDescriptor> {
    const found = this.templates.find(t => t.artifactType === artifactType);
    if (!found) {
      return { id: `${artifactType}-fallback`, artifactType, name: `Fallback ${artifactType}`, layoutSlots: 1 };
    }
    return found;
  }

  list(artifactType?: ArtifactType): TemplateDescriptor[] {
    if (artifactType) return this.templates.filter(t => t.artifactType === artifactType);
    return [...this.templates];
  }
}
