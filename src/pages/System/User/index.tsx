import { useAccess } from '@/hooks/useAccess';
import type {
  RoleOption,
  SystemUser,
  SystemUserPayload,
} from '@/services/system';
import {
  createSystemUser,
  querySystemRoleOptions,
  querySystemUsers,
  removeSystemUser,
  updateSystemUser,
} from '@/services/system';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from '../index.less';

/** 用户管理：账号 CRUD + 角色分配，角色选项来自角色接口 */
const SystemUserPage: React.FC = () => {
  const { message } = App.useApp();
  const { hasPermission } = useAccess();
  const canCreate = hasPermission('system:user:create');
  const canUpdate = hasPermission('system:user:update');
  const canDelete = hasPermission('system:user:delete');
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm<SystemUserPayload>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser>();
  const [submitting, setSubmitting] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    querySystemRoleOptions()
      .then(setRoleOptions)
      .catch(() => setRoleOptions([]));
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: SystemUser) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editing) {
        await updateSystemUser(editing.id, values);
        message.success('用户更新成功');
      } else {
        await createSystemUser(values);
        message.success('用户创建成功');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } catch {
      // 表单校验失败或接口异常，接口异常已由全局 errorHandler 提示
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record: SystemUser) => {
    try {
      await removeSystemUser(record.id);
      message.success('用户删除成功');
      actionRef.current?.reload();
    } catch {
      // 已由全局 errorHandler 提示
    }
  };

  /** 角色 id 转名称，兼容接口已返回 roleNames 和只返回 roleIds 的情况 */
  const getRoleNames = (record: SystemUser) =>
    record.roleNames?.length
      ? record.roleNames
      : record.roleIds
          .map((id) => roleOptions.find((role) => role.id === id)?.name)
          .filter((name): name is string => Boolean(name));

  const roleSelectOptions = roleOptions.map((role) => ({
    value: role.id,
    label: `${role.name}（${role.code}）`,
  }));

  const columns: ProColumns<SystemUser>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 190,
      formItemProps: {
        rules: [{ required: true, message: '请输入用户名' }],
      },
      render: (_, record) => (
        <div className={styles.userCell}>
          <span className={styles.userName}>
            {record.nickName || record.username}
          </span>
          <span className={styles.userAccount}>@{record.username}</span>
        </div>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: 130,
      search: false,
    },
    {
      title: '角色',
      dataIndex: 'roleNames',
      width: 220,
      search: false,
      render: (_, record) => (
        <>
          {getRoleNames(record).map((name) => (
            <Tag key={name} color="blue">
              {name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roleId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: roleSelectOptions,
        placeholder: '全部角色',
      },
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      width: 140,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '禁用', status: 'Default' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 130,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (canUpdate) {
          actions.push(
            <Button
              key="edit"
              type="link"
              size="small"
              onClick={() => openEdit(record)}
            >
              编辑
            </Button>,
          );
        }
        if (canDelete) {
          actions.push(
            <Popconfirm
              key="delete"
              title={`确认删除用户「${record.nickName || record.username}」？`}
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" danger size="small">
                删除
              </Button>
            </Popconfirm>,
          );
        }
        return actions.length ? actions : '-';
      },
    },
  ];

  return (
    <>
      <div className={styles.tableWrap}>
        <ProTable<SystemUser>
          headerTitle="用户管理"
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          search={{ labelWidth: 'auto' }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            size: 'middle',
          }}
          toolBarRender={() =>
            canCreate
              ? [
                  <Button key="create" type="primary" onClick={openCreate}>
                    新建用户
                  </Button>,
                ]
              : []
          }
          scroll={{ y: 1 }}
          request={async (params) => {
            try {
              const { current, pageSize, username, roleId, status } = params;
              const result = await querySystemUsers({
                current,
                pageSize,
                keyword: username as string,
                roleId: roleId as string,
                status: status as string,
              });
              return { data: result.list, total: result.total, success: true };
            } catch {
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open) return;
          form.resetFields();
          if (editing) {
            form.setFieldsValue({
              username: editing.username,
              nickName: editing.nickName,
              email: editing.email,
              mobile: editing.mobile,
              roleIds: editing.roleIds,
              status: editing.status,
            });
          } else {
            form.setFieldsValue({ status: 'active', roleIds: [] });
          }
        }}
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入登录用户名" disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item
            name="nickName"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item
            name="roleIds"
            label="角色"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roleSelectOptions}
            />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="mobile"
            label="手机号"
            rules={[
              {
                pattern: /^1\d{10}$/,
                message: '请输入 11 位手机号',
              },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'disabled', label: '禁用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SystemUserPage;
