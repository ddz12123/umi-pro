import { getUserAuthInfo } from './system';

interface MockAccount {
  password: string;
  id: string;
  nickName: string;
}

/** 演示账号：admin 超级管理员，operator 运营管理员，viewer 审计员 */
const ACCOUNTS: Record<string, MockAccount> = {
  admin: { password: '123456', id: 'user-admin', nickName: '管理员' },
  operator: {
    password: '123456',
    id: 'user-operator',
    nickName: '运营管理员',
  },
  viewer: { password: '123456', id: 'user-viewer', nickName: '审计员' },
};

interface LoginBody {
  username?: string;
  password?: string;
}

export default {
  'POST /api/v1/login': (req: any, res: any) => {
    const { username = '', password = '' } = (req.body || {}) as LoginBody;
    const account = ACCOUNTS[username];

    if (account && account.password === password) {
      const auth = getUserAuthInfo(username);
      // 停用用户或未分配有效角色时不允许进入系统
      if (!auth.roles.length) {
        res.json({
          code: 403,
          msg: '账号已停用或未分配有效角色',
          data: null,
        });
        return;
      }
      res.json({
        code: 0,
        msg: 'ok',
        data: {
          token: `mock-token-${username}-${Date.now()}`,
          // 秒，前端据此计算过期时间
          expiresIn: 2 * 60 * 60,
          user: {
            id: account.id,
            name: username,
            nickName: account.nickName,
          },
          // 登录接口同时返回角色、菜单权限和按钮权限
          roles: auth.roles,
          permissions: auth.permissions,
        },
      });
      return;
    }

    res.json({
      code: 1001,
      msg: '用户名或密码错误',
      data: null,
    });
  },
};
