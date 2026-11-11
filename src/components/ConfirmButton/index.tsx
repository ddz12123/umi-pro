import { Button, Popconfirm } from 'antd';
import React, { useState } from 'react';

type ButtonProps = React.ComponentProps<typeof Button>;
type PopconfirmProps = React.ComponentProps<typeof Popconfirm>;

export interface ConfirmButtonProps
  extends Omit<ButtonProps, 'onClick' | 'loading' | 'children'> {
  children?: React.ReactNode;
  /** 确认后执行；返回 Promise 时按钮自动 loading 并禁止重复触发 */
  onConfirm: () => void | Promise<void>;
  /** 确认框文案 */
  confirmTitle?: React.ReactNode;
  /** Popconfirm 其余配置：okText、cancelText、placement 等 */
  confirmProps?: Omit<PopconfirmProps, 'title' | 'onConfirm' | 'children'>;
}

/** 二次确认按钮：合并 Popconfirm 与异步动作，执行期间自动 loading。 */
const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  children,
  onConfirm,
  confirmTitle = '确定执行该操作吗？',
  confirmProps,
  ...buttonProps
}) => {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
    } catch {
      // 接口异常由业务或全局 errorHandler 提示
    } finally {
      setPending(false);
    }
  };

  return (
    <Popconfirm
      {...confirmProps}
      title={confirmTitle}
      onConfirm={handleConfirm}
    >
      <Button
        {...buttonProps}
        loading={pending}
        disabled={pending || buttonProps.disabled}
      >
        {children}
      </Button>
    </Popconfirm>
  );
};

export default ConfirmButton;
