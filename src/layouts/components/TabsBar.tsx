import type { RouteIcon } from '@/router';
import { useThemeStore } from '@/stores/theme';
import {
  CloseCircleOutlined,
  CloseOutlined,
  MinusCircleOutlined,
  MoreOutlined,
  ReloadOutlined,
  VerticalLeftOutlined,
  VerticalRightOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Tabs, Tooltip } from 'antd';
import React from 'react';
import styles from '../index.less';
import { getMenuIcon } from './menu-icons';

export interface TabItem {
  key: string;
  title: string;
  icon?: RouteIcon;
  affix?: boolean;
}

interface TabsBarProps {
  tabs: TabItem[];
  activeKey: string;
  refreshing?: boolean;
  onTabClick: (key: string) => void;
  onClose: (key: string) => void;
  onRefresh: (key: string) => void;
  onCloseOthers: (key: string) => void;
  onCloseLeft: (key: string) => void;
  onCloseRight: (key: string) => void;
  onCloseAll: () => void;
}

const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeKey,
  refreshing,
  onTabClick,
  onClose,
  onRefresh,
  onCloseOthers,
  onCloseLeft,
  onCloseRight,
  onCloseAll,
}) => {
  const tabsStyle = useThemeStore((state) => state.tabsStyle);
  const tabsStyleClass = {
    soft: styles.tabsSoft,
    line: styles.tabsLine,
    card: styles.tabsCard,
    pill: styles.tabsPill,
  }[tabsStyle];

  const buildActions = (tab: TabItem): MenuProps['items'] => {
    const index = tabs.findIndex((item) => item.key === tab.key);
    const others = tabs.filter(
      (item) => item.key !== tab.key && !item.affix,
    ).length;
    const left = tabs
      .slice(0, Math.max(index, 0))
      .filter((item) => !item.affix);
    const right = tabs.slice(index + 1).filter((item) => !item.affix);
    const closableCount = tabs.filter((item) => !item.affix).length;

    return [
      {
        key: 'refresh',
        label: '刷新当前页',
        icon: <ReloadOutlined />,
      },
      { type: 'divider' },
      {
        key: 'close',
        label: '关闭当前',
        icon: <CloseOutlined />,
        disabled: Boolean(tab.affix),
      },
      {
        key: 'closeOthers',
        label: '关闭其他',
        icon: <CloseCircleOutlined />,
        disabled: others === 0,
      },
      {
        key: 'closeLeft',
        label: '关闭左侧',
        icon: <VerticalRightOutlined />,
        disabled: left.length === 0,
      },
      {
        key: 'closeRight',
        label: '关闭右侧',
        icon: <VerticalLeftOutlined />,
        disabled: right.length === 0,
      },
      { type: 'divider' },
      {
        key: 'closeAll',
        label: '关闭全部',
        icon: <MinusCircleOutlined />,
        disabled: closableCount === 0,
        danger: true,
      },
    ];
  };

  const handleMenuClick = (tab: TabItem, key: string) => {
    if (key === 'refresh') onRefresh(tab.key);
    if (key === 'close') onClose(tab.key);
    if (key === 'closeOthers') onCloseOthers(tab.key);
    if (key === 'closeLeft') onCloseLeft(tab.key);
    if (key === 'closeRight') onCloseRight(tab.key);
    if (key === 'closeAll') onCloseAll();
  };

  const items = tabs.map((tab) => ({
    key: tab.key,
    closable: !tab.affix,
    label: (
      <Dropdown
        trigger={['contextMenu']}
        menu={{
          items: buildActions(tab),
          onClick: ({ key }) => handleMenuClick(tab, key),
        }}
      >
        <span className={styles.tabLabel} title={tab.title}>
          {tab.icon ? (
            <span className={styles.tabIcon}>{getMenuIcon(tab.icon, 0)}</span>
          ) : null}
          {tab.title}
        </span>
      </Dropdown>
    ),
  }));

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  const moreItems = activeTab
    ? (buildActions(activeTab) ?? [])
        .filter((item) => item && item.key !== 'refresh')
        .filter((item, index) => !(index === 0 && item?.type === 'divider'))
    : [];

  return (
    <div className={styles.tabsBar}>
      <Tabs
        className={[styles.tabs, tabsStyleClass].filter(Boolean).join(' ')}
        type="editable-card"
        size="small"
        hideAdd
        activeKey={activeKey}
        items={items}
        onChange={onTabClick}
        onEdit={(targetKey, action) => {
          if (action === 'remove' && typeof targetKey === 'string') {
            onClose(targetKey);
          }
        }}
        tabBarExtraContent={{
          right: (
            <div className={styles.tabsActions}>
              <Tooltip title="刷新当前页">
                <Button
                  type="text"
                  size="small"
                  className={styles.tabsActionBtn}
                  icon={<ReloadOutlined spin={refreshing} />}
                  aria-label="刷新当前页"
                  onClick={() => activeTab && onRefresh(activeTab.key)}
                />
              </Tooltip>
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: moreItems,
                  onClick: ({ key }) => {
                    if (activeTab) handleMenuClick(activeTab, key);
                  },
                }}
              >
                <Button
                  type="text"
                  size="small"
                  className={styles.tabsActionBtn}
                  icon={<MoreOutlined />}
                  aria-label="页签操作"
                />
              </Dropdown>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default TabsBar;
