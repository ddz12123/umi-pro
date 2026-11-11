# Umi 基础框架

基于 Umi Max 4、React 18、Ant Design 6、ProComponents 3 和 Zustand 5 的业务无关起步框架。页面路由全部前端静态声明，接口只返回菜单/按钮权限码，菜单与页面访问按权限码过滤。保留登录、首页、列表示例和 403 / 404 / 500 页面。

## 开始使用

需要 Node.js 20.19+ 和 pnpm 9+。建议使用 Node.js 22 LTS，并提交、复用现有的 pnpm 锁文件。ProComponents 使用已验证的固定预发布版本，避免 `beta` 标签漂移。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发环境默认启用 Mock，演示账号为 `admin / operator / viewer`，密码均为 `123456`。登录接口返回角色与菜单/按钮权限码，菜单由前端静态路由按权限码过滤生成。Mock 只在开发服务中运行，生产构建会关闭 Mock 和演示账号提示。

```bash
pnpm lint          # ESLint + Stylelint
pnpm typecheck     # TypeScript
pnpm format:check  # 格式检查
pnpm check         # 以上静态检查
pnpm build         # 生产构建，输出 dist
```

首次安装会自动运行 `max setup`。如果生成目录尚未创建，可以执行 `pnpm setup`。

## 配置与职责

| 位置 | 职责 |
| --- | --- |
| `src/config/app.ts` | 应用名称、品牌说明、版本、存储命名空间、登录态存储方式、页签开关与上限 |
| `src/config/api.ts` | API 地址、超时、响应字段、成功码与会话失效码 |
| `src/config/request.ts` | 统一鉴权、接口错误、网络错误和取消请求处理 |
| `src/config/theme.ts` | Ant Design 主题 |
| `src/router/paths.ts` | 框架路径常量，不依赖页面或状态管理 |
| `src/router/static-routes.ts` | 页面静态路由、菜单权限码与 Umi 路由配置生成 |
| `src/router/tree.ts` | 路由树遍历与分组默认页选择 |
| `src/router/routes.ts` | 使用 React Router 匹配菜单、面包屑、页签和标题 |
| `src/router/GroupRedirect.tsx` | 分组路径跳转到当前账号可见的默认子页面 |
| `src/components/SessionSync` | 应用级会话过期检查与跨窗口同步 |
| `src/access.ts` | Ant Design Pro 风格的权限定义：菜单过滤、页面访问与按钮权限 |
| `src/components` | 业务无关通用组件：Access 权限门、PageTable 列表表格、FormModal/DrawerForm 表单容器、确认/导出按钮、状态标签等 |
| `src/hooks` | 权限入口 `useAccess`、菜单路由 `useMenuRoutes`、表格请求 `useTableRequest`、表单提交 `useFormSubmit` |
| `src/services` | 接口适配；认证与示例各自独立，分页契约在 `types.ts` |
| `src/stores` | 页签状态与界面偏好（主题色、页签风格、布局） |
| `src/layouts` | 侧边 / 顶部双布局、面包屑、搜索、页签、移动端抽屉 |
| `src/utils` | 请求方法、响应适配、认证存储与统一退出 |
| `src/pages` | 页面内容与页面私有逻辑 |
| `mock` | 开发接口；登录与示例 CRUD |

`src/app.tsx` 只组合 Umi 运行时钩子、主题、全局反馈、会话同步与错误边界。页面通过 `services` 和 `utils/request` 调用接口；请求配置负责全局拦截，状态层负责按权限生成菜单路由，布局只消费路由元信息。替换某个页面时，无需修改布局、请求层或会话清理逻辑。

## 页面与路由

页面路由全部在前端静态声明：

- **静态路由**：`src/router/static-routes.ts` 中维护登录、首页、示例页、403、404、500 和根重定向。
- **权限控制**：登录接口返回 `permissions.menus`，`src/access.ts` 的 `normalRouteFilter` 按路由上的 `access` 字段过滤菜单；页面级访问也会校验，无权限时直接展示 403。

