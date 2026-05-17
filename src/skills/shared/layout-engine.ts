export interface LayoutSlot {
  name: string;
  x: string;
  y: string;
  width: string;
  height: string;
}

export interface LayoutSkeleton {
  id: string;
  name: string;
  slots: LayoutSlot[];
  css: string;
}

export const LAYOUT_SKELETONS: LayoutSkeleton[] = [
  {
    id: 'single-center',
    name: '单栏居中',
    slots: [{ name: 'main', x: '10%', y: '5%', width: '80%', height: '90%' }],
    css: '.layout-single-center { display:flex; justify-content:center; align-items:center; }',
  },
  {
    id: 'two-column',
    name: '双栏',
    slots: [
      { name: 'left', x: '2%', y: '5%', width: '46%', height: '90%' },
      { name: 'right', x: '52%', y: '5%', width: '46%', height: '90%' },
    ],
    css: '.layout-two-column { display:grid; grid-template-columns:1fr 1fr; gap:var(--cd-spacing-unit); }',
  },
  {
    id: 'header-body',
    name: '标题+正文',
    slots: [
      { name: 'header', x: '5%', y: '2%', width: '90%', height: '15%' },
      { name: 'body', x: '5%', y: '20%', width: '90%', height: '75%' },
    ],
    css: '.layout-header-body { display:flex; flex-direction:column; }',
  },
  {
    id: 'grid-3',
    name: '三栏网格',
    slots: [
      { name: 'col1', x: '2%', y: '5%', width: '30%', height: '90%' },
      { name: 'col2', x: '35%', y: '5%', width: '30%', height: '90%' },
      { name: 'col3', x: '68%', y: '5%', width: '30%', height: '90%' },
    ],
    css: '.layout-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:var(--cd-spacing-unit); }',
  },
];

export function getLayoutSkeleton(id: string): LayoutSkeleton | undefined {
  return LAYOUT_SKELETONS.find(l => l.id === id);
}

export function getLayoutCss(id: string): string {
  return getLayoutSkeleton(id)?.css ?? '';
}
