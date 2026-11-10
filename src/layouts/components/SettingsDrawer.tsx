import type { TabsStyle } from '@/stores/theme';
import { THEME_PRESETS, useThemeStore } from '@/stores/theme';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Drawer, Tooltip } from 'antd';
import React from 'react';
import styles from './SettingsDrawer.less';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TABS_STYLES: {
  value: TabsStyle;
  label: string;
  desc: string;
  preview: string;
}[] = [
  {
    value: 'soft',
    label: '柔和',
    desc: '当前页浅色高亮，整体更轻盈',
    preview: 'previewSoft',
  },
  {
    value: 'line',
    label: '下划线',
    desc: '极简线条，信息密度最高',
    preview: 'previewLine',
  },
  {
    value: 'card',
    label: '卡片',
    desc: '独立卡片，层次更清晰',
    preview: 'previewCard',
  },
  {
    value: 'pill',
    label: '胶囊',
    desc: '主色填充，强调当前页面',
    preview: 'previewPill',
  },
];

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const primaryColor = useThemeStore((state) => state.primaryColor);
  const tabsStyle = useThemeStore((state) => state.tabsStyle);
  const setPrimaryColor = useThemeStore((state) => state.setPrimaryColor);
  const setTabsStyle = useThemeStore((state) => state.setTabsStyle);
  const reset = useThemeStore((state) => state.reset);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={360}
      title="界面设置"
      className={styles.drawer}
    >
      <section className={styles.section}>
        <div className={styles.sectionTitle}>主题色</div>
        <p className={styles.sectionDesc}>应用于按钮、选中态、页签和菜单高亮</p>
        <div className={styles.swatches}>
          {THEME_PRESETS.map((color) => (
            <Tooltip key={color.value} title={color.label}>
              <button
                type="button"
                aria-label={color.label}
                className={[
                  styles.swatch,
                  primaryColor === color.value ? styles.swatchActive : '',
                ].join(' ')}
                style={{ background: color.value }}
                onClick={() => setPrimaryColor(color.value)}
              >
                {primaryColor === color.value ? <CheckOutlined /> : null}
              </button>
            </Tooltip>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>页签样式</div>
        <p className={styles.sectionDesc}>切换多页签区域的视觉风格</p>
        <div className={styles.tabStyles}>
          {TABS_STYLES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={[
                styles.tabStyleCard,
                tabsStyle === item.value ? styles.tabStyleActive : '',
              ].join(' ')}
              onClick={() => setTabsStyle(item.value)}
            >
              <span
                className={[styles.preview, styles[item.preview]].join(' ')}
                aria-hidden
              >
                <i />
                <i />
                <i />
              </span>
              <span className={styles.tabStyleText}>
                <span className={styles.tabStyleLabel}>{item.label}</span>
                <span className={styles.tabStyleDesc}>{item.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <Button
        block
        icon={<ReloadOutlined />}
        className={styles.reset}
        onClick={reset}
      >
        恢复默认
      </Button>
    </Drawer>
  );
};

export default SettingsDrawer;
