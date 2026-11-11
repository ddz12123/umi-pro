import Logo from '@/components/Logo';
import { SYSTEM_NAME } from '@/constants/app';
import type { AppRoute } from '@/router';
import {
  DEFAULT_ROUTE_PATH,
  getAffixPaths,
  getBreadcrumbChain,
} from '@/router';
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuOutlined,
  RightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { BreadcrumbProps } from 'antd';
import {
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Layout,
  Menu,
  Tooltip,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from '../index.less';
import { getMenuIcon } from './menu-icons';
import SearchMenu from './SearchMenu';
import { buildMenuItems } from './Sidebar';

const { Header } = Layout;

interface HeaderBarProps {
  layout: 'side' | 'top';
  routes: AppRoute[];
  pathname: string;
  menuActivePath: string;
  isMobile: boolean;
  userName: string;
  avatar?: string;
  onToggleSider: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  layout,
  routes,
  pathname,
  menuActivePath,
  isMobile,
  userName,
  avatar,
  onToggleSider,
  onOpenSettings,
  onLogout,
  onNavigate,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isTop = layout === 'top';

  useEffect(() => {
    const handleFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, []);

  const menuItems = useMemo(() => buildMenuItems(routes), [routes]);
  const homePath = useMemo(
    () =>
      getAffixPaths(routes)[0] ??
      routes.find((route) => route.component && !route.hideInMenu)?.path ??
      DEFAULT_ROUTE_PATH,
    [routes],
  );

  /** 面包屑严格取自路由链，父级可点击返回。 */
  const breadcrumbItems = useMemo<BreadcrumbProps['items']>(() => {
    const chain = getBreadcrumbChain(pathname, routes);
    return chain.map((route, index) => {
      const last = index === chain.length - 1;
      const icon = getMenuIcon(route.icon, 0);
      return {
        title: last ? (
          <span className={styles.crumbCurrent} title={route.name}>
            {icon ? <span className={styles.crumbIcon}>{icon}</span> : null}
            {route.name}
          </span>
        ) : (
          <button
            type="button"
            className={styles.crumbItem}
            onClick={() => onNavigate(route.path)}
          >
            {icon ? <span className={styles.crumbIcon}>{icon}</span> : null}
            {route.name}
          </button>
        ),
      };
    });
  }, [pathname, routes, onNavigate]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const handleBrandKey = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNavigate(homePath);
    }
  };

  return (
    <Header
      className={[styles.header, isTop ? styles.headerTop : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.headerLeft}>
        {isMobile ? (
          <Button
            type="text"
            className={styles.iconButton}
            icon={<MenuOutlined />}
            onClick={onToggleSider}
            aria-label="打开导航"
          />
        ) : null}
        {isTop ? (
          <>
            <div
              className={styles.topBrand}
              role="button"
              tabIndex={0}
              title={SYSTEM_NAME}
              onClick={() => onNavigate(homePath)}
              onKeyDown={handleBrandKey}
            >
              <Logo size={30} />
              <span className={styles.topBrandName}>{SYSTEM_NAME}</span>
            </div>
            {!isMobile ? (
              <Menu
                className={styles.topMenu}
                theme="dark"
                mode="horizontal"
                items={menuItems}
                selectedKeys={[menuActivePath]}
                onClick={({ key }) => onNavigate(key)}
              />
            ) : null}
          </>
        ) : (
          <Breadcrumb
            className={styles.breadcrumb}
            items={breadcrumbItems}
            separator={<RightOutlined className={styles.crumbSeparator} />}
          />
        )}
      </div>

      <div className={styles.headerRight}>
        <SearchMenu routes={routes} onNavigate={onNavigate} />

        <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
          <Button
            type="text"
            className={styles.iconButton}
            icon={
              isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
            }
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? '退出全屏' : '全屏'}
          />
        </Tooltip>

        <span className={styles.headerDivider} aria-hidden />

        <Dropdown
          placement="bottomRight"
          menu={{
            items: [
              {
                key: 'logout',
                label: '退出登录',
                icon: <LogoutOutlined />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'logout') onLogout();
            },
          }}
        >
          <button type="button" className={styles.user}>
            <Avatar
              size={30}
              src={avatar}
              className={styles.avatar}
              style={{
                background:
                  'linear-gradient(135deg, var(--app-primary-light), var(--app-primary))',
              }}
            >
              {userName?.slice(0, 1) || 'U'}
            </Avatar>
            <span className={styles.userName}>{userName || '当前用户'}</span>
            <DownOutlined className={styles.userArrow} />
          </button>
        </Dropdown>

        <Tooltip title="界面设置">
          <Button
            type="text"
            className={[styles.iconButton, styles.settingsButton].join(' ')}
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            aria-label="界面设置"
          />
        </Tooltip>
      </div>
    </Header>
  );
};

export default HeaderBar;
