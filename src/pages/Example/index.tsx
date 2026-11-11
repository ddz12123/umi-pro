import {
  Access,
  ConfirmButton,
  ExportButton,
  FormModal,
  PageTable,
  StatusTag,
} from '@/components';
import { useAccess } from '@/hooks/useAccess';
import { useTableRequest } from '@/hooks/useTableRequest';
import {
  createUser,
  ExampleUser,
  queryUsers,
  removeUser,
  updateUser,
} from '@/services/example';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space } from 'antd';
import React, { useRef, useState } from 'react';

/** 示例：把列表数据转成 CSV Blob；接真实导出接口时直接返回接口 Blob 即可 */
function toCsvBlob(list: ExampleUser[]): Blob {
  const rows = [
    ['姓名', '昵称', '邮箱', '性别', '状态', '创建时间'],
    ...list.map((item) => [
      item.name,
      item.nickName ?? '',
      item.email ?? '',
      item.gender === 'MALE' ? '男' : item.gender === 'FEMALE' ? '女' : '',
      item.status === 'active'
        ? '启用'
        : item.status === 'disabled'
        ? '禁用'
        : '',
      item.createdAt ?? '',
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  return new Blob([`\ufeff${csv}`], { type: 'text/csv' });
}

/**
 * 示例页面：PageTable + useTableRequest + mock 接口的标准 CRUD 写法
 * 菜单可见性由 example:list 控制，页面按钮由 Access 按权限码显隐
 */
const ExamplePage: React.FC = () => {
  const { message } = App.useApp();
  const { hasAnyPermission } = useAccess();
  const canOperate = hasAnyPermission(['example:update', 'example:delete']);
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExampleUser>();

  const request = useTableRequest(queryUsers, (params) => ({
    current: params.current,
    pageSize: params.pageSize,
    keyword: params.name as string,
    gender: params.gender as string,
    status: params.status as string,
  }));

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: ExampleUser) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = async (values: Partial<ExampleUser>) => {
    if (editing) {
      await updateUser(editing.id, values);
      message.success('更新成功');
    } else {
      await createUser(values as Omit<ExampleUser, 'id' | 'createdAt'>);
      message.success('创建成功');
    }
  };

  const handleDelete = async (record: ExampleUser) => {
    await removeUser(record.id);
    message.success('删除成功');
    actionRef.current?.reload();
  };

  /** 示例导出：拉取列表数据在前端生成 CSV，真实项目换成后端导出接口 */
  const handleExport = async () => {
    const result = await queryUsers({ current: 1, pageSize: 100 });
    return toCsvBlob(result.list);
  };

  /** 行操作列：无任何行权限时整列隐藏，有权限时按钮再按各自权限码隐藏 */
  const optionColumn: ProColumns<ExampleUser> = {
    title: '操作',
    valueType: 'option',
    width: 120,
    render: (_, record) => (
      <Space size={4}>
        <Access code="example:update">
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
        </Access>
        <Access code="example:delete">
          <ConfirmButton
            type="link"
            danger
            size="small"
            confirmTitle="确认删除该用户？"
            confirmProps={{ okText: '删除', cancelText: '取消' }}
            onConfirm={() => handleDelete(record)}
          >
            删除
          </ConfirmButton>
        </Access>
      </Space>
    ),
  };

  const columns: ProColumns<ExampleUser>[] = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 140,
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }],
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: 120,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      copyable: true,
      search: false,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 100,
      valueEnum: {
        MALE: { text: '男' },
        FEMALE: { text: '女' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => <StatusTag value={record.status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    ...(canOperate ? [optionColumn] : []),
  ];

  return (
    <>
      <PageTable<ExampleUser>
        headerTitle="列表示例"
        actionRef={actionRef}
        columns={columns}
        request={request}
        toolBarRender={() => [
          <Access key="export" code="example:export">
            <ExportButton onExport={handleExport} />
          </Access>,
          <Access key="create" code="example:create">
            <Button type="primary" onClick={openCreate}>
              新建用户
            </Button>
          </Access>,
        ]}
      />

      <FormModal<Partial<ExampleUser>>
        title={editing ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
        initialValues={editing ?? {}}
        width={520}
      >
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="nickName" label="昵称">
          <Input placeholder="请输入昵称" />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item name="gender" label="性别">
          <Select
            placeholder="请选择性别"
            options={[
              { value: 'MALE', label: '男' },
              { value: 'FEMALE', label: '女' },
            ]}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择状态"
            options={[
              { value: 'active', label: '启用' },
              { value: 'disabled', label: '禁用' },
            ]}
          />
        </Form.Item>
      </FormModal>
    </>
  );
};

export default ExamplePage;
