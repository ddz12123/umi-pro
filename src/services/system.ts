import { del, get, post, put } from '@/utils/request';

export type SystemStatus = 'active' | 'disabled';
export type PermissionType = 'directory' | 'menu' | 'button';

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

export interface SystemUser {
  id: string;
  username: string;
  nickName: string;
  email?: string;
  mobile?: string;
  roleIds: string[];
  /** 列表接口顺带返回的角色名称，方便表格直接展示 */
  roleNames?: string[];
  status: SystemStatus;
  createdAt: string;
}

export interface SystemUserPayload {
  username: string;
  nickName: string;
  email?: string;
  mobile?: string;
  roleIds: string[];
  status: SystemStatus;
}

export interface UserQueryParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  roleId?: string;
  status?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: SystemStatus;
  permissionIds: string[];
  /** 列表接口顺带返回的使用人数 */
  userCount?: number;
  createdAt: string;
}

export interface RolePayload {
  name: string;
  code: string;
  description?: string;
  status: SystemStatus;
}

export interface RoleQueryParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface RoleOption {
  id: string;
  name: string;
  code: string;
}

export interface SystemPermission {
  id: string;
  parentId: string | null;
  name: string;
  type: PermissionType;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  layoutMode?: 'fill' | 'page';
  order: number;
  status: SystemStatus;
  children?: SystemPermission[];
  createdAt: string;
}

export interface PermissionPayload {
  parentId?: string | null;
  name: string;
  type: PermissionType;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  layoutMode?: 'fill' | 'page';
  order: number;
  status: SystemStatus;
}

/** 用户管理：分页查询 */
export function querySystemUsers(params: UserQueryParams) {
  return get<PageResult<SystemUser>>('/api/v1/system/users', params);
}

export function createSystemUser(data: SystemUserPayload) {
  return post<SystemUser>('/api/v1/system/users', data);
}

export function updateSystemUser(id: string, data: SystemUserPayload) {
  return put<SystemUser>(`/api/v1/system/users/${id}`, data);
}

export function removeSystemUser(id: string) {
  return del<null>(`/api/v1/system/users/${id}`);
}

/** 角色管理 */
export function querySystemRoles(params: RoleQueryParams) {
  return get<PageResult<SystemRole>>('/api/v1/system/roles', params);
}

export function querySystemRoleOptions() {
  return get<RoleOption[]>('/api/v1/system/roles/options');
}

export function createSystemRole(data: RolePayload) {
  return post<SystemRole>('/api/v1/system/roles', data);
}

export function updateSystemRole(id: string, data: RolePayload) {
  return put<SystemRole>(`/api/v1/system/roles/${id}`, data);
}

export function removeSystemRole(id: string) {
  return del<null>(`/api/v1/system/roles/${id}`);
}

/** 角色权限：返回/保存菜单与按钮权限 id */
export function querySystemRolePermissions(id: string) {
  return get<{ permissionIds: string[] }>(
    `/api/v1/system/roles/${id}/permissions`,
  );
}

export function updateSystemRolePermissions(
  id: string,
  permissionIds: string[],
) {
  return put<{ permissionIds: string[] }>(
    `/api/v1/system/roles/${id}/permissions`,
    { permissionIds },
  );
}

/** 权限管理：接口返回权限树，菜单/按钮权限共用一棵树 */
export function querySystemPermissions() {
  return get<SystemPermission[]>('/api/v1/system/permissions');
}

export function createSystemPermission(data: PermissionPayload) {
  return post<SystemPermission>('/api/v1/system/permissions', data);
}

export function updateSystemPermission(id: string, data: PermissionPayload) {
  return put<SystemPermission>(`/api/v1/system/permissions/${id}`, data);
}

export function removeSystemPermission(id: string) {
  return del<null>(`/api/v1/system/permissions/${id}`);
}
