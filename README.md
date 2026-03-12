# Toobit Agent Trade Kit

**让 AI 代理在 Toobit 上执行交易的官方工具包。**

用自然语言驱动交易——从行情查询到下单执行。内置 MCP Server + CLI，完全开源，本地运行，密钥绝不离开您的设备。

## 支持的功能

| 模块 | 功能 | 工具数 |
|------|------|--------|
| **Market** | 实时行情、深度、K线、标记价、资金费率、持仓量、指数 | 21 |
| **Spot** | 下单、撤单、批量操作、查询订单、成交历史 | 10 |
| **Futures** | USDT-M 合约、杠杆、平仓、止盈止损、闪电平仓、反手 | 25 |
| **Account** | 余额、充提、子账户、划转、流水、API Key 检查 | 10 |

**总计：66+ 个 MCP 工具**

## 三种使用方式

### 1. MCP 服务器（`toobit-trade-mcp`）
接入 Claude、Cursor、VS Code 或任何支持 MCP 的 AI 客户端。

### 2. CLI（`toobit-trade-cli`）
在终端直接交易，支持管道、定时任务和脚本。

### 3. Skills（规划中）
即插即用模块，适用于支持 Skills 协议的 AI 客户端。

## 快速开始

### 安装

```bash
npm install -g toobit-trade-mcp toobit-trade-cli
```

### 配置凭证

```bash
toobit config init
```

或手动创建 `~/.toobit/config.toml`：

```toml
default_profile = "live"

[profiles.live]
api_key    = "your-api-key"
secret_key = "your-secret-key"
```

