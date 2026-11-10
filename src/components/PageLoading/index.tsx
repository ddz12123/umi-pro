import Logo from '@/components/Logo';
import React from 'react';
import styles from './index.less';

/**
 * 路由懒加载 / 首屏初始化时的占位
 * Umi 会自动读取 src/loading.tsx 作为路由切换 loading
 */
const PageLoading: React.FC = () => (
  <div className={styles.root} role="status" aria-live="polite">
    <Logo size={46} />
    <div className={styles.dots} aria-hidden>
      <span />
      <span />
      <span />
    </div>
    <p className={styles.text}>正在加载页面…</p>
  </div>
);

export default PageLoading;
