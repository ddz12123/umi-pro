interface ErrorFeedback {
  content: string;
  key?: string;
}

type Listener = (error: ErrorFeedback) => void;
/** 当前 App 内消息实例的监听者；未挂载时先缓存错误。 */
let listener: Listener | undefined;
/** 首屏渲染前最多缓存 5 条错误，避免消息无限堆积。 */
const pending: ErrorFeedback[] = [];

/** 请求层通过这里使用 App 内的消息实例，继承语言与主题。 */
export function showError(error: ErrorFeedback) {
  if (listener) listener(error);
  else {
    pending.push(error);
    if (pending.length > 5) pending.shift();
  }
}

/** 由 GlobalFeedback 绑定 antd App 的 message 实例。 */
export function bindErrorFeedback(next: Listener) {
  listener = next;
  pending.splice(0).forEach(next);
  return () => {
    if (listener === next) listener = undefined;
  };
}
