# PlanPinGo — 前端项目总览

旅行计划 Web 应用 **PlanPinGo** 的 Next.js 前端。用户可在交互式地图上规划行程、管理地点标记，并生成可分享链接。

对应后端：`../travel-plan-server-less-node/`（Express + TypeORM + PostgreSQL，部署在 Vercel）

---

## 技术栈

| 依赖 | 版本/说明 |
|------|-----------|
| Next.js | 14（App Router） |
| React | 18 |
| TypeScript | 5 |
| Tailwind CSS | 3 + shadcn/ui（Radix UI） |
| Mapbox GL | 3 — 交互式地图核心 |
| Auth0 React SDK | `@auth0/auth0-react` |
| Zustand | 状态管理 |
| DnD Kit | 行程天数拖拽排序 |
| pnpm | 包管理器（不要用 npm/yarn） |

---

## 页面路由（App Router）

```
src/app/
├── page.tsx                    # 落地页（PlanPinGo 品牌介绍）
├── login/page.tsx              # 登录页
├── packets/
│   ├── page.tsx                # 我的旅行计划列表（CRUD + 分享）
│   └── [id]/view/page.tsx      # 查看单个计划详情
├── createTravelPlan/page.tsx   # 地图编辑器（?packetId=xxx 则为编辑已有计划）
└── shared/[shareCode]/page.tsx # 公开分享页（无需登录）
```

---

## 关键组件

```
src/components/
├── mapbox/index.tsx            # Mapbox 地图主组件
├── mapbox/toolsMenu/           # 地图工具栏（添加标记等）
├── traveTracks/                # 行程轨迹列表（支持 DnD 拖拽排序）
├── dialogs/createMarkerDialog/ # 创建地图标记弹窗
├── TokenGuard.tsx              # Auth0 token 注入 Zustand store 的守卫
└── ui/                         # shadcn/ui 组件库
```

---

## 状态管理（Zustand）

- `src/store/authStore.ts` — 存储 Auth0 JWT token；后续 API 请求从 `useAuthStore.getState().token` 取
- `src/store/languageStore.ts` — 语言切换（`zh` / `en`）
- `src/app/store/mapStore.ts` — 地图状态

---

## 国际化

`src/lib/i18n.ts` — 内置中英文翻译字典，通过 `useTranslation(language)` 使用，支持 `zh` / `en` 两种语言。

---

## HTTP 请求

`src/lib/http.ts` — 封装的 HTTP 客户端，自动从 authStore 注入 Bearer token。

---

## 核心业务流程

1. 用户登录（Auth0） → `TokenGuard` 把 token 写入 Zustand store
2. `/createTravelPlan` — Mapbox 地图上添加标记、安排天数 → 保存为 Packet（调 `POST /api/packets`）
3. `/packets` — 列表页：查看 / 编辑 / 分享 / 删除
4. 分享：生成 `shareCode` → `/shared/:shareCode` 无需登录可查看

---

## 分享功能

- `shareType: 'free'` — 已上线，任何人可通过链接查看
- `shareType: 'paid'` — Coming Soon（UI 已有占位，接口未实现）
- 已分享的计划卡片显示 "Public" 徽章和查看次数

---

## 开发命令

```bash
pnpm dev    # http://localhost:3000
pnpm build
pnpm start
pnpm lint
```

---

## 注意事项

- 使用 **pnpm**，不要用 npm/yarn
- Auth0 token 由 `TokenGuard` 注入，不要直接在组件里调 `getAccessTokenSilently` 而绕过 store
- Mapbox 相关代码集中在 `src/components/mapbox/`
- 后端 API 基础路径：`/api/packets`、`/api/shared`、`/user/profile`
