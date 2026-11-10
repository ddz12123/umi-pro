interface MockUser {
  id: string;
  name: string;
  nickName: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  status: 'active' | 'disabled';
  createdAt: string;
}

const SURNAMES = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄'];
const GIVEN_NAMES = [
  '伟',
  '芳',
  '娜',
  '敏',
  '静',
  '磊',
  '洋',
  '勇',
  '艳',
  '杰',
];

let users: MockUser[] = Array.from({ length: 26 }, (_, index) => ({
  id: String(index + 1),
  name: `${SURNAMES[index % SURNAMES.length]}${
    GIVEN_NAMES[index % GIVEN_NAMES.length]
  }`,
  nickName: `user${index + 1}`,
  email: `user${index + 1}@example.com`,
  gender: index % 2 === 0 ? 'MALE' : 'FEMALE',
  status: index % 5 === 0 ? 'disabled' : 'active',
  createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
}));

let nextId = users.length + 1;

export default {
  'GET /api/demo/users': (req: any, res: any) => {
    const {
      keyword = '',
      gender = '',
      status = '',
      current = 1,
      pageSize = 10,
    } = req.query || {};

    const kw = String(keyword).trim().toLowerCase();
    const filtered = users.filter((user) => {
      const matchKeyword =
        !kw ||
        [user.name, user.nickName, user.email].some((value) =>
          value.toLowerCase().includes(kw),
        );
      const matchGender = !gender || user.gender === gender;
      const matchStatus = !status || user.status === status;
      return matchKeyword && matchGender && matchStatus;
    });

    const page = Number(current) || 1;
    const size = Number(pageSize) || 10;

    res.json({
      code: 0,
      msg: 'ok',
      data: {
        list: filtered.slice((page - 1) * size, page * size),
        total: filtered.length,
        current: page,
        pageSize: size,
      },
    });
  },

  'POST /api/demo/users': (req: any, res: any) => {
    const body = req.body || {};
    if (!body.name) {
      res.json({ code: 1001, msg: '姓名不能为空', data: null });
      return;
    }

    const user: MockUser = {
      id: String(nextId++),
      name: body.name,
      nickName: body.nickName || '',
      email: body.email || '',
      gender: body.gender || 'MALE',
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
    };
    users = [user, ...users];

    res.json({ code: 0, msg: 'ok', data: user });
  },

  'PUT /api/demo/users/:id': (req: any, res: any) => {
    const { id } = req.params || {};
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) {
      res.json({ code: 4004, msg: '用户不存在', data: null });
      return;
    }

    users[index] = { ...users[index], ...req.body, id };
    res.json({ code: 0, msg: 'ok', data: users[index] });
  },

  'DELETE /api/demo/users/:id': (req: any, res: any) => {
    const { id } = req.params || {};
    const exists = users.some((user) => user.id === id);
    if (!exists) {
      res.json({ code: 4004, msg: '用户不存在', data: null });
      return;
    }

    users = users.filter((user) => user.id !== id);
    res.json({ code: 0, msg: 'ok', data: null });
  },
};
