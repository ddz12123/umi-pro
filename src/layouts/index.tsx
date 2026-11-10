import ErrorBoundary from '@/components/ErrorBoundary';
import ExceptionPage from '@/components/ExceptionPage';
import { appConfig } from '@/config/app';
import { SIDER_COLLAPSED_KEY } from '@/constants/layout';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  DEFAULT_ROUTE_PATH,
  findGroupRoute,
  getAffixPaths,
  getParentPaths,
  matchRoute,
} from '@/router';
import { useRouteStore } from '@/stores/routes';
import { useTabsStore } from '@/stores/tabs';
import { getLoginUrl, getToken } from '@/utils/auth';
import { endSession } from '@/utils/session';
import { local } from '@/utils/storage';
import { Navigate, Outlet, history, useLocation, useModel } from '@umijs/max';
import { Drawer, Layout } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import HeaderBar from './components/HeaderBar';
import Sidebar from './components/Sidebar';
import type { TabItem } from './components/TabsBar';
import TabsBar from './components/TabsBar';
import styles from './index.less';

const { Sider, Content } = Layout;

/**
 * 企业级后台布局
 * ------------------------------------------------------------------
 * 侧边栏（路由树自动生成菜单） + 顶栏（面包屑/搜索/用户）
 * + 多页签（sessionStorage 持久化，刷新不丢） + 内容区（异常兜底）
 */
