export type PosterStyle = 'modern' | 'classic' | 'minimal' | 'bold' | 'tech-launch' | 'music-fest' | 'edu-lecture' | 'ecommerce' | 'recruitment' | 'wedding';
export type PosterSize = 'A4' | 'social' | 'banner' | 'square' | 'portrait' | 'landscape';
export type PosterTheme = 'light' | 'dark';

export interface PosterColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  background?: string;
  surface?: string;
}

export interface PosterConfig {
  title: string;
  subtitle?: string;
  body: string;
  style: PosterStyle;
  size: PosterSize;
  theme: PosterTheme;
  colors?: PosterColors;
  backgroundImage?: string;
}

export interface PosterSizeSpec {
  width: string;
  height: string;
  label: string;
}
