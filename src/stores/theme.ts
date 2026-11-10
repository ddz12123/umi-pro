import { local } from '@/utils/storage';
import { create } from 'zustand';

/** 页签视觉风格 */
export type TabsStyle = 'soft' | 'line' | 'card' | 'pill';

export const DEFAULT_PRIMARY_COLOR = '#2563eb';
export const DEFAULT_TABS_STYLE: TabsStyle = 'soft';

/** 预设主题色 */
export const THEME_PRESETS: { label: string; value: string }[] = [
  { label: '宝石蓝', value: '#2563eb' },
  { label: '青碧', value: '#0891b2' },
  { label: '森绿', value: '#16a34a' },
  { label: '紫罗兰', value: '#7c3aed' },
  { label: '落日橙', value: '#ea580c' },
  { label: '玫红', value: '#e11d48' },
];

const STORAGE_KEY = 'theme-settings';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

interface StoredTheme {
  primaryColor?: string;
  tabsStyle?: string;
}

function normalizeTabsStyle(value?: string): TabsStyle {
  return value === 'line' || value === 'card' || value === 'pill'
    ? value
    : 'soft';
}

function readTheme(): { primaryColor: string; tabsStyle: TabsStyle } {
  try {
    const raw = local.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        primaryColor: DEFAULT_PRIMARY_COLOR,
        tabsStyle: DEFAULT_TABS_STYLE,
      };
    }
    const parsed = JSON.parse(raw) as StoredTheme;
    return {
      primaryColor: HEX_COLOR.test(parsed.primaryColor ?? '')
        ? (parsed.primaryColor as string)
        : DEFAULT_PRIMARY_COLOR,
      tabsStyle: normalizeTabsStyle(parsed.tabsStyle),
    };
  } catch {
    return {
      primaryColor: DEFAULT_PRIMARY_COLOR,
      tabsStyle: DEFAULT_TABS_STYLE,
    };
  }
}

function persist(primaryColor: string, tabsStyle: TabsStyle) {
  local.setItem(STORAGE_KEY, JSON.stringify({ primaryColor, tabsStyle }));
}

function toRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixWhite(hex: string, amount: number) {
  const { r, g, b } = toRgb(hex);
  const mix = (value: number) => Math.round(value + (255 - value) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** 把主题色同步到 CSS 变量，供自定义样式使用。 */
export function applyThemeCssVars(primaryColor: string) {
  if (typeof document === 'undefined') return;
  const style = document.documentElement.style;
  style.setProperty('--app-primary', primaryColor);
  style.setProperty('--app-primary-light', mixWhite(primaryColor, 0.55));
  style.setProperty('--app-primary-soft', rgba(primaryColor, 0.1));
  style.setProperty('--app-primary-13', rgba(primaryColor, 0.13));
  style.setProperty('--app-primary-18', rgba(primaryColor, 0.18));
  style.setProperty('--app-primary-border', rgba(primaryColor, 0.24));
  style.setProperty('--app-primary-28', rgba(primaryColor, 0.28));
  style.setProperty('--app-primary-70', rgba(primaryColor, 0.7));
  style.setProperty('--app-primary-glow', rgba(primaryColor, 0.35));
}

interface ThemeState {
  primaryColor: string;
  tabsStyle: TabsStyle;
  setPrimaryColor: (color: string) => void;
  setTabsStyle: (style: TabsStyle) => void;
  reset: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...readTheme(),

  setPrimaryColor: (primaryColor) => {
    if (!HEX_COLOR.test(primaryColor)) return;
    set({ primaryColor });
    persist(primaryColor, get().tabsStyle);
  },

  setTabsStyle: (tabsStyle) => {
    set({ tabsStyle });
    persist(get().primaryColor, tabsStyle);
  },

  reset: () => {
    set({
      primaryColor: DEFAULT_PRIMARY_COLOR,
      tabsStyle: DEFAULT_TABS_STYLE,
    });
    persist(DEFAULT_PRIMARY_COLOR, DEFAULT_TABS_STYLE);
  },
}));
