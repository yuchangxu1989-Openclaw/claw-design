// TemplateRegistry — manages template metadata catalog
// arc42 §5: Template domain — registry for built-in and custom templates

export type SlotType = 'text' | 'image' | 'list' | 'chart';

export interface SlotDef {
  name: string;
  type: SlotType;
  required: boolean;
  default?: unknown;
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  slots: SlotDef[];
  thumbnail?: string;
  /** Default HTML/CSS skeleton for rendering */
  skeleton?: string;
}

export interface TemplateFilter {
  category?: string;
  tags?: string[];
}

export class TemplateRegistry {
  private store = new Map<string, TemplateMeta>();

  registerTemplate(meta: TemplateMeta): void {
    this.store.set(meta.id, meta);
  }

  getTemplate(id: string): TemplateMeta | undefined {
    return this.store.get(id);
  }

  listTemplates(filter?: TemplateFilter): TemplateMeta[] {
    let results = [...this.store.values()];
    if (!filter) return results;

    if (filter.category) {
      results = results.filter(t => t.category === filter.category);
    }
    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(t =>
        filter.tags!.some(tag => t.tags.includes(tag)),
      );
    }
    return results;
  }
}
