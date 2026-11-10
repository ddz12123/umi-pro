import type { AppRoute } from './types';

/** 本地页面接入点；菜单、搜索、面包屑和页签统一从这棵树派生。 */
export const localRoutes: AppRoute[] = [
  {
    name: '列表示例',
    path: '/example',
    component: 'Example',
    icon: 'table',
    layoutMode: 'fill',
    order: 10,
  },
];
