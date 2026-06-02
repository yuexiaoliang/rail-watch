# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Rail Watch — 12306 余票监控工具。监听指定车次、座位类型、发到站未来 N 天的余票信息。

- 后端：Hono + Playwright (chromium) + Node.js
- 前端：React 19 + Tailwind CSS v4 + shadcn/ui
- 存储：JSON 文件（`~/.rail-watch/`）
- 部署：PM2 + Nginx

## 常用命令

```bash
# 开发（同时启动前后端）
npm run dev

# 单独启动
npm run dev:server   # tsx watch src/server/index.ts，端口 9120
npm run dev:client   # vite，端口 5173，代理 /api → localhost:9120

# 构建（tsc 编译 server+shared，vite 编译 client）
npm run build

# 生产运行
npm start            # node dist/server/index.js

# PM2 管理
pm2 reload rail-watch
pm2 start ~/projects/scripts/ecosystem.rail-watch.json
```

开发时访问 `http://localhost:5173`，Vite 会把 `/api` 请求代理到 `localhost:9120`。

## 架构要点

### ES Modules + `.js` 导入扩展名

`package.json` 设置了 `"type": "module"`。TypeScript 文件之间互相导入时，**必须**使用 `.js` 扩展名：

```typescript
import { something } from '../shared/utils.js';  // ✅
import { something } from '../shared/utils';     // ❌ 运行时报错
```

### 共享层 `src/shared/`

前后端共用的代码放在这里：

- `src/shared/types.ts` — 所有类型定义和常量（`SEAT_LABELS`、`TrainConfig`、`TicketInfo` 等）
- `src/shared/utils.ts` — 纯工具函数（`formatDate`、`seatDisplay`、`getRushInfo`、`generateDates`）

后端 `src/server/*.ts` 从 `../shared/*.js` 导入，前端 `src/client/*.ts` 从 `../shared/*.js` 导入。

### 构建流程

- `tsconfig.json` 的 `include` 只包含 `src/server/**/*` 和 `src/shared/**/*`，`exclude` 包含 `src/client`
- `tsc` 编译输出到 `dist/server/` 和 `dist/shared/`
- `vite build` 以 `src/client` 为 root，输出到 `dist/client/`
- 生产环境 Hono 通过 `serveStatic` 从 `dist/client/` 提供静态文件

### 数据目录 `~/.rail-watch/`

所有持久化数据：

- `config.json` — 监控配置（车次列表、daysAhead、intervalMinutes）
- `tickets.json` — 抓取到的余票原始数据（按 `trainNo_date_seatType` 键存储）
- `bought.json` — 已购票记录（按 `trainNo_date` 键存储）
- `logs/` — 日志

环境变量 `DATA_DIR` 可以覆盖默认路径。

### shadcn/ui 配置

项目使用 Tailwind CSS v4 + shadcn/ui（非 RSC 模式）。由于 Vite root 是 `src/client`，路径别名需要手动处理：

- `components.json` 已手动配置
- shadcn 组件安装在 `src/client/components/ui/`
- 工具函数 `cn` 在 `src/client/lib/utils.ts`
- 组件内部导入使用相对路径 `../../lib/utils`，因为 Vite 无法解析 `src/client/lib/utils` 这种绝对路径

添加新 shadcn 组件：`npx shadcn add <component-name>`，然后修复导入路径。

### Playwright 爬虫 `src/server/scraper.ts`

`queryTickets()` 使用 Playwright 打开 12306 余票查询页面，拦截 `leftTicket/query` API 响应，解析所有座位类型数据。返回的数据包含全部 8 种座位类型（不只限于配置的类型）。

12306 原始字段映射见 `SEAT_INDEX_MAP`：商务座(32)、一等座(31)、二等座(30)、高级软卧(23)、软卧(28)、硬卧(27)、硬座(29)、无座(26)。

`available` 的可能值：`number`（余票数）、`'有'`（有票数量不详）、`'候补'`（可候补）、`'--'`（无数据/无此座席）。

### 调度器 `src/server/scheduler.ts`

- 每轮生成所有 `train × date` 组合的任务列表
- 自动跳过已购票（`isBought()`）的车次+日期
- 请求间隔 = `(intervalMinutes × 60 × 1000) / 任务数`，最小 3 秒
- 无任务时休眠 60 秒
- 启动时自动开始（`index.ts` 第 44 行）

### API 设计

所有 API 以 `/api` 为前缀。关键端点：

- `GET /api/tickets` — 返回按 `trainNo+date` 分组的余票数据，附带节假日信息
- `POST /api/bought` — 标记已购票，scheduler 会自动跳过
- `POST /api/config` — 部分更新配置，**注意** `trains` 字段用 `??` 保护不会被意外覆盖

### 前端显示逻辑 `src/client/components/TicketCell.tsx`

单元格显示优先级：

1. 配置的主座位有票 → 显示票数
2. 主座位是"候补" → 显示"候补"；若无座有票追加"无座 X"
3. 主座位无票无候补 → 若无座有票显示"无座 X"
4. 什么都没有 → 显示"无"

已购单元格只显示"已购"徽章，不显示采集时间。

## 部署

PM2 配置：`~/projects/scripts/ecosystem.rail-watch.json`
Nginx 配置：`~/nginx-config/sites/`

部署流程：

```bash
cd /home/yuexiaoliang/projects/rail-watch
npm run build
pm2 reload rail-watch
sudo nginx -s reload
```
