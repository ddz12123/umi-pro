const ACCOUNTS: Record<string, string> = {
  admin: '123456',
};

interface LoginBody {
  username?: string;
  password?: string;
}

export default {
  'POST /api/v1/login': (req: any, res: any) => {
    const { username = '', password = '' } = (req.body || {}) as LoginBody;

    if (ACCOUNTS[username] && ACCOUNTS[username] === password) {
      res.json({
        code: 0,
        msg: 'ok',
        data: {
          token: `mock-token-${username}-${Date.now()}`,
          // 秒，前端据此计算过期时间
          expiresIn: 2 * 60 * 60,
          user: {
            id: '1',
            name: username,
            nickName: '管理员',
          },
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