Umi 路由由静态路由树生成，`component` 直接指向 `src/pages` 下的真实文件，构建期完成代码分割，不再需要运行时组件映射表。

```ts
{
  name: '列表示例',
  path: '/example',
  component: 'Example', // 相对 src/pages 的页面路径
  access: 'example:list', // 登录接口下发的菜单权限码
  icon: 'table',
  layoutMode: 'fill',
}
```

分组使用 `children`，子路径一律使用绝对路径。分组访问优先跳到可见且无需额外参数的子页面，并保留查询参数与锚点。例如 `/items/:id` 可以跳到 `/items/:id/detail`，但 `/items` 不会跳到需要补充 `:id` 的页面。找不到默认页时进入 404。

参数页面不生成可点击菜单项，也不参与页面搜索；详情页可以设置 `activeMenu` 高亮列表入口。元信息匹配直接使用 React Router 的 `matchRoutes`，统一处理大小写、URL 编码和匹配优先级。

常用路由字段：

| 字段 | 作用 |
| --- | --- |
| `layoutMode` | `page` 为普通滚动页面，`fill` 为撑满内容区的页面；默认 `page` |
| `order` | 同层排序，未设置的节点保持原顺序并排在已设置节点后 |
| `affix` | 固定页签，关闭和超出上限时仍保留；只支持布局内、可显示页签且无需参数的页面 |
| `hideInMenu` / `hideInBreadcrumb` / `hideInTabs` | 控制对应导航中的展示 |
| `activeMenu` | 详情页面高亮的菜单路径 |
| `fullScreen` | 关闭公共布局，仍受登录守卫保护；分组值默认传给子节点，子节点可显式覆盖 |

框架保留 `/login`、`/home`、`/exception/403`、`/exception/404`、`/exception/500` 和根重定向。页面树不能使用这些路径，也不能通过大小写差异覆盖它们。图标 key 在 `layouts/components/menu-icons.tsx` 集中映射。

### 菜单权限与页面访问

登录接口同时返回 `roles`、`permissions.menus` 和 `permissions.buttons`。菜单权限决定静态路由是否进入侧边栏、搜索和页签；按钮权限由 `useAccess` 控制页面内的新增、编辑、删除、导出等操作。

菜单不再由接口生成，接口只需要返回权限码。前端 `access` 码与后端权限表是同一份契约，两侧需同步维护：新增页面时在 `static-routes.ts` 里补一条路由并配置 `access`，再把对应权限码录入权限表并分配给角色。

登录或切换账号后整页跳转重建菜单；无权限的地址即使手动输入也只展示 403，不会渲染页面内容。

### 权限演示

列表示例同时演示两级权限：菜单权限码 `example:list` 决定示例页是否进入菜单和可访问；页面内的新建、编辑、删除、导出按钮由 `useAccess` 按按钮权限码显隐。前端过滤只负责体验，真实项目的数据权限由服务端判断。

开发演示账号（密码均为 `123456`）：

- `admin`：全部权限，示例页完整 CRUD 与导出。
- `operator`：可访问示例页，但无删除、导出按钮。
- `viewer`：仅首页，手动访问示例页地址会进入 403。

## 接入真实接口

在 `services/auth.ts` 中适配实际接口地址、入参与返回值。认证适配层向框架返回：

```ts
{
  token: string;
  expiresIn?: number; // 有效秒数；省略时由服务端决定会话失效
  user?: { id?: string; name?: string; nickName?: string; avatar?: string };
  roles?: Array<{ id: string; name: string; code: string }>;
  permissions?: {
    menus: string[];   // 菜单/页面权限码
    buttons: string[]; // 页面按钮权限码
  };
}
```

登录态会一并缓存 `roles` 与 `permissions`，`getInitialState` 恢复为 `roles`、`menuPermissions`、`buttonPermissions`，页面按钮通过 `useAccess` 判断。

开发时可以通过进程环境变量关闭 Mock、指定 API 来源。以 PowerShell 为例：

