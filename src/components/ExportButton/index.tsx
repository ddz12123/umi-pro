import { DownloadOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import React, { useRef, useState } from 'react';

type ButtonProps = React.ComponentProps<typeof Button>;

const EXT_BY_TYPE: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
};

/** 本地 YYYY-MM-DD 日期，避免 UTC 换日导致的导出日期偏差。 */
function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 触发浏览器下载；延迟释放 URL，避免部分浏览器中断下载 */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface ExportButtonProps
  extends Omit<ButtonProps, 'onClick' | 'loading' | 'children'> {
  children?: React.ReactNode;
  /** 导出请求；返回 Blob 时自动下载，返回空则由业务自行处理 */
  onExport: () => Blob | void | Promise<Blob | void>;
  /** 自动下载的文件名，默认按日期与 Blob 类型生成 */
  fileName?: string;
  /** 成功提示，传 false 关闭 */
  successMessage?: React.ReactNode | false;
}

/** 导出按钮：统一防重复提交、Blob 下载与结果提示，业务只需提供请求。 */
const ExportButton: React.FC<ExportButtonProps> = ({
  children = '导出',
  onExport,
  fileName,
  successMessage = '导出成功',
  ...buttonProps
}) => {
  const { message } = App.useApp();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const handleClick = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      const result = await onExport();
      if (result instanceof Blob) {
        const mimeType = result.type.split(';')[0].trim().toLowerCase();
        const ext = EXT_BY_TYPE[mimeType] ?? '';
        saveBlob(result, fileName ?? `导出数据_${formatLocalDate()}${ext}`);
      }
      if (successMessage !== false) message.success(successMessage);
    } catch {
      // 接口异常由全局 errorHandler 提示
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <Button
      {...buttonProps}
      icon={buttonProps.icon ?? <DownloadOutlined />}
      loading={pending}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

export default ExportButton;
