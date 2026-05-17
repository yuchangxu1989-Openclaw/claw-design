import type { ArtifactType, SkillContract, SkillStatus } from '../types.js';

export interface SkillListing {
  id: string;
  name: string;
  description: string;
  artifactType: ArtifactType;
  category: string;
  tags: string[];
  author: string;
  version: string;
  qualityMaturity: 'experimental' | 'beta' | 'stable' | 'production';
  installCount: number;
  rating?: number;
  lastUpdated: string;
  repository?: string;
  npmPackage?: string;
}

export interface MarketplaceFilter {
  artifactType?: ArtifactType;
  category?: string;
  tags?: string[];
  qualityMaturity?: SkillListing['qualityMaturity'];
  author?: string;
}

export interface MarketplaceSearchResult {
  listings: SkillListing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InstallResult {
  success: boolean;
  skillId: string;
  message: string;
}

export const MARKETPLACE_CATEGORIES = [
  'presentation',
  'chart',
  'diagram',
  'document',
  'web',
  'marketing',
  'prototype',
  'visualization',
] as const;

export const QUALITY_MATURITY_LEVELS = [
  'experimental',
  'beta',
  'stable',
  'production',
] as const;

export const MARKETPLACE_LISTINGS: SkillListing[] = [
  {
    id: 'slides-pro',
    name: 'Slides Pro',
    description: 'Advanced presentation skill with animations and transitions',
    artifactType: 'slides',
    category: 'presentation',
    tags: ['slides', 'presentation', 'animation', 'pro'],
    author: 'ClawDesign',
    version: '2.0.0',
    qualityMaturity: 'production',
    installCount: 15420,
    rating: 4.8,
    lastUpdated: '2026-04-15',
  },
  {
    id: 'chart-viz',
    name: 'Chart Viz',
    description: 'Data visualization with 20+ chart types',
    artifactType: 'chart',
    category: 'chart',
    tags: ['chart', 'visualization', 'data', 'dashboard'],
    author: 'ClawDesign',
    version: '1.5.0',
    qualityMaturity: 'production',
    installCount: 12350,
    rating: 4.7,
    lastUpdated: '2026-04-10',
  },
  {
    id: 'arch-diagram',
    name: 'Architecture Diagram Pro',
    description: 'Professional architecture diagrams with multiple styles',
    artifactType: 'arch-diagram',
    category: 'diagram',
    tags: ['architecture', 'diagram', 'system', 'tech'],
    author: 'ClawDesign',
    version: '1.2.0',
    qualityMaturity: 'stable',
    installCount: 8920,
    rating: 4.6,
    lastUpdated: '2026-04-05',
  },
  {
    id: 'flowchart',
    name: 'Flowchart Master',
    description: 'Flowcharts, sequence diagrams, and process maps',
    artifactType: 'flowchart',
    category: 'diagram',
    tags: ['flowchart', 'process', 'sequence', 'uml'],
    author: 'ClawDesign',
    version: '1.0.0',
    qualityMaturity: 'stable',
    installCount: 6540,
    rating: 4.5,
    lastUpdated: '2026-03-20',
  },
  {
    id: 'prototype-ux',
    name: 'UX Prototype',
    description: 'Interactive prototypes with state management',
    artifactType: 'prototype',
    category: 'prototype',
    tags: ['prototype', 'ux', 'interactive', 'clickable'],
    author: 'ClawDesign',
    version: '1.0.0',
    qualityMaturity: 'beta',
    installCount: 3200,
    rating: 4.4,
    lastUpdated: '2026-04-18',
  },
  {
    id: 'poster-designer',
    name: 'Poster Designer',
    description: 'Marketing posters and promotional graphics',
    artifactType: 'poster',
    category: 'marketing',
    tags: ['poster', 'marketing', 'promotion', 'event'],
    author: 'ClawDesign',
    version: '1.0.0',
    qualityMaturity: 'beta',
    installCount: 2890,
    rating: 4.3,
    lastUpdated: '2026-04-12',
  },
  {
    id: 'landing-builder',
    name: 'Landing Page Builder',
    description: 'Conversion-optimized landing pages',
    artifactType: 'landing-page',
    category: 'web',
    tags: ['landing', 'page', 'conversion', 'marketing'],
    author: 'ClawDesign',
    version: '1.0.0',
    qualityMaturity: 'beta',
    installCount: 4100,
    rating: 4.5,
    lastUpdated: '2026-04-08',
  },
  {
    id: 'mockup-ui',
    name: 'UI Mockup',
    description: 'Static UI mockups and wireframes',
    artifactType: 'ui-mockup',
    category: 'prototype',
    tags: ['mockup', 'ui', 'wireframe', 'design'],
    author: 'ClawDesign',
    version: '0.9.0',
    qualityMaturity: 'experimental',
    installCount: 1200,
    rating: 4.1,
    lastUpdated: '2026-04-01',
  },
  {
    id: 'dashboard-pro',
    name: 'Dashboard Pro',
    description: 'Executive dashboards with KPIs and trends',
    artifactType: 'dashboard',
    category: 'chart',
    tags: ['dashboard', 'kpi', 'metrics', 'analytics'],
    author: 'ClawDesign',
    version: '0.9.0',
    qualityMaturity: 'experimental',
    installCount: 980,
    rating: 4.0,
    lastUpdated: '2026-03-25',
  },
  {
    id: 'infographic',
    name: 'Infographic Maker',
    description: 'Data-rich infographics and visual stories',
    artifactType: 'infographic',
    category: 'visualization',
    tags: ['infographic', 'data', 'visual', 'story'],
    author: 'ClawDesign',
    version: '0.8.0',
    qualityMaturity: 'experimental',
    installCount: 750,
    rating: 3.9,
    lastUpdated: '2026-03-15',
  },
  {
    id: 'logic-diagram-pro',
    name: 'Logic Diagram Pro',
    description: 'Logic relationship diagrams, decision trees, and concept maps',
    artifactType: 'logic-diagram',
    category: 'diagram',
    tags: ['logic-diagram', 'decision-tree', 'concept-map', 'relationship'],
    author: 'ClawDesign',
    version: '1.0.0',
    qualityMaturity: 'beta',
    installCount: 1680,
    rating: 4.2,
    lastUpdated: '2026-04-20',
  },
  {
    id: 'video-editor-pro',
    name: 'Video Editor Pro',
    description: 'Video editing, highlight extraction, merge, subtitle generation, and storyboard creation',
    artifactType: 'video',
    category: 'visualization',
    tags: ['video', 'editing', 'subtitle', 'storyboard'],
    author: 'ClawDesign',
    version: '1.0.0',
    qualityMaturity: 'beta',
    installCount: 2140,
    rating: 4.4,
    lastUpdated: '2026-04-22',
  },
];

export class SkillMarketplace {
  private listings = new Map<string, SkillListing>();
  private installed = new Set<string>();

