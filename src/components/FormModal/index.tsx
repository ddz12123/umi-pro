import type { FormInstance } from 'antd';
import { Form, Modal } from 'antd';
import React, { useRef, useState } from 'react';
import styles from './index.less';

type ModalProps = React.ComponentProps<typeof Modal>;

export interface FormModalOwnProps<V> {
  open: boolean;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** 提交回调，入参已通过表单校验 */
  onSubmit: (values: V) => void | Promise<void>;
  onCancel: () => void;
  /** 打开时回填的数据；不传则清空表单 */
  initialValues?: Partial<V>;
  /** 提交成功后的回调，用于刷新列表 */
  onSuccess?: () => void;
  /** 需要在弹窗外读取表单时传入外部实例 */
  form?: FormInstance<V>;
  /** Form 布局，默认 vertical */
  formLayout?: 'horizontal' | 'vertical' | 'inline';
  /** 内容区最大高度，默认按视口计算；超出后内部滚动 */
  bodyMaxHeight?: number | string;
}

export type FormModalProps<V> = Omit<
  ModalProps,
  | 'open'
  | 'title'
  | 'children'
  | 'onOk'
  | 'onCancel'
  | 'confirmLoading'
  | 'afterOpenChange'
> &
  FormModalOwnProps<V>;

/**
 * 新增/编辑表单弹窗：统一校验、提交中状态、打开回填、成功后关闭与刷新。
 * 内容区限高并内部滚动，标题与底部按钮始终可见；短表单保持自然高度。
 * 业务只提供表单项和提交逻辑，不再重复 submitting / validateFields 样板代码。
 */
function FormModal<V extends object = Record<string, unknown>>({
  open,
  title,
  children,
  onSubmit,
  onCancel,
  onSuccess,
  initialValues,
  form: externalForm,
  formLayout = 'vertical',
  bodyMaxHeight,
  ...modalProps
}: FormModalProps<V>) {
  const [innerForm] = Form.useForm<V>();
  const form = externalForm ?? innerForm;
  const [submitting, setSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);
  initialValuesRef.current = initialValues;

  /** 每次打开时重置并按最新数据回填，避免残留上一次编辑的值 */
  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) return;
    form.resetFields();
    if (initialValuesRef.current) {
      form.setFieldsValue(initialValuesRef.current as V);
    }
  };

  const handleOk = async () => {
    let values: V;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onSuccess?.();
      onCancel();
    } catch {
      // 接口异常已由全局 errorHandler 提示，弹窗保持打开以便重试
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      destroyOnHidden
      width={520}
      okText="确定"
      cancelText="取消"
      {...modalProps}
      open={open}
      title={title}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      afterOpenChange={handleAfterOpenChange}
    >
      <div
        className={styles.scrollBody}
        style={
          bodyMaxHeight === undefined ? undefined : { maxHeight: bodyMaxHeight }
        }
      >
        <Form<V>
          form={form}
          layout={formLayout}
          preserve={false}
          scrollToFirstError
        >
          {children}
        </Form>
      </div>
    </Modal>
  );
}

export default FormModal;
