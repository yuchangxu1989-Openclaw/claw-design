import type { ThemePack } from '../types.js';
import type { SkillGenerateContext } from './base-skill.js';

export type FlowNodeType = 'start-end' | 'process' | 'decision' | 'parallel';
export type FlowEdgeKind = 'default' | 'yes' | 'no' | 'parallel';
export type FlowchartThemeMode = 'light' | 'dark' | 'auto';
export type FlowchartFlowType = 'sequential' | 'branch' | 'parallel';

export interface FlowNode {
  id: string;
  label: string;
  type: FlowNodeType;
  lane?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface FlowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  kind?: FlowEdgeKind;
}

export interface FlowchartNodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  column: number;
}

export interface FlowchartLayout {
  direction: 'TB';
  width: number;
  height: number;
  padding: number;
  nodeGapX: number;
  nodeGapY: number;
  rows: number;
  columns: number;
  positions: Record<string, FlowchartNodePosition>;
}

export interface FlowchartConfig {
  themeMode?: FlowchartThemeMode;
  padding?: number;
  nodeGapX?: number;
  nodeGapY?: number;
  processWidth?: number;
  startEndWidth?: number;
  decisionWidth?: number;
  decisionHeight?: number;
  parallelSize?: number;
  baseNodeHeight?: number;
  maxLabelCharsPerLine?: number;
  stageWidth?: number;
}

export interface FlowchartPlan {
  title: string;
  summary: string;
  flowType: FlowchartFlowType;
  nodes: FlowNode[];
  edges: FlowEdge[];
  layout?: FlowchartLayout;
}

export interface FlowchartProviderContext {
  input: string;
  theme: ThemePack;
  fallbackPlan: FlowchartPlan;
  prompt: string;
  metadata: FlowchartSkillContext;
}

export interface FlowchartProviderResult extends Partial<FlowchartPlan> {}

export interface FlowchartContentProvider {
  generateFlowchartPlan(context: FlowchartProviderContext): Promise<FlowchartProviderResult | null>;
}

export interface FlowchartSkillContext extends SkillGenerateContext {
  flowchartProvider?: FlowchartContentProvider;
  flowchartConfig?: FlowchartConfig;
  themeMode?: FlowchartThemeMode;
}