const BasicLayout: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { initialState, setInitialState } = useModel('@@initialState');

  const [collapsed, setCollapsed] = useState(
    () => local.getItem(SIDER_COLLAPSED_KEY) === '1',
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number>();

  const routes = useRouteStore((state) => state.routes);
  const routeError = useRouteStore((state) => state.error);

  const tabPaths = useTabsStore((state) => state.tabs);
  const openTab = useTabsStore((state) => state.open);
  const setPinned = useTabsStore((state) => state.setPinned);
  const closeTab = useTabsStore((state) => state.close);
  const closeOthers = useTabsStore((state) => state.closeOthers);
  const closeLeft = useTabsStore((state) => state.closeLeft);
  const closeRight = useTabsStore((state) => state.closeRight);
  const closeAll = useTabsStore((state) => state.closeAll);

  const activePath = location.pathname;
  const activeKey = `${activePath}${location.search}${location.hash}`;
  const matched = useMemo(
    () => matchRoute(activePath, routes),
    [activePath, routes],
  );
  const layoutMode = matched?.route.layoutMode ?? 'page';
  const menuActivePath =
    matched?.route.activeMenu ?? matched?.route.path ?? activePath;
  const affixPaths = useMemo(() => getAffixPaths(routes), [routes]);

  /** 实际渲染的页签：固定页签 + 已访问页签 + 当前路由（刷新后自动补全） */
  const tabItems = useMemo<TabItem[]>(() => {
    const ordered = Array.from(
      new Set([...affixPaths, ...tabPaths, activeKey]),
    );

    return ordered.flatMap<TabItem>((path) => {
      // 分组路径只做重定向，不生成页签
      if (findGroupRoute(path, routes)) return [];

      const match = matchRoute(path, routes);
      if (!match || match.route.hideInTabs) return [];

      // 历史遗留 / 已删除路由不再生成页签，避免出现一堆「页面不存在」
      if (match.route.path === '*' && path !== activeKey) return [];

      return [
        {
          key: path,
          title: match.route.name,
          affix: affixPaths.includes(path),
        },
      ];
    });
  }, [affixPaths, activeKey, routes, tabPaths]);

  useEffect(() => {
    setPinned(affixPaths);
  }, [affixPaths, setPinned]);

  useEffect(() => {
    if (!appConfig.tabs.enabled || !matched || matched.route.hideInTabs) return;
    if (findGroupRoute(activePath, routes)) return;
    openTab(activeKey);
  }, [activePath, activeKey, matched, openTab, routes]);

  useEffect(() => {
    const parents = getParentPaths(menuActivePath, routes);
    if (!parents.length) return;
    setOpenKeys((prev) => Array.from(new Set([...prev, ...parents])));
  }, [menuActivePath, routes]);

  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [activeKey, isMobile]);

  useEffect(
    () => () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    },
    [],
  );

  if (!getToken()) {
    return (
      <Navigate
        to={getLoginUrl(activePath, location.search, location.hash)}
        replace
      />
    );
  }

  const navigate = (path: string) => {
    history.push(path);
    setMobileMenuOpen(false);
  };

  const toggleSider = () => {
    if (isMobile) {
      setMobileMenuOpen(true);
      return;
    }
    setCollapsed((prev) => {
      const next = !prev;
      local.setItem(SIDER_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const refreshTab = (path: string) => {
    if (path !== activeKey) history.push(path);
    setRefreshKey((key) => key + 1);
    setRefreshing(true);
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => setRefreshing(false), 600);
  };

  const handleCloseTab = (key: string) => {
    if (affixPaths.includes(key)) return;

    const index = tabItems.findIndex((tab) => tab.key === key);
    const remaining = tabItems.filter((tab) => tab.key !== key);
    closeTab(key);

    if (key !== activeKey) return;
    const next =
      remaining[index] ??
      remaining[index - 1] ??
      remaining.find((tab) => tab.affix);
    navigate(next?.key || affixPaths[0] || DEFAULT_ROUTE_PATH);
  };

  const handleCloseOthers = (key: string) => {
    closeOthers(key);
    if (key !== activeKey && !affixPaths.includes(activeKey)) {
      navigate(key);
    }
  };

  const handleCloseLeft = (key: string) => {
    const targetIndex = tabItems.findIndex((tab) => tab.key === key);
    const activeIndex = tabItems.findIndex((tab) => tab.key === activeKey);
    closeLeft(key);
    if (
      !affixPaths.includes(activeKey) &&
      activeIndex >= 0 &&
      activeIndex < targetIndex
    ) {
      navigate(key);
    }
  };

  const handleCloseRight = (key: string) => {
    const targetIndex = tabItems.findIndex((tab) => tab.key === key);
    const activeIndex = tabItems.findIndex((tab) => tab.key === activeKey);
    closeRight(key);
    if (
      !affixPaths.includes(activeKey) &&
      activeIndex > targetIndex &&
      targetIndex >= 0
    ) {
      navigate(key);
    }
  };

  const handleCloseAll = () => {
    closeAll();
    if (!affixPaths.includes(activeKey)) {
      navigate(affixPaths[0] || DEFAULT_ROUTE_PATH);
    }
  };

  const handleLogout = () => {
    setInitialState({ name: '', avatar: undefined });
    endSession(false);
  };

  return (
    <Layout className={styles.root}>
      {!isMobile ? (
        <Sider
          className={styles.sider}
          theme="dark"
          width={240}
          collapsedWidth={64}
          collapsed={collapsed}
          trigger={null}
        >
          <Sidebar
            routes={routes}
            collapsed={collapsed}
            activePath={menuActivePath}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onNavigate={navigate}
            onToggleCollapse={toggleSider}
          />
        </Sider>
      ) : null}

      <Layout className={styles.main}>
        <HeaderBar
          routes={routes}
          pathname={activePath}
          isMobile={isMobile}
          userName={initialState?.name || ''}
          avatar={initialState?.avatar}
          onToggleSider={toggleSider}
          onLogout={handleLogout}
        />

        {appConfig.tabs.enabled ? (
          <TabsBar
            tabs={tabItems}
            activeKey={activeKey}
            refreshing={refreshing}
            onTabClick={navigate}
            onClose={handleCloseTab}
            onRefresh={refreshTab}
            onCloseOthers={handleCloseOthers}
            onCloseLeft={handleCloseLeft}
            onCloseRight={handleCloseRight}
            onCloseAll={handleCloseAll}
          />
        ) : null}

        <Content className={styles.content}>
          <div
            key={`${activeKey}-${refreshKey}`}
            className={layoutMode === 'fill' ? styles.fill : styles.page}
          >
            <ErrorBoundary resetKey={`${activeKey}-${refreshKey}`}>
              {routeError ? (
                <ExceptionPage
                  status={500}
                  title="页面配置加载失败"
                  description={routeError}
                />
              ) : (
                <Outlet />
              )}
            </ErrorBoundary>
          </div>
        </Content>
      </Layout>

      {isMobile ? (
        <Drawer
          open={mobileMenuOpen}
          placement="left"
          size={272}
          closable={false}
          rootClassName={styles.drawer}
          onClose={() => setMobileMenuOpen(false)}
        >
          <Sidebar
            mobile
            routes={routes}
            collapsed={false}
            activePath={menuActivePath}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onNavigate={navigate}
            onClose={() => setMobileMenuOpen(false)}
          />
        </Drawer>
      ) : null}
    </Layout>
  );
};

export default BasicLayout;
