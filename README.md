# Umi 基础框架

基于 Umi Max 4、React 18、Ant Design 6、ProComponents 3 和 Zustand 5 的起步框架。保留登录、首页、列表示例、RBAC 系统管理和 404 / 500 页面。静态路由只有首页和异常页，业务路由由接口按权限下发。

## 开始使用

需要 Node.js 20.19+ 和 pnpm 9+。建议使用 Node.js 22 LTS，并提交、复用现有的 pnpm 锁文件。ProComponents 使用已验证的固定预发布版本，避免 `beta` 标签漂移。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发环境默认启用 Mock，演示账号为 `admin / operator / viewer`，密码均为 `123456`。业务菜单由 Mock 的 `/api/v1/routes` 返回；首页和异常页是前端静态路由。Mock 只在开发服务中运行，生产构建会关闭 Mock 和演示账号提示。

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
| `src/router/static-routes.ts` | 登录、首页、异常页等静态路由与 Umi 配置生成 |
| `src/router/page-registry.ts` | 页面组件白名单与懒加载 |
| `src/router/normalize.ts` | 外部路由的结构、组件和路径校验 |
| `src/router/catalog.ts` / `tree.ts` | 页面树的校验入口、遍历与分组默认页选择 |
| `src/router/routes.ts` | 使用 React Router 匹配菜单、面包屑、页签和标题 |
| `src/router/DynamicRoute.tsx` / `runtime.tsx` | 页面渲染、分组跳转与接口路由注册 |
| `src/components/SessionSync` | 应用级会话过期检查与跨窗口同步 |
| `src/hooks/useAccess.ts` | 按钮权限判断 |
| `src/services` | 接口适配；认证、动态路由、RBAC 与示例各自独立 |
| `src/stores` | 路由加载状态、页签状态 |
| `src/layouts` | 导航、面包屑、搜索、页签、移动端布局 |
| `src/utils` | 请求方法、响应适配、认证存储与统一退出 |
| `src/pages` | 页面内容与页面私有逻辑 |
| `mock` | 开发接口；动态路由、RBAC 与示例 CRUD |

`src/app.tsx` 只组合 Umi 运行时钩子、主题、全局反馈、会话同步与错误边界。页面通过 `services` 和 `utils/request` 调用接口；请求配置负责全局拦截，状态层负责保存已校验的路由，布局只消费路由元信息。替换某个页面时，无需修改布局、请求层或会话清理逻辑。

## 页面与路由

路由固定分成两部分：

- **静态路由**：`src/router/static-routes.ts` 中的登录、首页、404、500 和根重定向。
- **动态路由**：登录后由 `/api/v1/routes` 返回，开发环境由 `mock/routes.ts` 提供。

页面组件在 `page-registry.ts` 登记；接口路由的 `component` 只能引用注册表 key。接口数据在运行时校验，菜单、面包屑、页面搜索、页签和浏览器标题都从同一棵路由树生成。

注册表 `PAGE_LOADERS` 使用静态 `import()` 加载函数，`component` 不必与页面目录名一致；所有页面统一由 `DynamicRoute` 懒加载。

```ts
{
  name: '列表示例',
  path: '/example',
  component: 'Example', // 页面注册表中的 key
  icon: 'table',
  layoutMode: 'fill',
}
```

分组使用 `children`，子路径支持绝对路径或相对父级路径。分组访问优先跳到可见且无需额外参数的子页面，并保留查询参数与锚点。例如 `/items/:id` 可以跳到 `/items/:id/detail`，但 `/items` 不会跳到需要补充 `:id` 的页面。找不到默认页时进入 404。

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

框架保留 `/login`、`/home`、`/exception/404`、`/exception/500` 和根重定向。页面树不能使用这些路径，也不能通过大小写差异覆盖它们。图标 key 在 `layouts/components/menu-icons.tsx` 集中映射。

### 动态业务路由

`services/routes.ts` 负责取得当前用户的页面树；开发环境由 `mock/routes.ts` 从权限管理数据生成，并按当前登录用户的角色权限过滤。登录接口同时返回 `roles`、`permissions.menus` 和 `permissions.buttons`。

