export type LogicRelationType =
  | 'progressive'
  | 'parallel'
  | 'comparison'
  | 'cycle'
  | 'hierarchy'
  | 'matrix';

export type LogicDiagramTheme = 'light' | 'dark';

export interface LogicNode {
  id: string;
  label: string;
  description?: string;
  level?: number;
  group?: string;
}

export interface LogicEdge {
  from: string;
  to: string;
  label?: string;
  relation: LogicRelationType;
}

export interface LogicDiagramConfig {
  title: string;
  summary: string;
  relationType: LogicRelationType;
  theme: LogicDiagramTheme;
  nodes: LogicNode[];
  edges: LogicEdge[];
}

export interface LogicDiagramSkillContext extends Record<string, unknown> {
  taskId?: string;
  logicDiagramConfig?: Partial<LogicDiagramConfig>;
  themeMode?: LogicDiagramTheme;
}
