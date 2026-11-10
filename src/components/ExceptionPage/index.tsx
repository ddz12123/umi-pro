import { DEFAULT_ROUTE_PATH, getAffixPaths } from '@/router';
import { useRouteStore } from '@/stores/routes';
import { Button } from 'antd';
import React from 'react';
import styles from './index.less';

type ExceptionStatus = 403 | 404 | 500;

interface ExceptionPageProps {
  status: ExceptionStatus;
  /** 覆盖默认标题 */
  title?: string;
  /** 覆盖默认描述 */
  description?: React.ReactNode;
  /** ErrorBoundary 捕获到的运行时错误，仅开发环境展示堆栈 */
  error?: Error | null;
  /** 重试回调，不传则刷新页面 */
  onRetry?: () => void;
}

const STATUS_META: Record<
  ExceptionStatus,
  { eyebrow: string; title: string; description: string }
> = {
  403: {
    eyebrow: 'ACCESS DENIED',
    title: '抱歉，你无权访问该页面',
    description: '当前账号没有访问权限，如有疑问请联系管理员为你开通。',
  },
  404: {
    eyebrow: 'PAGE NOT FOUND',
    title: '抱歉，页面走丢了',
    description: '你访问的页面不存在，可能已被删除，或者地址输入有误。',
  },
  500: {
    eyebrow: 'SERVER ERROR',
    title: '抱歉，系统开小差了',
    description:
      '服务暂时不可用，请稍后重试。如果问题持续出现，请联系技术支持。',
  },
};

const ExceptionPage: React.FC<ExceptionPageProps> = ({
  status,
  title,
  description,
  error,
  onRetry,
}) => {
  const meta = STATUS_META[status];
  const isDev = process.env.NODE_ENV === 'development';

  const goHome = () => {
    const routes = useRouteStore.getState().routes;
    // 异常页是全屏页面，根级 ErrorBoundary 下路由可能已卸载，用整页跳转更可靠
    window.location.assign(getAffixPaths(routes)[0] ?? DEFAULT_ROUTE_PATH);
  };
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goHome();
    }
  };
  const retry = onRetry ?? (() => window.location.reload());

  return (
    <div className={[styles.root, styles[`status${status}`]].join(' ')}>
      <div className={styles.grid} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.inner}>
        <span className={styles.eyebrow}>
          <i aria-hidden />
          {meta.eyebrow}
        </span>

        <div className={styles.code} aria-hidden>
          {status}
        </div>

        <h1 className={styles.title}>{title ?? meta.title}</h1>
        <p className={styles.description}>{description ?? meta.description}</p>

        <div className={styles.actions}>
          {status === 500 ? (
            <>
              <Button type="primary" size="large" onClick={retry}>
                重新加载
              </Button>
              <Button size="large" onClick={goHome}>
                返回首页
              </Button>
            </>
          ) : (
            <>
              <Button type="primary" size="large" onClick={goHome}>
                返回首页
              </Button>
              <Button size="large" onClick={goBack}>
                返回上一页
              </Button>
            </>
          )}
        </div>

        {isDev && error ? (
          <details className={styles.details}>
            <summary>错误详情（仅开发环境可见）</summary>
            <pre>{error.stack || error.message}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
};

export default ExceptionPage;
