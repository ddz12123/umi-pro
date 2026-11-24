import { useMemoizedFn } from 'ahooks';
import type { FormInstance } from 'antd';
import { useRef, useState } from 'react';

interface FormSubmitOptions<V> {
  form: FormInstance<V>;
  onSubmit: (values: V) => void | Promise<void>;
  onSuccess?: () => void;
  onClose: () => void;
}

/** 表单提交控制器：校验 → 提交 → 刷新 → 关闭，弹窗与抽屉共用 */
export function useFormSubmit<V>({
  form,
  onSubmit,
  onSuccess,
  onClose,
}: FormSubmitOptions<V>) {
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = useMemoizedFn(async () => {
    if (submittingRef.current) return;
    let values: V;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit(values);
      onSuccess?.();
      onClose();
    } catch {
      // 接口异常已由全局 errorHandler 提示，容器保持打开以便重试
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  });

  return { submitting, handleSubmit };
}
