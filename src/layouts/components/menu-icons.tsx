import type { RouteIcon } from '@/router';
import { AppstoreOutlined, TableOutlined } from '@ant-design/icons';
import React from 'react';

const MENU_ICONS: Record<RouteIcon, React.ReactNode> = {
  dashboard: <AppstoreOutlined />,
  table: <TableOutlined />,
};

/** 按路由图标 key 获取图标，供面包屑、页签、搜索面板复用 */
export function getRouteIcon(icon?: RouteIcon): React.ReactNode {
  if (!icon) return undefined;
  return MENU_ICONS[icon];
}

/** 只有一级菜单展示图标，子菜单保持纯文字，视觉更干净 */
export function getMenuIcon(
  icon: RouteIcon | undefined,
  depth: number,
): React.ReactNode {
  if (!icon || depth > 0) return undefined;
  return getRouteIcon(icon);
}
