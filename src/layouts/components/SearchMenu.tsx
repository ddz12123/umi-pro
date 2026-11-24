import { appConfig } from '@/config/app';
import type { AppRoute, SearchEntry } from '@/router';
import { getSearchEntries } from '@/router';
import { local } from '@/utils/storage';
import {
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
  EnterOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getRouteIcon } from './menu-icons';
import styles from './SearchMenu.less';

interface SearchMenuProps {
  routes: AppRoute[];
  currentPath: string;
  dark?: boolean;
  onNavigate: (path: string) => void;
}

interface IndexedEntry extends SearchEntry {
  trailText: string;
  lowerName: string;
  lowerTrail: string;
  lowerPath: string;
  haystack: string;
}

const RECENT_KEY = `${appConfig.storagePrefix}:search-recent`;
const MAX_RECENT = 5;

function readRecentPaths(): string[] {
  try {
    const raw = local.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecentPaths(paths: string[]) {
  local.setItem(RECENT_KEY, JSON.stringify(paths.slice(0, MAX_RECENT)));
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(
    navigator.platform || navigator.userAgent,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 高亮所有匹配的关键词片段，支持多词空格分词。 */
function renderHighlight(text: string, pattern?: RegExp): React.ReactNode {
  if (!pattern || !text) return text;
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${index}-${part}`} className={styles.highlight}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/** 计算匹配权重：标题前缀 > 标题包含 > 分组匹配 > 路径匹配。 */
function scoreEntry(entry: IndexedEntry, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) {
    if (!entry.haystack.includes(token)) return 0;
    if (entry.lowerName === token) score += 100;
    else if (entry.lowerName.startsWith(token)) score += 60;
    else if (entry.lowerName.includes(token)) score += 40;
    else if (entry.lowerTrail.includes(token)) score += 20;
    else if (entry.lowerPath.includes(token)) score += 10;
  }
  return score;
}

interface SearchRowProps {
  entry: IndexedEntry;
  index: number;
  optionId: string;
  active: boolean;
  current: boolean;
  recent: boolean;
  highlightPattern?: RegExp;
  onHover: (index: number) => void;
  onSelect: (path: string) => void;
  onRemoveRecent: (path: string, event: React.MouseEvent) => void;
  registerNode: (path: string, node: HTMLDivElement | null) => void;
}

/** 独立记忆化列表行：悬停或上下切换时仅更新变化的 2 行，避免整窗重渲染。 */
const SearchRow = React.memo<SearchRowProps>(
  ({
    entry,
    index,
    optionId,
    active,
    current,
    recent,
    highlightPattern,
    onHover,
    onSelect,
    onRemoveRecent,
    registerNode,
  }) => {
    const icon = getRouteIcon(entry.icon) ?? <FileTextOutlined />;

    return (
      <div
        id={optionId}
        role="option"
        tabIndex={-1}
        aria-selected={active}
        ref={(node) => registerNode(entry.path, node)}
        className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(entry.path)}
      >
        <span className={styles.itemIcon} aria-hidden>
          {icon}
        </span>

        <span className={styles.itemContent}>
          <span className={styles.itemHead}>
            <span className={styles.itemTitle}>
              {renderHighlight(entry.name, highlightPattern)}
            </span>
            {current ? <span className={styles.currentTag}>当前</span> : null}
          </span>
          <span className={styles.itemMeta}>
            {entry.trailText ? (
              <>
                <span className={styles.itemTrail}>
                  {renderHighlight(entry.trailText, highlightPattern)}
                </span>
                <span className={styles.metaDot} aria-hidden>
                  ·
                </span>
              </>
            ) : null}
            <span className={styles.itemPath}>
              {renderHighlight(entry.path, highlightPattern)}
            </span>
          </span>
        </span>

        <span className={styles.itemExtra}>
          {recent ? (
            <button
              type="button"
              className={styles.removeBtn}
              aria-label={`移除 ${entry.name}`}
              title="移除记录"
              onClick={(event) => onRemoveRecent(entry.path, event)}
            >
              <CloseOutlined />
            </button>
          ) : null}
          <span className={styles.enterHint} aria-hidden>
            <EnterOutlined />
          </span>
        </span>
      </div>
    );
  },
);

interface SearchPaletteProps {
  entries: IndexedEntry[];
  entryMap: Map<string, IndexedEntry>;
  currentPath: string;
  recentPaths: string[];
  onClose: () => void;
  onSelect: (path: string) => void;
  onRemoveRecent: (path: string, event: React.MouseEvent) => void;
  onClearRecent: () => void;
}

const SearchPalette: React.FC<SearchPaletteProps> = ({
  entries,
  entryMap,
  currentPath,
  recentPaths,
  onClose,
  onSelect,
  onRemoveRecent,
  onClearRecent,
}) => {
  const [keyword, setKeyword] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const ignoreHoverUntilRef = useRef(0);
  const shouldScrollRef = useRef(false);
  const listboxId = useId();

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const tokens = useMemo(
    () => keyword.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [keyword],
  );
  const isSearching = tokens.length > 0;

  const highlightPattern = useMemo(
    () =>
      tokens.length
        ? new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi')
        : undefined,
    [tokens],
  );

  /** 按权限实时过滤最近访问，避免切换账号后泄露无权限路由。 */
  const recentEntries = useMemo(
    () =>
      recentPaths
        .map((path) => entryMap.get(path))
        .filter((entry): entry is IndexedEntry => Boolean(entry)),
    [recentPaths, entryMap],
  );

  const sections = useMemo(() => {
    if (isSearching) {
      const matched = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.entry);

      return matched.length
        ? [{ id: 'matched', title: '匹配结果', items: matched, recent: false }]
        : [];
    }

    const recentSet = new Set(recentEntries.map((item) => item.path));
    const remaining = entries.filter((entry) => !recentSet.has(entry.path));
    const result: Array<{
      id: string;
      title: string;
      items: IndexedEntry[];
      recent: boolean;
    }> = [];

    if (recentEntries.length) {
      result.push({
        id: 'recent',
        title: '最近访问',
        items: recentEntries,
        recent: true,
      });
    }
    if (remaining.length) {
      result.push({
        id: 'all',
        title: recentEntries.length ? '全部页面' : '快速导航',
        items: remaining,
        recent: false,
      });
    }
    return result;
  }, [entries, isSearching, recentEntries, tokens]);

  const flatItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  const safeActiveIndex =
    flatItems.length > 0 ? Math.min(activeIndex, flatItems.length - 1) : -1;
  const activeEntry =
    safeActiveIndex >= 0 ? flatItems[safeActiveIndex] : undefined;

  // 仅键盘导航时滚动可见项，鼠标悬停绝不触发强制重排
  useEffect(() => {
    if (!shouldScrollRef.current || !activeEntry) return;
    shouldScrollRef.current = false;
    itemRefs.current.get(activeEntry.path)?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeEntry]);

  const registerNode = useMemoizedFn(
    (path: string, node: HTMLDivElement | null) => {
      if (node) itemRefs.current.set(path, node);
      else itemRefs.current.delete(path);
    },
  );

  const handleHover = useMemoizedFn((index: number) => {
    if (performance.now() < ignoreHoverUntilRef.current) return;
    setActiveIndex(index);
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 忽略中文输入法组合态下的回车，避免选词误跳转
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (!flatItems.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      ignoreHoverUntilRef.current = performance.now() + 120;
      shouldScrollRef.current = true;
      setActiveIndex((index) => (index + 1) % flatItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      ignoreHoverUntilRef.current = performance.now() + 120;
      shouldScrollRef.current = true;
      setActiveIndex(
        (index) => (index - 1 + flatItems.length) % flatItems.length,
      );
    } else if (event.key === 'Home') {
      event.preventDefault();
      ignoreHoverUntilRef.current = performance.now() + 120;
      shouldScrollRef.current = true;
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      ignoreHoverUntilRef.current = performance.now() + 120;
      shouldScrollRef.current = true;
      setActiveIndex(flatItems.length - 1);
    } else if (event.key === 'Enter' && activeEntry) {
      event.preventDefault();
      onSelect(activeEntry.path);
    }
  };

  let runningIndex = 0;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="页面搜索"
        className={styles.dialog}
      >
        <div className={styles.inputHeader}>
          <SearchOutlined
            className={
              isSearching
                ? `${styles.inputIcon} ${styles.inputIconActive}`
                : styles.inputIcon
            }
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={listboxId}
            aria-activedescendant={
              activeEntry ? `${listboxId}-${activeEntry.path}` : undefined
            }
            aria-autocomplete="list"
            className={styles.searchInput}
            value={keyword}
            placeholder="搜索页面名称、分组或路径…"
            onChange={(event) => {
              setKeyword(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {keyword ? (
            <button
              type="button"
              className={styles.clearBtn}
              aria-label="清空搜索"
              onClick={() => {
                setKeyword('');
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
            >
              <CloseOutlined />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.escBtn}
            aria-label="关闭搜索"
            onClick={onClose}
          >
            ESC
          </button>
        </div>

        <div id={listboxId} role="listbox" className={styles.listBody}>
          {sections.length ? (
            sections.map((section) => (
              <div key={section.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    {section.recent ? (
                      <ClockCircleOutlined />
                    ) : (
                      <CompassOutlined />
                    )}
                    {section.title}
                  </span>
                  {section.recent ? (
                    <button
                      type="button"
                      className={styles.sectionAction}
                      onClick={() => {
                        onClearRecent();
                        setActiveIndex(0);
                      }}
                    >
                      清空
                    </button>
                  ) : (
                    <span className={styles.sectionMeta}>
                      {section.items.length} 项
                    </span>
                  )}
                </div>

                <div className={styles.itemList}>
                  {section.items.map((entry) => {
                    const itemIndex = runningIndex;
                    runningIndex += 1;

                    return (
                      <SearchRow
                        key={entry.path}
                        entry={entry}
                        index={itemIndex}
                        optionId={`${listboxId}-${entry.path}`}
                        active={itemIndex === safeActiveIndex}
                        current={entry.path === currentPath}
                        recent={section.recent}
                        highlightPattern={highlightPattern}
                        onHover={handleHover}
                        onSelect={onSelect}
                        onRemoveRecent={onRemoveRecent}
                        registerNode={registerNode}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden>
                <SearchOutlined />
              </span>
              <div className={styles.emptyTitle}>未找到匹配的页面</div>
              <p className={styles.emptyDesc}>
                没有找到与“{keyword.trim()}
                ”相关的菜单，试试输入页面名称或路径关键词
              </p>
              <button
                type="button"
                className={styles.emptyAction}
                onClick={() => {
                  setKeyword('');
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
              >
                清空搜索词
              </button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <kbd className={styles.keycap}>↑</kbd>
            <kbd className={styles.keycap}>↓</kbd>
            切换
          </span>
          <span className={styles.footerHint}>
            <kbd className={styles.keycap}>↵</kbd>
            打开
          </span>
          <span className={styles.footerHint}>
            <kbd className={styles.keycap}>Esc</kbd>
            关闭
          </span>
          <span className={styles.footerCount}>
            {isSearching
              ? `命中 ${flatItems.length} / ${entries.length} 个页面`
              : `共 ${entries.length} 个页面`}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const SearchMenu: React.FC<SearchMenuProps> = ({
  routes,
  currentPath,
  dark = false,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const [recentPaths, setRecentPaths] = useState<string[]>(readRecentPaths);
  const isMac = useMemo(isMacPlatform, []);

  /** 预计算小写检索字段，输入过滤时零额外字符串拼接。 */
  const entries = useMemo<IndexedEntry[]>(
    () =>
      getSearchEntries(routes).map((entry) => {
        const trailText = entry.trail.join(' / ');
        const lowerName = entry.name.toLowerCase();
        const lowerTrail = trailText.toLowerCase();
        const lowerPath = entry.path.toLowerCase();
        return {
          ...entry,
          trailText,
          lowerName,
          lowerTrail,
          lowerPath,
          haystack: `${lowerName} ${lowerTrail} ${lowerPath}`,
        };
      }),
    [routes],
  );

  const entryMap = useMemo(
    () => new Map(entries.map((entry) => [entry.path, entry] as const)),
    [entries],
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleClose = useMemoizedFn(() => {
    setOpen(false);
  });

  const handleSelect = useMemoizedFn((path: string) => {
    setRecentPaths((prev) => {
      const next = [path, ...prev.filter((item) => item !== path)].slice(
        0,
        MAX_RECENT,
      );
      saveRecentPaths(next);
      return next;
    });
    setOpen(false);
    onNavigate(path);
  });

  const handleRemoveRecent = useMemoizedFn(
    (path: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setRecentPaths((prev) => {
        const next = prev.filter((item) => item !== path);
        saveRecentPaths(next);
        return next;
      });
    },
  );

  const handleClearRecent = useMemoizedFn(() => {
    setRecentPaths([]);
    saveRecentPaths([]);
  });

  return (
    <>
      <button
        type="button"
        className={
          dark ? `${styles.trigger} ${styles.triggerDark}` : styles.trigger
        }
        onClick={() => setOpen(true)}
        aria-label="搜索页面"
      >
        <SearchOutlined className={styles.triggerIcon} />
        <span className={styles.triggerPlaceholder}>搜索页面</span>
        <kbd className={styles.triggerKbd}>{isMac ? '⌘ K' : 'Ctrl K'}</kbd>
      </button>

      {open ? (
        <SearchPalette
          entries={entries}
          entryMap={entryMap}
          currentPath={currentPath}
          recentPaths={recentPaths}
          onClose={handleClose}
          onSelect={handleSelect}
          onRemoveRecent={handleRemoveRecent}
          onClearRecent={handleClearRecent}
        />
      ) : null}
    </>
  );
};

export default SearchMenu;
