import type { RouteIcon } from '@/router';
import {
  AppstoreOutlined,
  SettingOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons';
import React from 'react';

const MENU_ICONS: Record<RouteIcon, React.ReactNode> = {
  dashboard: <AppstoreOutlined />,
  table: <TableOutlined />,
  system: <SettingOutlined />,
  user: <UserOutlined />,
};

/** 只有一级菜单展示图标，子菜单保持纯文字，视觉更干净 */
export function getMenuIcon(
  icon: RouteIcon | undefined,
  depth: number,
): React.ReactNode {
  if (!icon || depth > 0) return undefined;
  return MENU_ICONS[icon];
}
