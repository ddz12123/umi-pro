import type { ThemeConfig } from 'antd';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif";

/** 全局设计 token：布局、菜单、页签、面包屑共用一套视觉语言 */
export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563eb',
    colorInfo: '#2563eb',
    colorLink: '#2563eb',
    colorBgLayout: '#f4f6fa',
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorBorderSecondary: '#eef1f6',
    borderRadius: 8,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#fff',
      bodyBg: '#f4f6fa',
      siderBg: '#0b1424',
      headerHeight: 56,
      headerPadding: '0 16px',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkPopupBg: '#111c30',
      darkItemColor: 'rgba(255, 255, 255, 0.68)',
      darkItemHoverColor: '#fff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
      darkItemSelectedColor: '#fff',
      darkItemSelectedBg: 'rgba(59, 130, 246, 0.18)',
      darkGroupTitleColor: 'rgba(255, 255, 255, 0.4)',
      itemBorderRadius: 8,
      subMenuItemBorderRadius: 8,
      itemHeight: 38,
      itemMarginInline: 8,
      iconSize: 16,
      collapsedIconSize: 17,
    },
    Tabs: {
      cardBg: 'transparent',
      cardGutter: 6,
      itemColor: '#5b6678',
      itemHoverColor: '#1f2937',
      itemSelectedColor: '#1d4ed8',
    },
    Breadcrumb: {
      itemColor: '#64748b',
      lastItemColor: '#1f2937',
      separatorColor: '#cbd5e1',
      linkColor: '#64748b',
    },
  },
};
