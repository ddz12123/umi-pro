import NProgress from 'nprogress';

NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  speed: 300,
  trickleSpeed: 120,
  easing: 'ease',
});

let fallbackTimer: number | undefined;

function clearFallback() {
  if (fallbackTimer !== undefined) {
    window.clearTimeout(fallbackTimer);
    fallbackTimer = undefined;
  }
}

/** 页面渲染完成或加载失败 */
export function doneProgress() {
  clearFallback();
  NProgress.done();
}

/** 路由/页面开始加载 */
export function startProgress() {
  clearFallback();
  NProgress.start();
  // 兜底：异常情况下避免进度条一直停在 80%
  fallbackTimer = window.setTimeout(() => doneProgress(), 8000);
}
