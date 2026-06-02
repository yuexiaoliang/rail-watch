# Rail Watch

12306 余票监控工具。监听指定车次、座位类型、发到站未来 15 天的余票信息。

## 技术栈

- 后端：Hono + Playwright + Node.js
- 前端：React + TailwindCSS
- 存储：JSON 文件（~/.rail-watch/）

## 开发

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium

# 同时启动前端和后端（开发模式）
npm run dev
```

- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:9120`

## 构建

```bash
npm run build
```

构建输出：
- 前端：`dist/client/`
- 后端：`dist/server/`

## 部署

### 1. 构建

```bash
cd /home/yuexiaoliang/projects/rail-watch
npm run build
```

### 2. PM2 启动

PM2 配置文件统一管理在 `~/projects/scripts/`：

```bash
pm2 start ~/projects/scripts/ecosystem.rail-watch.json
pm2 save
```

### 3. Nginx 重载

Nginx 站点配置统一管理在 `~/nginx-config/sites/`：

```bash
sudo nginx -s reload
```

### 4. 开机自启（只需执行一次）

```bash
sudo env PATH=$PATH:/home/yuexiaoliang/.nvm/versions/node/v24.13.1/bin /home/yuexiaoliang/.nvm/versions/node/v24.13.1/lib/node_modules/pm2/bin/pm2 startup systemd -u yuexiaoliang --hp /home/yuexiaoliang
```

## 数据目录

所有数据存储在 `~/.rail-watch/`：

- `config.json` — 监控配置（车次、座位类型等）
- `tickets.json` — 抓取到的余票数据
- `bought.json` — 已购票记录
- `logs/` — 日志文件

## API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/config` | GET/POST | 获取/修改配置 |
| `/api/trains` | POST | 添加车次 |
| `/api/trains/:id` | DELETE | 删除车次 |
| `/api/tickets` | GET | 获取余票数据 |
| `/api/bought` | POST | 标记已购票 |
| `/api/bought/:trainNo/:date` | DELETE | 取消已购票 |
| `/api/scheduler/start` | POST | 启动调度器 |
| `/api/scheduler/stop` | POST | 停止调度器 |
| `/api/scheduler` | GET | 查询调度器状态 |
