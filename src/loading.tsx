import PageLoading from '@/components/PageLoading';

/**
 * Umi 约定文件：路由 chunk 懒加载时自动作为 Suspense fallback
 * 解决刷新 / 切换页面时 loadingComponent 为空导致的短暂白屏
 */
export default function Loading() {
  return <PageLoading />;
}
