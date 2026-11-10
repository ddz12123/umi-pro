import Logo from '@/components/Logo';
import { appConfig } from '@/config/app';
import { SYSTEM_NAME } from '@/constants/app';
import type { AppRoute } from '@/router';
import { DEFAULT_ROUTE_PATH, getAffixPaths } from '@/router';
import { isConcretePath } from '@/router/tree';
import {
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Menu, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styles from '../index.less';
import { getMenuIcon } from './menu-icons';

type AntdMenuItem = NonNullable<MenuProps['items']>[number];

interface SidebarProps {
  routes: AppRoute[];
  collapsed: boolean;
  activePath: string;
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  onNavigate: (path: string) => void;
  /** 移动端抽屉模式：展示关闭按钮，不展示折叠按钮 */
  mobile?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

function buildMenuItems(nodes: AppRoute[], depth = 0): AntdMenuItem[] {
  const items: AntdMenuItem[] = [];

  nodes.forEach((node) => {
    if (node.hideInMenu) return;

    if (node.children?.length) {
      const children = buildMenuItems(node.children, depth + 1);
      if (!children.length) return;
      items.push({
        key: node.path,
        icon: getMenuIcon(node.icon, depth),
        label: node.name,
        children,
      });
      return;
    }

    if (!node.component || !isConcretePath(node.path)) return;

    items.push({
      key: node.path,
      icon: getMenuIcon(node.icon, depth),
      label: node.name,
    });
  });

  return items;
}

const Sidebar: React.FC<SidebarProps> = ({
  routes,
  collapsed,
  activePath,
  openKeys,
  onOpenChange,
  onNavigate,
  mobile = false,
  onClose,
  onToggleCollapse,
}) => {
  const menuItems = useMemo(() => buildMenuItems(routes), [routes]);
  const homePath = useMemo(
    () =>
      getAffixPaths(routes)[0] ??
      routes.find((route) => route.component && !route.hideInMenu)?.path ??
      DEFAULT_ROUTE_PATH,
    [routes],
  );

  return (
    <div className={styles.sidebar}>
      <div
        className={[styles.brand, collapsed ? styles.brandCollapsed : ''].join(
          ' ',
        )}
        onClick={() => onNavigate(homePath)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onNavigate(homePath);
          }
        }}
        title={collapsed ? SYSTEM_NAME : undefined}
      >
        <Logo size={collapsed ? 32 : 34} />
        {!collapsed ? (
          <div className={styles.brandText}>
            <span className={styles.brandName}>{SYSTEM_NAME}</span>
            <span className={styles.brandSub}>{appConfig.subtitle}</span>
          </div>
        ) : null}
        {mobile ? (
          <Button
            type="text"
            size="small"
            className={styles.brandClose}
            icon={<CloseOutlined />}
            aria-label="关闭菜单"
            onClick={(event) => {
              event.stopPropagation();
              onClose?.();
            }}
          />
        ) : null}
      </div>

      <div className={styles.menuWrap}>
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          items={menuItems}
          selectedKeys={[activePath]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={(keys) => {
            if (!collapsed) onOpenChange(keys);
          }}
          onClick={({ key }) => onNavigate(key)}
          className={styles.menu}
        />
      </div>

      <div
        className={[
          styles.sidebarFooter,
          collapsed ? styles.footerCollapsed : '',
        ].join(' ')}
      >
        {!collapsed ? (
          <span className={styles.version}>v{appConfig.version}</span>
        ) : null}
        {!mobile && onToggleCollapse ? (
          <Tooltip
            title={collapsed ? '展开菜单' : '收起菜单'}
            placement="right"
          >
            <Button
              type="text"
              className={styles.collapseBtn}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={onToggleCollapse}
              aria-label={collapsed ? '展开菜单' : '收起菜单'}
            >
              {collapsed ? null : '收起'}
            </Button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
};

export default Sidebar;
