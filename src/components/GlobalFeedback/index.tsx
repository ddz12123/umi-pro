import { bindErrorFeedback } from '@/utils/feedback';
import { App } from 'antd';
import { useEffect } from 'react';

export default function GlobalFeedback() {
  const { message } = App.useApp();
  useEffect(
    () =>
      bindErrorFeedback((error) => {
        void message.error(error);
      }),
    [message],
  );
  return null;
}