```powershell
$env:UMI_APP_MOCK = 'false'
$env:UMI_APP_API_BASE_URL = 'https://api.example.com'
pnpm dev
```

这些设置在启动或构建时读取，API 地址会进入前端产物。生产构建始终关闭 Mock。同域部署时可以保持 API 地址为空，由站点将 `/api` 转发给后端。

默认响应格式为 `{ code: 0, data, msg }`，也接受字符串成功码 `'0'`。字段名、成功码、会话失效码统一在 `config/api.ts` 修改。

```ts
import { get, post, rawRequest } from '@/utils/request';

const result = await get<Result>('/api/resource', { page: 1 });
await post('/api/resource', values);

// Blob、普通 JSON、数组和空响应均可保留原值。
const file = await get<Blob>('/api/export', undefined, {
  responseType: 'blob',
  responseMode: 'raw',
});

// 需要 status 或 headers 时，使用原生完整响应。
const response = await rawRequest<Blob>('/api/export', {
  responseType: 'blob',
  responseMode: 'raw',
  getResponse: true,
});
```

`get` / `post` / `put` / `patch` / `del` 返回解包后的数据，明确指定的 HTTP 方法不会被额外选项覆盖。普通 JSON 没有约定的状态字段时原样返回。`responseMode: 'raw'` 跳过解包；响应是 JSON Blob 时仍会识别其中的业务错误，并走统一错误与会话失效处理。

`skipAuth: true` 跳过自动 token；`skipErrorHandler: true` 将提示交给调用方处理。后者仍会处理当前会话失效。401 与业务失效码共用退出逻辑，并发失效只退出一次，取消请求不弹错误，旧账号请求迟到的 401 不会清掉新账号。会话失效回到登录页时会展示过期提示。

## 公共行为

- 登录守卫覆盖公共布局页面和全屏页面；回跳保留查询参数与锚点，并校验站内地址。
- 退出统一清理认证与页签。会话同步挂在应用根部，覆盖登录页与全屏页。默认本地存储认证状态，支持跨窗口退出与换号同步；可以改为会话存储。浏览器禁用存储时退回当前页面内存，整页刷新后需要重新登录。
- 自动 token 只发给配置的 API 来源，保留请求显式提供的鉴权头。实际接口的数据权限由服务端判断。
- 页签保存完整地址，默认最多 12 个；关闭其他、左侧、右侧或全部时保留固定页签。页签保存导航记录，页面切换会重新挂载组件，不缓存表单或组件状态。
- 页面渲染异常在内容区展示 500，可继续使用导航；根错误边界处理框架渲染异常。
- 默认移动端使用抽屉导航，桌面端侧栏折叠状态独立持久化。
- 界面设置支持侧边 / 顶部两种布局切换，偏好本地持久化；顶部布局将导航收敛到深色顶栏，移动端仍使用抽屉导航。重复点击当前地址不产生历史记录与加载。
- 元素级权限用 `<Access code>` / `<Access codes>` 声明式包裹，无权限直接隐藏而非禁用；整列/整块无权限时由业务侧条件渲染移除。列表页用 `PageTable` + `useTableRequest` 消除分页与请求样板；宽表单可用 `DrawerForm`，与 `FormModal` 共用同一套提交契约。

表格撑满布局（固定表头 + 数据区滚动）收敛在 `PageTable` 容器内，mixin 位于 `styles/table-layout.less`；列表页使用 `PageTable` 即获得该布局与分页/搜索默认值。普通页面中的表格不会被全局 ProTable 样式影响。

## 构建与部署

默认使用浏览器 history 路由，部署在站点根路径。静态站点需要将页面路由回退到 `index.html`，例如 Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

静态资源文件名带内容哈希；建议对带哈希的资源使用长期缓存，对 `index.html` 使用短缓存。开发 Mock 不会随静态产物提供登录或 CRUD 接口，部署前需要完成真实接口适配。

CI 可以通过 `UMI_BUILD_OUTPUT_PATH` 指定独立构建目录。`pnpm check` 只执行 ESLint / Stylelint、TypeScript 与格式检查，不运行测试或构建。
