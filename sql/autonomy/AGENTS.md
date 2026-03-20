# Autonomy Project AGENTS Guide

## 1. 项目定位

- `autonomy` 是“物业自治”项目的独立实现目录。
- 业务范围以 [项目文档.md](/e:/ai-work/project/sql/autonomy/项目文档.md) 为唯一产品基线。
- 根目录 [backend](/e:/ai-work/project/sql/backend) 和 [admin-web](/e:/ai-work/project/sql/admin-web) 的作用是提供工程结构、技术选型、代码组织参考，不是自治业务的功能来源。
- 自治项目默认只在 `autonomy` 目录内开发；未经明确要求，不要把自治业务代码写回根目录 `backend` 或 `admin-web`。

## 2. 冲突处理优先级

- 功能和业务边界冲突时：`项目文档.md` 优先。
- 工程结构和代码组织冲突时：根目录 `backend` / `admin-web` 的现有工程模式优先。
- 前端页面表现与业务规则冲突时：以后端规则为准，前端只负责展示状态和触发操作。

## 3. 目录边界

### 3.1 标准目录

- `autonomy/backend`
  - 物业自治后端。
  - 负责数据库模型、认证、权限、审核流、业务规则、审计留痕、开放接口。
- `autonomy/admin-web`
  - 物业自治管理端。
  - 负责社区管理员、委员会后台、财务管理员使用的 Web 管理界面。
- `autonomy/wechat`
  - 物业自治小程序端。
  - 负责居民、业主、租户、委员会成员的小程序页面与交互。

### 3.2 当前仓库特殊说明

- 当前 `autonomy` 下已有 `web` 空目录，但本项目管理端标准名称应为 `admin-web`，并要求与根目录 `admin-web` 的结构保持一致。
- 在未明确重命名之前：
  - 不要把新的管理端业务代码写入 `autonomy/web`。
  - 管理端目标目录统一按 `autonomy/admin-web` 规划。
  - 如果后续需要落代码，应先创建 `autonomy/admin-web` 标准结构，再开始实现。

### 3.3 禁止越界

- `wechat` 和 `admin-web` 都不能直接访问数据库。
- 投票资格、成员关系、审核状态、账单权限、留痕规则必须由后端统一判定，不能只在前端判断。
- 小程序端只实现居民侧能力，管理端只实现后台能力，不要把后台管理逻辑直接放进小程序端。

## 4. 业务范围基线

当前第一阶段只实现 [项目文档.md](/e:/ai-work/project/sql/autonomy/项目文档.md) 中定义的物业自治能力，核心域固定为：

- 身份认证
- 房屋与住户关系
- 家庭成员管理
- 投票与投票代表
- 公告通知
- 管理公开
- 财务/管理费公开
- 楼栋缴费情况
- 消息通知
- 管理端审核与配置

未在 `项目文档.md` 中出现的需求，一律视为未确认需求；需要实现时先补文档或明确假设。

## 5. 核心领域模型

物业自治项目的基础模型固定为：

- `房屋 > 住户组 > 成员`

必须遵守以下规则：

- 一个手机号可绑定多套房屋，但每套房屋的关系和认证独立存在。
- 一套房在任一时刻必须只有一个主角色，主角色只能是主业主或主租户。
- 正式表决默认执行“一户一票”。
- 意见征集类投票可执行“一人一票”。
- 一套房允许设置投票代表人，但授权关系必须可追溯。
- 账单可被多人查看，但缴费、异议、代办等关键动作必须留痕。
- 成员新增、移除、失效、权限调整都必须经过审核或记录。

## 6. 后端规范

### 6.1 技术栈

- 框架：NestJS
- 语言：TypeScript
- ORM：Prisma
- 数据库：MySQL
- 认证：JWT
- 文档：Swagger

### 6.2 结构要求

`autonomy/backend` 必须对齐根目录 [backend](/e:/ai-work/project/sql/backend) 的工程组织，至少保持以下结构一致：

- `package.json`
- `nest-cli.json`
- `tsconfig.json`
- `tsconfig.build.json`
- `prisma/schema.prisma`
- `src/main.ts`
- `src/app.module.ts`
- `src/config`
- `src/common`
- `src/prisma`
- `src/modules`
- `test`

这里只要求“结构和模式一致”，不要求复制根目录 `backend` 的现有业务模块名称。

### 6.3 模块组织

- 业务模块统一放在 `src/modules/<domain>`。
- 模块内沿用 NestJS 常规拆分：
  - `<domain>.module.ts`
  - `<domain>.controller.ts`
  - `<domain>.service.ts`
  - `dto/`
  - 需要时再补 `interfaces/`、`entities/`、`constants/`
- 管理端接口统一收敛到 `src/modules/admin`，并沿用根目录 `backend` 的命名方式：
  - `admin-*.controller.ts`
  - `admin-*.service.ts`

### 6.4 API 约定

- 居民侧/小程序侧接口统一走 `/v1/**`。
- 管理端接口统一走 `/admin/v1/**`。
- 保持与根目录 [backend/src/main.ts](/e:/ai-work/project/sql/backend/src/main.ts) 一致的前缀模式。
- 统一响应结构保持与根目录 [response.interceptor.ts](/e:/ai-work/project/sql/backend/src/common/interceptors/response.interceptor.ts) 一致：
  - `code`
  - `message`
  - `data`
  - `timestamp`
- 统一异常输出保持与根目录 [all-exceptions.filter.ts](/e:/ai-work/project/sql/backend/src/common/filters/all-exceptions.filter.ts) 的模式一致。

### 6.5 数据与命名

