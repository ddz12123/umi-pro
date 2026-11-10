import ExceptionPage from '@/components/ExceptionPage';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 变化时自动清除错误，例如切换路由或刷新页面 */
  resetKey?: string;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 渲染异常兜底：任何页面 render 抛错时展示 500 页面，而不是白屏
 * React 目前只有 class 组件能实现 componentDidCatch
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 生产环境可在这里接入 Sentry / 自建监控
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }
      return <ExceptionPage status={500} error={error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
