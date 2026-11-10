import type { AppRoute } from '@/router';
import { getBreadcrumbChain } from '@/router';
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuOutlined,
  RightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import type { BreadcrumbProps } from 'antd';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from '../index.less';
import { getMenuIcon } from './menu-icons';
import SearchMenu from './SearchMenu';

const { Header } = Layout;

interface HeaderBarProps {
  routes: AppRoute[];
  pathname: string;
  isMobile: boolean;
  userName: string;
  avatar?: string;
  onToggleSider: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  routes,
  pathname,
  isMobile,
  userName,
  avatar,
  onToggleSider,
  onOpenSettings,
  onLogout,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, []);

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
            onClick={() => history.push(route.path)}
          >
            {icon ? <span className={styles.crumbIcon}>{icon}</span> : null}
            {route.name}
          </button>
        ),
      };
    });
  }, [pathname, routes]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <Header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* 桌面端折叠入口放在侧边栏底部，顶栏只保留面包屑 */}
        {isMobile ? (
          <Button
            type="text"
            className={styles.iconButton}
            icon={<MenuOutlined />}
            onClick={onToggleSider}
            aria-label="打开导航"
          />
        ) : null}
        <Breadcrumb
          className={styles.breadcrumb}
          items={breadcrumbItems}
          separator={<RightOutlined className={styles.crumbSeparator} />}
        />
      </div>

      <div className={styles.headerRight}>
        <SearchMenu routes={routes} />

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
