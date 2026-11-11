import { useFormSubmit } from '@/hooks/useFormSubmit';
import type { FormInstance } from 'antd';
import { Button, Drawer, Form } from 'antd';
import React from 'react';
import styles from './index.less';

type DrawerProps = React.ComponentProps<typeof Drawer>;

export interface DrawerFormOwnProps<V> {
  open: boolean;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** 提交回调，入参已通过表单校验 */
  onSubmit: (values: V) => void | Promise<void>;
  onCancel: () => void;
  /** 提交成功后的回调，用于刷新列表 */
  onSuccess?: () => void;
  /** 打开时回填的数据；不传则清空表单 */
  initialValues?: Partial<V>;
  /** 需要在抽屉外读取表单时传入外部实例 */
  form?: FormInstance<V>;
  /** Form 布局，默认 vertical */
  formLayout?: 'horizontal' | 'vertical' | 'inline';
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
}

export type DrawerFormProps<V> = Omit<
  DrawerProps,
  'open' | 'title' | 'children' | 'onClose' | 'footer' | 'destroyOnHidden'
> &
  DrawerFormOwnProps<V>;

/** 抽屉表单：与 FormModal 同一套契约，适合宽表单与边看边改的场景 */
function DrawerForm<V extends object = Record<string, unknown>>({
  open,
  title,
  children,
  onSubmit,
  onCancel,
  onSuccess,
  initialValues,
  form: externalForm,
  formLayout = 'vertical',
  okText = '提交',
  cancelText = '取消',
  ...drawerProps
}: DrawerFormProps<V>) {
  const [innerForm] = Form.useForm<V>();
  const form = externalForm ?? innerForm;
  const { submitting, handleSubmit } = useFormSubmit({
    form,
    onSubmit,
    onSuccess,
    onClose: onCancel,
  });

  return (
    <Drawer
      width={520}
      {...drawerProps}
      destroyOnHidden
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {okText}
          </Button>
        </div>
      }
    >
      <Form<V>
        form={form}
        layout={formLayout}
        preserve={false}
        initialValues={initialValues as V}
        scrollToFirstError
      >
        {children}
      </Form>
    </Drawer>
  );
}

export default DrawerForm;
