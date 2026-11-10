import type { AppRoute } from '@/router';
import { getBreadcrumbChain, getSearchEntries } from '@/router';
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import type { BreadcrumbProps, InputRef } from 'antd';
import {
  AutoComplete,
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Input,
  Layout,
  Tooltip,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../index.less';

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
  const [keyword, setKeyword] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchRef = useRef<InputRef>(null);

  const searchEntries = useMemo(() => getSearchEntries(routes), [routes]);

  const options = useMemo(
    () =>
      searchEntries.map((entry) => ({
        value: entry.path,
        search: `${entry.name} ${entry.trail.join(' ')} ${entry.path}`,
        label: (
          <div className={styles.searchOption}>
            <span className={styles.searchOptionTitle}>{entry.name}</span>
            {entry.trail.length ? (
              <span className={styles.searchOptionTrail}>
                {entry.trail.join(' / ')}
              </span>
            ) : null}
          </div>
        ),
      })),
    [searchEntries],
  );

  const filteredOptions = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return options;
    return options.filter((option) =>
      option.search.toLowerCase().includes(value),
    );
  }, [keyword, options]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    const handleFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    window.addEventListener('keydown', handleShortcut);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
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

  const navigate = (path: string) => {
    history.push(path);
    setKeyword('');
    searchRef.current?.blur();
  };

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
        <AutoComplete
          className={styles.search}
          value={keyword}
          options={filteredOptions}
          filterOption={false}
          notFoundContent="没有匹配的页面"
          onSelect={(value) => navigate(value)}
          onChange={setKeyword}
        >
          <Input
            ref={searchRef}
            allowClear
            prefix={<SearchOutlined className={styles.searchIcon} />}
            suffix={<kbd className={styles.kbd}>Ctrl K</kbd>}
            placeholder="搜索页面"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && filteredOptions[0]) {
                navigate(filteredOptions[0].value);
              }
            }}
          />
        </AutoComplete>

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