**获取 API Key：** [Toobit API Key 创建指南](https://www.toobit.com/en-US/support/toobit-api-key-creation-guide)

### 连接 AI 客户端

```bash
toobit-trade-mcp setup --client <client>
```

| 客户端 | `<client>` 值 |
|--------|---------------|
| Claude Desktop | `claude-desktop` |
| Claude Code | `claude-code` |
| Cursor | `cursor` |
| VS Code | `vscode` |
| Windsurf | `windsurf` |

### 试用

```bash
# 行情数据（无需 API Key）
toobit market ticker --symbol BTCUSDT
toobit market candles --symbol BTCUSDT --interval 1h --limit 10
toobit market funding-rate --symbol BTCUSDT

# 现货交易
toobit spot place --symbol BTCUSDT --side BUY --type MARKET --quantity 0.001

# 合约交易
toobit futures place --symbol BTCUSDT --side BUY_OPEN --orderType MARKET --quantity 1 --leverage 10
toobit futures positions

# 账户
toobit account balance
```

## MCP 服务器

### 启动选项

| 使用场景 | 命令 |
|---------|------|
| 仅行情数据（无需 Key） | `toobit-trade-mcp --modules market` |
| 全功能 | `toobit-trade-mcp --modules all` |
| 只读监控 | `toobit-trade-mcp --read-only` |
| 仅现货 | `toobit-trade-mcp --modules market,spot` |
| 仅合约 | `toobit-trade-mcp --modules market,futures` |

### 工具列表

#### market — 行情数据（21 个，公开接口）

| 工具 | 说明 |
|------|------|
| `market_get_server_time` | 服务器时间 |
| `market_get_exchange_info` | 交易规则与交易对 |
| `market_get_depth` | 盘口深度 |
| `market_get_merged_depth` | 合并深度 |
| `market_get_trades` | 最近成交 |
| `market_get_klines` | K线数据 |
| `market_get_ticker_24hr` | 24h 现货行情 |
| `market_get_ticker_price` | 最新价格 |
| `market_get_book_ticker` | 最优挂单 |
| `market_get_index_klines` | 指数K线 |
| `market_get_mark_price` | 标记价格 |
| `market_get_mark_price_klines` | 标记价K线 |
| `market_get_funding_rate` | 当前资金费率 |
| `market_get_funding_rate_history` | 历史资金费率 |
| `market_get_open_interest` | 持仓量 |
| `market_get_long_short_ratio` | 多空比 |
| `market_get_contract_ticker_24hr` | 24h 合约行情 |
| `market_get_contract_ticker_price` | 合约最新价 |
| `market_get_index_price` | 指数价格 |
| `market_get_insurance_fund` | 保险基金 |
| `market_get_risk_limits` | 风险限额 |

#### spot — 现货交易（10 个）

| 工具 | 说明 |
|------|------|
| `spot_place_order` | 下现货单 |
| `spot_place_order_test` | 测试下单 |
| `spot_batch_orders` | 批量下单 |
| `spot_cancel_order` | 撤单 |
| `spot_cancel_open_orders` | 撤销全部挂单 |
| `spot_cancel_order_by_ids` | 按ID批量撤单 |
| `spot_get_order` | 查询订单 |
| `spot_get_open_orders` | 当前挂单 |
| `spot_get_trade_orders` | 历史订单 |
| `spot_get_fills` | 成交记录 |

#### futures — USDT-M 合约（25 个）

| 工具 | 说明 |
|------|------|
| `futures_place_order` | 下合约单 |
| `futures_batch_orders` | 批量下单 |
| `futures_cancel_order` | 撤单 |
| `futures_cancel_all_orders` | 撤销全部 |
| `futures_cancel_order_by_ids` | 按ID批量撤单 |
| `futures_amend_order` | 改单 |
| `futures_get_order` | 查询订单 |
| `futures_get_open_orders` | 当前挂单 |
| `futures_get_history_orders` | 历史订单 |
| `futures_get_positions` | 当前持仓 |
| `futures_get_history_positions` | 历史持仓 |
| `futures_set_leverage` | 设置杠杆 |
| `futures_get_leverage` | 查询杠杆 |
| `futures_set_margin_type` | 全仓/逐仓切换 |
| `futures_set_trading_stop` | 设置止盈止损 |
| `futures_flash_close` | 闪电平仓 |
| `futures_reverse_position` | 一键反手 |
| `futures_adjust_margin` | 调整保证金 |
| `futures_get_fills` | 成交记录 |
| `futures_get_balance` | 合约余额 |
| `futures_get_commission_rate` | 手续费率 |
| `futures_get_today_pnl` | 今日盈亏 |
| `futures_get_balance_flow` | 合约流水 |
| `futures_auto_add_margin` | 自动追加保证金 |

#### account — 账户管理（10 个）

| 工具 | 说明 |
|------|------|
| `account_get_info` | 账户信息 |
| `account_get_balance_flow` | 账户流水 |
| `account_get_sub_accounts` | 子账户列表 |
| `account_sub_transfer` | 子账户划转 |
| `account_check_api_key` | API Key 检查 |
| `account_withdraw` | 提币 |
| `account_get_withdraw_orders` | 提币记录 |
| `account_get_deposit_address` | 充值地址 |
| `account_get_deposit_orders` | 充值记录 |
| `trade_get_history` | 审计日志 |

## 安全

1. **本地运行** — 密钥仅存本地 `~/.toobit/config.toml`，签名在本地完成
2. **只读模式** (`--read-only`) — 仅允许数据查询
3. **模块控制** (`--modules`) — 按需加载功能模块
4. **审计日志** — 所有调用记录到 `~/.toobit/logs/`，参数自动脱敏

> **安全提示：** 切勿将 API Key 或 Secret Key 粘贴到 AI 对话框中。建议使用子账户 API Key 并仅开启所需权限。

## 项目结构

```
agent-toobit-kit/
├── packages/
│   ├── core/          # 共享核心库
│   ├── mcp/           # toobit-trade-mcp — MCP 服务器
│   └── cli/           # toobit-trade-cli — 命令行工具
├── docs/
│   └── landing/       # 介绍页面
├── config.toml.example
└── README.md
```

## 开发

```bash
pnpm install
pnpm build
```

## 许可证

MIT License

## 缺失服务说明

以下服务需要额外配置，当前项目中以占位方式标注：

| 服务 | 状态 | 说明 |
|------|------|------|
| **npm 发布** | ✅ 已完成 | [toobit-trade-mcp](https://www.npmjs.com/package/toobit-trade-mcp) / [toobit-trade-cli](https://www.npmjs.com/package/toobit-trade-cli) |
| **MCP 云端部署 (Remote MCP)** | 🔜 规划中 | 当前仅支持本地 stdio 模式 |
| **Skills 协议** | 🔜 规划中 | `toobit-cex-market`、`toobit-cex-trade` 等独立 Skill 包 |
| **WebSocket 实时数据** | 🔜 待开发 | 现货/合约 WebSocket 行情和用户数据流 |
| **Bot 策略模块** | 🔜 待开发 | 网格交易、DCA 定投等自动化策略 |
| **CI/CD** | 🔜 待配置 | GitHub Actions 自动构建和测试 |
| **模拟盘 (Demo)** | ❌ 不适用 | Toobit API 目前无模拟盘功能 |
| **期权交易 (Option)** | ❌ 不适用 | Toobit 目前不提供期权交易 |
