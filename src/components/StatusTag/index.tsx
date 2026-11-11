import { Tag } from 'antd';
import React from 'react';

type TagProps = React.ComponentProps<typeof Tag>;

export interface StatusTagOption {
  text: React.ReactNode;
  color?: TagProps['color'];
}

/** 值到标签的映射，简写为字符串时只指定文案 */
export type StatusTagMap = Record<string, StatusTagOption | string>;

export interface StatusTagProps extends Omit<TagProps, 'children' | 'color'> {
  value?: string | number | null;
  /** 覆盖或扩展默认映射，默认内置 active / disabled */
  options?: StatusTagMap;
  /** 未命中映射时的展示，默认 '-' */
  fallback?: React.ReactNode;
}

const DEFAULT_OPTIONS: Record<string, StatusTagOption> = {
  active: { text: '启用', color: 'success' },
  disabled: { text: '禁用', color: 'default' },
};

/** 状态标签：把状态值到文案/配色的映射收敛到一处，表格与详情页共用。 */
const StatusTag: React.FC<StatusTagProps> = ({
  value,
  options,
  fallback = '-',
  ...tagProps
}) => {
  const merged: StatusTagMap = { ...DEFAULT_OPTIONS, ...options };
  const matched =
    value === null || value === undefined ? undefined : merged[String(value)];
  const option: StatusTagOption =
    typeof matched === 'string'
      ? { text: matched }
      : matched ?? { text: fallback };

  return (
    <Tag {...tagProps} color={option.color}>
      {option.text}
    </Tag>
  );
};

export default StatusTag;