接口数据中的 `component` 必须是注册过的组件 key。未知组件、重复路径、保留路径、非法结构会拒绝整次加载；参数名不同但模式相同的路径也视为冲突，例如 `/items/:id` 和 `/items/:code`。失败时显示错误和重试入口。

首次渲染前加载路由，再通过 `patchClientRoutes` 注册。请求按当前会话去重，退出或切换账号会取消旧请求，迟到响应不会覆盖新账号菜单。每次注册先移除框架上次注入的节点，再生成当前页面，避免残留已移除的路由或旧布局；注册失败同样进入错误状态。

Umi 的 `patchClientRoutes` 在创建 Router 时执行，单独调用 `loadRoutes()` 不会热更新正在运行的 Router。登录、退出、跨窗口换号和需要刷新权限时使用整页跳转重新初始化。

### RBAC 系统管理

- **用户管理**：账号 CRUD、角色分配、状态管理。
- **角色管理**：角色 CRUD、菜单权限和按钮权限授权。
- **权限管理**：维护菜单目录、菜单页面和按钮权限；菜单权限生成动态路由，按钮权限控制页面操作。

登录后由 `mock/routes.ts` 按角色返回可见路由；页面内的新建、编辑、删除、授权按钮由 `useAccess` 根据按钮权限码控制，Mock 写接口也会再次校验权限。

开发演示账号：`admin / 123456`（超级管理员）、`operator / 123456`（运营管理员）、`viewer / 123456`（审计员）。

## 接入真实接口

在 `services/auth.ts` 和 `services/routes.ts` 中适配实际接口地址、入参与返回值。认证适配层向框架返回：

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

`get` / `post` / `put` / `patch` / `del` 返回解包后的数据，明确指定的 HTTP 方法不会被额外选项覆盖。普通 JSON 没有约定的状态字段时原样返回。`responseMode: 'raw'` 同时跳过业务状态检查和解包。

`skipAuth: true` 跳过自动 token；`skipErrorHandler: true` 将提示交给调用方处理。后者仍会处理当前会话失效。401 与业务失效码共用退出逻辑，取消请求不弹错误，旧账号请求迟到的 401 不会清掉新账号。

## 公共行为

- 登录守卫覆盖公共布局页面和全屏页面；回跳保留查询参数与锚点，并校验站内地址。
- 退出统一清理认证、路由和页签。会话同步挂在应用根部，覆盖登录页与全屏页。默认本地存储认证状态，支持跨窗口退出与换号同步；可以改为会话存储。浏览器禁用存储时退回当前页面内存，整页刷新后需要重新登录。
- 自动 token 只发给配置的 API 来源，保留请求显式提供的鉴权头。实际接口的数据权限由服务端判断。
- 页签保存完整地址，默认最多 12 个；关闭其他、左侧、右侧或全部时保留固定页签。页签保存导航记录，页面切换会重新挂载组件，不缓存表单或组件状态。
- 页面渲染异常在内容区展示 500，可继续使用导航；根错误边界处理框架渲染异常。
- 默认移动端使用抽屉导航，桌面端侧栏折叠状态独立持久化。

列表示例的表格高度样式已改成可选 Less mixin，位于 `styles/table-layout.less`，只在示例容器中启用。普通页面中的表格不会被全局 ProTable 样式影响。

## 构建与部署

默认使用浏览器 history 路由，部署在站点根路径。静态站点需要将页面路由回退到 `index.html`，例如 Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

静态资源文件名带内容哈希；建议对带哈希的资源使用长期缓存，对 `index.html` 使用短缓存。开发 Mock 不会随静态产物提供登录或 CRUD 接口，部署前需要完成真实接口适配。

CI 可以通过 `UMI_BUILD_OUTPUT_PATH` 指定独立构建目录。`pnpm check` 只执行 ESLint / Stylelint、TypeScript 与格式检查，不运行测试或构建。