  constructor() {
    for (const listing of MARKETPLACE_LISTINGS) {
      this.listings.set(listing.id, listing);
    }
  }

  search(filter: MarketplaceFilter, page = 1, pageSize = 20): MarketplaceSearchResult {
    let results = [...this.listings.values()];

    if (filter.artifactType) {
      results = results.filter(l => l.artifactType === filter.artifactType);
    }

    if (filter.category) {
      results = results.filter(l => l.category === filter.category);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(l => filter.tags!.some(tag => l.tags.includes(tag)));
    }

    if (filter.qualityMaturity) {
      results = results.filter(l => l.qualityMaturity === filter.qualityMaturity);
    }

    if (filter.author) {
      results = results.filter(l => l.author === filter.author);
    }

    const total = results.length;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return {
      listings: paged,
      total,
      page,
      pageSize,
    };
  }

  getByArtifactType(type: ArtifactType): SkillListing[] {
    return [...this.listings.values()].filter(l => l.artifactType === type);
  }

  getByCategory(category: string): SkillListing[] {
    return [...this.listings.values()].filter(l => l.category === category);
  }

  getByTag(tag: string): SkillListing[] {
    return [...this.listings.values()].filter(l => l.tags.includes(tag));
  }

  get(id: string): SkillListing | undefined {
    return this.listings.get(id);
  }

  getFeatured(count = 5): SkillListing[] {
    return [...this.listings.values()]
      .sort((a, b) => b.installCount - a.installCount)
      .slice(0, count);
  }

  getNewlyUpdated(count = 5): SkillListing[] {
    return [...this.listings.values()]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, count);
  }

  getTopRated(count = 5): SkillListing[] {
    return [...this.listings.values()]
      .filter(l => l.rating !== undefined)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, count);
  }

  isInstalled(id: string): boolean {
    return this.installed.has(id);
  }

  install(id: string): InstallResult {
    const listing = this.listings.get(id);
    if (!listing) {
      return { success: false, skillId: id, message: 'Skill not found in marketplace' };
    }

    if (this.installed.has(id)) {
      return { success: false, skillId: id, message: 'Skill already installed' };
    }

    this.installed.add(id);
    listing.installCount++;

    return { success: true, skillId: id, message: `Successfully installed ${listing.name}` };
  }

  uninstall(id: string): InstallResult {
    if (!this.installed.has(id)) {
      return { success: false, skillId: id, message: 'Skill not installed' };
    }

    const listing = this.listings.get(id);
    this.installed.delete(id);

    return {
      success: true,
      skillId: id,
      message: listing ? `Successfully uninstalled ${listing.name}` : `Successfully uninstalled skill`,
    };
  }

  listInstalled(): SkillListing[] {
    return [...this.installed].map(id => this.listings.get(id)).filter(Boolean) as SkillListing[];
  }

  getCategories(): string[] {
    return [...MARKETPLACE_CATEGORIES];
  }

  getQualityMaturities(): SkillListing['qualityMaturity'][] {
    return [...QUALITY_MATURITY_LEVELS];
  }

  addListing(listing: SkillListing): void {
    this.listings.set(listing.id, listing);
  }

  removeListing(id: string): boolean {
    return this.listings.delete(id);
  }

  publishToMarketplace(listing: Omit<SkillListing, 'installCount' | 'rating' | 'lastUpdated'>): SkillListing {
    const newListing: SkillListing = {
      ...listing,
      installCount: 0,
      rating: undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    this.listings.set(newListing.id, newListing);
    return newListing;
  }
}

export function createMarketplace(): SkillMarketplace {
  return new SkillMarketplace();
}