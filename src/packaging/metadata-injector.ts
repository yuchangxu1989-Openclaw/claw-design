// MetadataInjector — injects metadata into HTML artifacts
// arc42 §5: Packaging domain — author, date, version, tool identification

/** Metadata to inject into the artifact */
export interface PackageMetadata {
  author?: string;
  date?: string;
  version?: string;
  generator?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  custom?: Record<string, string>;
}

const DEFAULT_GENERATOR = 'Claw Design Engine';

/**
 * MetadataInjector embeds structured metadata into HTML documents
 * via <meta> tags and a JSON-LD script block for machine readability.
 */
export class MetadataInjector {
  /**
   * Inject metadata into HTML string.
   * Adds <meta> tags in <head> and a JSON-LD block for structured data.
   */
  inject(html: string, metadata: PackageMetadata): string {
    const metaTags = this.buildMetaTags(metadata);
    const jsonLd = this.buildJsonLd(metadata);
    const block = `${metaTags}\n${jsonLd}`;

    // Insert before </head> if present
    if (/<\/head>/i.test(html)) {
      return html.replace(/<\/head>/i, `${block}\n</head>`);
    }

    // Insert after <head> if present but no </head>
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (match) => `${match}\n${block}`);
    }

    // No <head> — wrap in a minimal head
    if (/<html[^>]*>/i.test(html)) {
      return html.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${block}\n</head>`);
    }

    // Bare HTML fragment — prepend metadata block
    return `<head>\n${block}\n</head>\n${html}`;
  }

  /**
   * Extract previously injected metadata from HTML (reads JSON-LD block).
   * Returns null if no Claw Design metadata found.
   */
  extract(html: string): PackageMetadata | null {
    const jsonLdPattern = /<script\s+type=["']application\/ld\+json["'][^>]*data-claw-design[^>]*>([\s\S]*?)<\/script>/i;
    const match = html.match(jsonLdPattern);
    if (!match) return null;

    try {
      const data = JSON.parse(match[1]);
      return {
        author: data.author?.name,
        date: data.dateCreated,
        version: data.version,
        generator: data.creator?.name,
        title: data.name,
        description: data.description,
        keywords: data.keywords,
      };
    } catch {
      return null;
    }
  }

  private buildMetaTags(meta: PackageMetadata): string {
    const tags: string[] = [];

    tags.push(`<meta name="generator" content="${this.escape(meta.generator ?? DEFAULT_GENERATOR)}">`);

    if (meta.author) {
      tags.push(`<meta name="author" content="${this.escape(meta.author)}">`);
    }
    if (meta.date) {
      tags.push(`<meta name="date" content="${this.escape(meta.date)}">`);
    }
    if (meta.version) {
      tags.push(`<meta name="version" content="${this.escape(meta.version)}">`);
    }
    if (meta.title) {
      tags.push(`<meta property="og:title" content="${this.escape(meta.title)}">`);
    }
    if (meta.description) {
      tags.push(`<meta name="description" content="${this.escape(meta.description)}">`);
      tags.push(`<meta property="og:description" content="${this.escape(meta.description)}">`);
    }
    if (meta.keywords && meta.keywords.length > 0) {
      tags.push(`<meta name="keywords" content="${this.escape(meta.keywords.join(', '))}">`);
    }
    if (meta.custom) {
      for (const [key, value] of Object.entries(meta.custom)) {
        tags.push(`<meta name="${this.escape(key)}" content="${this.escape(value)}">`);
      }
    }

    return tags.join('\n');
  }

  private buildJsonLd(meta: PackageMetadata): string {
    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      creator: { '@type': 'SoftwareApplication', name: meta.generator ?? DEFAULT_GENERATOR },
      dateCreated: meta.date ?? new Date().toISOString(),
    };

    if (meta.author) ld.author = { '@type': 'Person', name: meta.author };
    if (meta.version) ld.version = meta.version;
    if (meta.title) ld.name = meta.title;
    if (meta.description) ld.description = meta.description;
    if (meta.keywords) ld.keywords = meta.keywords;

    return `<script type="application/ld+json" data-claw-design>${JSON.stringify(ld)}</script>`;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
