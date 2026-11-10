import type { AppRoute } from '@/router';
import { getBreadcrumbChain } from '@/router';
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import type { BreadcrumbProps } from 'antd';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from '../index.less';
import SearchMenu from './SearchMenu';

const { Header } = Layout;

interface HeaderBarProps {
  routes: AppRoute[];
  pathname: string;
  isMobile: boolean;
  userName: string;
  avatar?: string;
  onToggleSider: () => void;
  onLogout: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  routes,
  pathname,
  isMobile,
  userName,
  avatar,
  onToggleSider,
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

  /**
   * 面包屑完全取自路由链：
   * /system/user -> 系统管理 / 用户管理，不再额外拼「首页」
   */
  const breadcrumbItems = useMemo<BreadcrumbProps['items']>(
    () =>
      getBreadcrumbChain(pathname, routes).map((route, index, chain) => {
        const last = index === chain.length - 1;
        return {
          title: (
            <span className={last ? styles.crumbCurrent : styles.crumbMuted}>
              {route.name}
            </span>
          ),
        };
      }),
    [pathname, routes],
  );

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
          separator={<span className={styles.crumbSeparator}>/</span>}
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
                background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
              }}
            >
              {userName?.slice(0, 1) || 'U'}
            </Avatar>
            <span className={styles.userName}>{userName || '当前用户'}</span>
            <DownOutlined className={styles.userArrow} />
          </button>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
