import { appConfig } from '@/config/app';
import { session } from '@/utils/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TabsState {
  /** 页签记录完整地址，切换后保留查询参数和锚点。 */
  tabs: string[];
  /** 固定页签：不可关闭，且始终保留在最前面。 */
  pinned: string[];
  setPinned: (paths: string[]) => void;
  open: (path: string) => void;
  close: (path: string) => void;
  closeOthers: (path: string) => void;
  closeLeft: (path: string) => void;
  closeRight: (path: string) => void;
  closeAll: () => void;
  reset: () => void;
}

/** 合并固定页签并去重，保证固定页签不会因为关闭操作丢失。 */
function keepPinned(tabs: string[], pinned: string[]) {
  return [...new Set([...pinned, ...tabs])];
}

/** 多页签状态：刷新恢复已打开页签，关闭浏览器标签页后清空。 */
export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      pinned: [],
      setPinned: (pinned) =>
        set((state) => ({ pinned, tabs: keepPinned(state.tabs, pinned) })),
      open: (path) => {
        const { tabs, pinned } = get();
        const next = keepPinned([...tabs, path], pinned);
        while (next.length > appConfig.tabs.maxCount) {
          const index = next.findIndex(
            (item) => item !== path && !pinned.includes(item),
          );
          if (index < 0) break;
          next.splice(index, 1);
        }
        set({ tabs: next });
      },
      close: (path) =>
        set((state) => ({
          tabs: keepPinned(
            state.tabs.filter((item) => item !== path),
            state.pinned,
          ),
        })),
      closeOthers: (path) =>
        set((state) => ({ tabs: keepPinned([path], state.pinned) })),
      closeLeft: (path) =>
        set((state) => {
          const index = state.tabs.indexOf(path);
          return index < 0
            ? state
            : { tabs: keepPinned(state.tabs.slice(index), state.pinned) };
        }),
      closeRight: (path) =>
        set((state) => {
          const index = state.tabs.indexOf(path);
          return index < 0
            ? state
            : {
                tabs: keepPinned(state.tabs.slice(0, index + 1), state.pinned),
              };
        }),
      closeAll: () => set((state) => ({ tabs: [...state.pinned] })),
      reset: () => set({ tabs: [], pinned: [] }),
    }),
    {
      name: appConfig.storagePrefix + ':tabs',
      storage: createJSONStorage(() => session),
      /** 只持久化导航记录，固定页签由布局根据路由实时计算。 */
      partialize: (state) => ({ tabs: state.tabs }),
      /** 恢复时过滤非法地址，并限制最大页签数量。 */
      merge: (persisted, current) => {
        const value = (persisted as { tabs?: unknown } | undefined)?.tabs;
        const tabs = Array.isArray(value)
          ? value.filter(
              (item): item is string =>
                typeof item === 'string' && /^\/(?!\/)/.test(item),
            )
          : [];
        return {
          ...current,
          tabs: [...new Set(tabs)].slice(-appConfig.tabs.maxCount),
        };
      },
      version: 1,
    },
  ),
);
