interface ErrorFeedback {
  content: string;
  key?: string;
}

type Listener = (error: ErrorFeedback) => void;
let listener: Listener | undefined;
const pending: ErrorFeedback[] = [];

/** 请求层通过这里使用 App 内的消息实例，继承语言与主题。 */
export function showError(error: ErrorFeedback) {
  if (listener) listener(error);
  else {
    pending.push(error);
    if (pending.length > 5) pending.shift();
  }
}

export function bindErrorFeedback(next: Listener) {
  listener = next;
  pending.splice(0).forEach(next);
  return () => {
    if (listener === next) listener = undefined;
  };
}
