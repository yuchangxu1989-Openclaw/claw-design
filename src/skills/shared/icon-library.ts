export interface IconDef {
  id: string;
  name: string;
  svg: string;
  category: string;
}

const ICONS: IconDef[] = [
  { id: 'arrow-right', name: '右箭头', category: 'navigation', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
  { id: 'check', name: '勾选', category: 'status', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' },
  { id: 'warning', name: '警告', category: 'status', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>' },
  { id: 'chart-bar', name: '柱状图', category: 'data', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>' },
  { id: 'users', name: '用户', category: 'people', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' },
  { id: 'star', name: '星标', category: 'decoration', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>' },
  { id: 'globe', name: '全球', category: 'general', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>' },
  { id: 'layers', name: '层级', category: 'structure', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>' },
];

export function getIcon(id: string): IconDef | undefined {
  return ICONS.find(i => i.id === id);
}

export function getIconsByCategory(category: string): IconDef[] {
  return ICONS.filter(i => i.category === category);
}

export function getAllIcons(): IconDef[] {
  return [...ICONS];
}

export function renderIcon(id: string, size = 24, color = 'currentColor'): string {
  const icon = getIcon(id);
  if (!icon) return '';
  return icon.svg
    .replace('viewBox=', `width="${size}" height="${size}" style="color:${color}" viewBox=`);
}
