import type { AppRoute } from '@/router';
import { getSearchEntries } from '@/router';
import { EnterOutlined, SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Empty, Input, Modal } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../index.less';

interface SearchMenuProps {
  routes: AppRoute[];
  onNavigate: (path: string) => void;
}

const SearchMenu: React.FC<SearchMenuProps> = ({ routes, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<InputRef>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => getSearchEntries(routes), [routes]);

  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return entries;
    return entries.filter((entry) =>
      `${entry.name} ${entry.trail.join(' ')} ${entry.path}`
        .toLowerCase()
        .includes(value),
    );
  }, [keyword, entries]);

  const openSearch = () => {
    setKeyword('');
    setActiveIndex(0);
    setOpen(true);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setKeyword('');
        setActiveIndex(0);
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!filtered.length) return;
    const item = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, filtered]);

  const navigate = (path: string) => {
    onNavigate(path);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!filtered.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && filtered[activeIndex]) {
      navigate(filtered[activeIndex].path);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.searchTrigger}
        onClick={openSearch}
        aria-label="搜索页面"
      >
        <SearchOutlined className={styles.searchIcon} />
        <span className={styles.searchPlaceholder}>搜索页面</span>
        <kbd className={styles.kbd}>Ctrl K</kbd>
      </button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        closable={false}
        width={600}
        style={{ top: '10vh' }}
        destroyOnHidden
        rootClassName={styles.searchModal}
        afterOpenChange={(visible) => {
          if (visible) inputRef.current?.focus();
        }}
      >
        <div className={styles.searchInputWrap}>
          <SearchOutlined className={styles.searchModalIcon} />
          <Input
            ref={inputRef}
            variant="borderless"
            value={keyword}
            placeholder="搜索页面名称 / 路径"
            allowClear
            onChange={(event) => {
              setKeyword(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.searchList} ref={listRef}>
          {filtered.length ? (
            filtered.map((entry, index) => (
              <button
                type="button"
                key={entry.path}
                className={`${styles.searchItem} ${
                  index === activeIndex ? styles.searchItemActive : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigate(entry.path)}
              >
                <span className={styles.searchItemTitle}>{entry.name}</span>
                {entry.trail.length ? (
                  <span className={styles.searchItemTrail}>
                    {entry.trail.join(' / ')}
                  </span>
                ) : null}
                <EnterOutlined className={styles.searchItemEnter} />
              </button>
            ))
          ) : (
            <Empty
              className={styles.searchEmpty}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="没有匹配的页面"
            />
          )}
        </div>

        <div className={styles.searchFooter}>
          <span>
            <kbd className={styles.kbd}>↑</kbd>
            <kbd className={styles.kbd}>↓</kbd>
            切换
          </span>
          <span>
            <kbd className={styles.kbd}>Enter</kbd>
            跳转
          </span>
          <span>
            <kbd className={styles.kbd}>Esc</kbd>
            关闭
          </span>
          <span className={styles.searchCount}>{filtered.length} 个页面</span>
        </div>
      </Modal>
    </>
  );
};

export default SearchMenu;
