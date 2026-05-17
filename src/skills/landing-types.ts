export type LandingStyle = 'startup' | 'corporate' | 'creative' | 'saas' | 'portfolio' | 'event';
export type LandingTheme = 'light' | 'dark';
export type LandingSectionType = 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'footer';

export interface LandingColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
}

export interface LandingStat {
  label: string;
  value: string;
}

export interface LandingAction {
  label: string;
  href?: string;
}

export interface LandingFeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface LandingPricingTier {
  name: string;
  price: string;
  description?: string;
  features: string[];
  ctaLabel?: string;
  badge?: string;
  highlighted?: boolean;
}

export interface LandingTestimonialItem {
  quote: string;
  name: string;
  role?: string;
}

export interface LandingFooterLinkGroup {
  title: string;
  links: Array<{ label: string; href?: string }>;
}

export interface LandingHeroSection {
  type: 'hero';
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryAction?: LandingAction;
  secondaryAction?: LandingAction;
  stats?: LandingStat[];
}

export interface LandingFeaturesSection {
  type: 'features';
  title?: string;
  subtitle?: string;
  items: LandingFeatureItem[];
}

export interface LandingPricingSection {
  type: 'pricing';
  title?: string;
  subtitle?: string;
  tiers: LandingPricingTier[];
}

export interface LandingCtaSection {
  type: 'cta';
  title?: string;
  subtitle?: string;
  primaryAction?: LandingAction;
}

export interface LandingTestimonialsSection {
  type: 'testimonials';
  title?: string;
  subtitle?: string;
  items: LandingTestimonialItem[];
}

export interface LandingFooterSection {
  type: 'footer';
  brand?: string;
  note?: string;
  links?: LandingFooterLinkGroup[];
}

export type LandingSection =
  | LandingHeroSection
  | LandingFeaturesSection
  | LandingPricingSection
  | LandingCtaSection
  | LandingTestimonialsSection
  | LandingFooterSection;

export interface LandingConfig {
  title: string;
  subtitle: string;
  sections: LandingSection[];
  style: LandingStyle;
  theme: LandingTheme;
  colors?: LandingColors;
}

export interface LandingSkillContext extends Record<string, unknown> {
  taskId?: string;
  landingConfig?: Partial<LandingConfig>;
}