- TypeScript 层统一使用 `camelCase`。
- Prisma / MySQL 表名与字段名统一使用 `snake_case`。
- 通过 Prisma `@@map` / `@map` 做表名、字段名映射。
- 审计、状态、授权、时间字段优先显式建模，不依赖前端推断。

### 6.6 后端必须承接的规则

以下规则必须在后端落地，不允许只写在前端：

- 成员资格校验
- 房屋与住户组唯一性
- 主角色唯一性
- 投票资格校验
- 一户一票去重
- 投票代表授权与过期
- 财务查看/操作权限
- 管理端审核流
- 审计日志与关键留痕

## 7. 管理端规范

### 7.1 技术栈

- 框架：Vue 3
- 构建：Vite
- 语言：TypeScript
- 状态管理：Pinia
- 路由：Vue Router
- UI：TDesign Vue Next
- 请求层：Axios

### 7.2 结构要求

`autonomy/admin-web` 必须对齐根目录 [admin-web](/e:/ai-work/project/sql/admin-web) 的工程组织，至少保持以下结构一致：

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `src/main.ts`
- `src/App.vue`
- `src/router`
- `src/store`
- `src/views`
- `src/modules`
- `src/api`
- `src/components`
- `src/layouts`
- `src/config`
- `src/utils`
- `src/hooks`
- `src/assets/styles`

### 7.3 页面与模块组织

- 页面放在 `src/views/<domain>`。
- 域内请求、类型、表单 schema、局部组件优先放在 `src/modules/<domain>`。
- 路由按域拆到 `src/router/modules/<domain>.ts`，再由总路由聚合。
- 权限显示可以在前端做按钮级控制，但最终权限校验仍以后端为准。

### 7.4 管理端职责边界

管理端只负责以下后台能力：

- 认证审核
- 成员审核
- 房屋住户组管理
- 投票管理
- 公告管理
- 管理公开内容管理
- 财务公开管理
- 楼栋缴费数据管理
- 消息模板和后台配置

不要把居民侧页面直接做成管理端页面复用，不要为了省事混用一套页面承担两端职责。

## 8. 小程序端规范

### 8.1 技术与实现原则

- `autonomy/wechat` 按微信小程序原生规范组织。
- 页面、组件、配置、路由、生命周期遵循微信小程序官方文档约定。
- 语言建议统一为：
  - 逻辑层：TypeScript
  - 模板层：WXML
  - 样式层：WXSS
  - 配置层：JSON

### 8.2 推荐结构

`autonomy/wechat` 建议至少包含以下结构：

- `app.ts`
- `app.json`
- `app.wxss`
- `project.config.json`
- `sitemap.json`
- `pages/`
- `components/`
- `services/` 或 `api/`
- `utils/`
- `constants/`
- `store/` 或轻量状态封装

### 8.3 页面分域建议

小程序页面按业务域拆分，优先采用如下目录：

- `pages/home`
- `pages/auth`
- `pages/house`
- `pages/member`
- `pages/vote`
- `pages/publicity`
- `pages/finance`
- `pages/message`
- `pages/profile`

### 8.4 小程序职责边界

- 小程序只承载居民端和委员会成员前台能力。
- 小程序不实现后台审核逻辑。
- 小程序不私自拼装权限，必须使用后端返回的资格、状态、可操作标记。
- 任何影响投票、审核、财务、成员关系的关键提交，都必须依赖后端返回结果刷新页面状态。

## 9. 业务模块建议命名

为避免后续实现时命名漂移，自治项目建议固定以下领域命名：

- `auth`：微信登录、注册、鉴权
- `identity`：业主/租户/委员会认证
- `house`：房屋信息、房屋切换
- `household`：住户组
- `member`：家庭成员、同住成员、代办人
- `vote`：投票、投票结果、投票代表
- `announcement`：公告通知
- `disclosure`：管理公开、财务公开
- `finance`：账单、缴费统计、楼栋缴费情况
- `message`：消息通知
- `admin-*`：后台审核、管理、配置类模块

命名一旦确定，后续接口、页面、数据库、菜单应尽量保持同域词汇一致。

## 10. 开发顺序

建议按以下顺序推进，不要跳过基础建模直接做页面：

1. 建立 `autonomy/backend`、`autonomy/admin-web`、`autonomy/wechat` 的标准工程骨架。
2. 先完成数据模型和核心状态流：
   - 房屋
   - 住户组
   - 成员
   - 认证
   - 投票代表
   - 审计留痕
3. 再完成居民侧主链路：
   - 登录/认证
   - 我的房屋
   - 房屋详情
   - 成员管理
   - 投票
   - 公开内容
4. 再完成管理端主链路：
   - 认证审核
   - 成员审核
   - 投票管理
   - 公开管理
   - 财务公开和楼栋缴费数据维护
5. 最后补消息通知、导出、看板、配置等增强能力。

## 11. 变更控制

- 新功能进入实现前，先判断是否在 `项目文档.md` 范围内。
- 如果新增功能会同时影响三端，顺序必须是：后端契约 -> 管理端/小程序端。
- 如果某个规则只在前端可见、后端无对应字段或接口，视为设计不完整，不能直接硬编码上线。
- 如果后续需要补充新的项目约束，应先更新本 `AGENTS.md`，再继续扩展实现。

## 12. 一句话原则

`项目文档.md` 定义“做什么”，根目录 `backend` / `admin-web` 定义“怎么组织代码”，`autonomy` 目录负责把两者组合成独立的物业自治三端项目。

## 13. Frontend Skill Preference

- 在 `autonomy` 工作区进行前端页面设计或重构时，优先使用 `frontend-design` skill。
