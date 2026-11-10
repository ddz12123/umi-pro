import { del, get, post, put } from '@/utils/request';

export interface ExampleUser {
  id: string;
  name: string;
  nickName?: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE';
  status?: 'active' | 'disabled';
  createdAt?: string;
}

export interface UserQueryParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  gender?: string;
  status?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

export function queryUsers(params: UserQueryParams) {
  return get<PageResult<ExampleUser>>('/api/demo/users', params);
}

export function createUser(data: Omit<ExampleUser, 'id' | 'createdAt'>) {
  return post<ExampleUser>('/api/demo/users', data);
}

export function updateUser(id: string, data: Partial<ExampleUser>) {
  return put<ExampleUser>(`/api/demo/users/${id}`, data);
}

export function removeUser(id: string) {
  return del<null>(`/api/demo/users/${id}`);
}
