# Toobit Agent Trade Kit

**The official toolkit for AI agents to trade on Toobit.**

Trade with natural language — from market queries to order execution. Built-in MCP Server + CLI, fully open-source, runs locally, your keys never leave your device.

[中文文档](#中文文档)

## Features

| Module | Capabilities | Tools |
|--------|-------------|-------|
| **Market** | Real-time ticker, depth, klines, mark price, funding rate, open interest, index | 21 |
| **Spot** | Place/cancel orders, batch operations, order queries, trade history | 10 |
| **Futures** | USDT-M perpetual, leverage, close position, TP/SL, flash close, reverse | 25 |
| **Account** | Balance, deposit/withdraw, sub-accounts, transfer, flow, API key check | 10 |

**Total: 66+ MCP tools**

## Usage Modes

### 1. MCP Server (`toobit-trade-mcp`)
Connect to Claude, Cursor, VS Code, or any MCP-compatible AI client.

### 2. CLI (`toobit-trade-cli`)
Trade directly from the terminal. Supports piping, cron jobs, and scripting.

### 3. Skills
Plug-and-play modules for AI clients that support the Skills protocol. See [agent-skills](https://github.com/toobit-docs/agent-skills).

## Quick Start

### Install

```bash
npm install -g toobit-trade-mcp toobit-trade-cli
```

### Configure Credentials

```bash
toobit config init
```

Or manually create `~/.toobit/config.toml`:

```toml
default_profile = "live"

[profiles.live]
api_key    = "your-api-key"
secret_key = "your-secret-key"
```

**Get API Key:** [Toobit API Key Creation Guide](https://www.toobit.com/en-US/support/toobit-api-key-creation-guide)

### Connect AI Client

```bash
toobit-trade-mcp setup --client <client>
```

| Client | `<client>` value |
|--------|-----------------|
| Claude Desktop | `claude-desktop` |
| Claude Code | `claude-code` |
| Cursor | `cursor` |
| VS Code | `vscode` |
| Windsurf | `windsurf` |

### Try It Out

```bash
# Market data (no API key needed)
toobit market ticker --symbol BTCUSDT
toobit market candles --symbol BTCUSDT --interval 1h --limit 10
toobit market funding-rate --symbol BTC-SWAP-USDT

# Spot trading
toobit spot place --symbol BTCUSDT --side BUY --type MARKET --quantity 0.001

# Futures trading (use contract symbol format: BTC-SWAP-USDT)
toobit futures place --symbol BTC-SWAP-USDT --side BUY_OPEN --orderType MARKET --quantity 1 --leverage 10
toobit futures positions

# Account
toobit account balance
```

## MCP Server

### Launch Options

| Scenario | Command |
|----------|---------|
| Market data only (no key) | `toobit-trade-mcp --modules market` |
| Full access | `toobit-trade-mcp --modules all` |
| Read-only monitoring | `toobit-trade-mcp --read-only` |
| Spot only | `toobit-trade-mcp --modules market,spot` |
| Futures only | `toobit-trade-mcp --modules market,futures` |

### Tool List

<details>
<summary><b>market — Market Data (21 tools, public)</b></summary>

| Tool | Description |
|------|-------------|
| `market_get_server_time` | Server time |
| `market_get_exchange_info` | Trading rules & symbols |
| `market_get_depth` | Order book depth |
| `market_get_merged_depth` | Merged depth |
| `market_get_trades` | Recent trades |
| `market_get_klines` | Candlestick data |
| `market_get_ticker_24hr` | 24h spot ticker |
| `market_get_ticker_price` | Latest price |
| `market_get_book_ticker` | Best bid/ask |
| `market_get_index_klines` | Index klines |
| `market_get_mark_price` | Mark price |
| `market_get_mark_price_klines` | Mark price klines |
| `market_get_funding_rate` | Current funding rate |
| `market_get_funding_rate_history` | Funding rate history |
| `market_get_open_interest` | Open interest |
| `market_get_long_short_ratio` | Long/short ratio |
| `market_get_contract_ticker_24hr` | 24h futures ticker |
| `market_get_contract_ticker_price` | Futures latest price |
| `market_get_index_price` | Index price |
| `market_get_insurance_fund` | Insurance fund |
| `market_get_risk_limits` | Risk limits |

</details>

<details>
<summary><b>spot — Spot Trading (10 tools)</b></summary>

| Tool | Description |
|------|-------------|
| `spot_place_order` | Place spot order |
| `spot_place_order_test` | Test order |
| `spot_batch_orders` | Batch orders |
| `spot_cancel_order` | Cancel order |
| `spot_cancel_open_orders` | Cancel all open orders |
| `spot_cancel_order_by_ids` | Cancel by IDs |
| `spot_get_order` | Query order |
| `spot_get_open_orders` | Open orders |
| `spot_get_trade_orders` | Order history |
| `spot_get_fills` | Trade fills |

</details>

<details>
<summary><b>futures — USDT-M Perpetual (25 tools)</b></summary>

| Tool | Description |
|------|-------------|
| `futures_place_order` | Place futures order |
| `futures_batch_orders` | Batch orders |
| `futures_cancel_order` | Cancel order |
| `futures_cancel_all_orders` | Cancel all |
| `futures_cancel_order_by_ids` | Cancel by IDs |
| `futures_amend_order` | Amend order |
| `futures_get_order` | Query order |
| `futures_get_open_orders` | Open orders |
| `futures_get_history_orders` | Order history |
| `futures_get_positions` | Current positions |
| `futures_get_history_positions` | Position history |
| `futures_set_leverage` | Set leverage |
| `futures_get_leverage` | Get leverage |
| `futures_set_margin_type` | Cross/isolated toggle |
| `futures_set_trading_stop` | Set TP/SL |
| `futures_flash_close` | Flash close |
| `futures_reverse_position` | Reverse position |
| `futures_adjust_margin` | Adjust margin |
| `futures_get_fills` | Trade fills |
| `futures_get_balance` | Futures balance |
| `futures_get_commission_rate` | Commission rate |
| `futures_get_today_pnl` | Today's PnL |
| `futures_get_balance_flow` | Balance flow |
| `futures_auto_add_margin` | Auto add margin |

</details>

<details>
<summary><b>account — Account Management (10 tools)</b></summary>

| Tool | Description |
|------|-------------|
| `account_get_info` | Account info |
| `account_get_balance_flow` | Balance flow |
| `account_get_sub_accounts` | Sub-accounts |
| `account_sub_transfer` | Sub-account transfer |
| `account_check_api_key` | API key check |
| `account_withdraw` | Withdraw |
| `account_get_withdraw_orders` | Withdrawal history |
| `account_get_deposit_address` | Deposit address |
| `account_get_deposit_orders` | Deposit history |
| `trade_get_history` | Audit log |

</details>

## Symbol Format

Toobit uses different symbol formats for spot and futures:

| Type | Format | Example |
|------|--------|---------|
| Spot | `BASEUSDT` | `BTCUSDT`, `ETHUSDT` |
| Futures | `BASE-SWAP-USDT` | `BTC-SWAP-USDT`, `ETH-SWAP-USDT` |

> **Important:** Futures endpoints (funding rate, mark price, open interest, etc.) require the contract symbol format `BTC-SWAP-USDT`. Using spot format `BTCUSDT` will return empty data or errors.

## Security

1. **Local execution** — Keys stored locally in `~/.toobit/config.toml`, signatures computed locally
2. **Read-only mode** (`--read-only`) — Data queries only
3. **Module control** (`--modules`) — Load only the modules you need
4. **Audit logging** — All calls logged to `~/.toobit/logs/` with auto-redacted parameters

> **Security tip:** Never paste your API Key or Secret Key into AI chat. Use sub-account API keys with minimum required permissions.

## Project Structure

```
agent-toobit-kit/
├── packages/
│   ├── core/          # Shared core library
│   ├── mcp/           # toobit-trade-mcp — MCP server
│   └── cli/           # toobit-trade-cli — CLI tool
├── docs/
│   └── landing/       # Landing page
├── config.toml.example
└── README.md
```

## Development

```bash
pnpm install
pnpm build
```

## License

MIT License

## Status

| Service | Status | Notes |
|---------|--------|-------|
| **npm publish** | ✅ Done | [toobit-trade-mcp](https://www.npmjs.com/package/toobit-trade-mcp) / [toobit-trade-cli](https://www.npmjs.com/package/toobit-trade-cli) |
| **Remote MCP** | 🔜 Planned | Currently local stdio only |
| **Agent Skills** | ✅ Done | [toobit-docs/agent-skills](https://github.com/toobit-docs/agent-skills) |
| **WebSocket** | 🔜 Planned | Real-time spot/futures data streams |
| **Bot strategies** | 🔜 Planned | Grid trading, DCA, etc. |
| **CI/CD** | 🔜 Planned | GitHub Actions |
| **Demo trading** | ❌ N/A | Toobit API does not support demo trading |
| **Options** | ❌ N/A | Toobit does not offer options trading |

---

# 中文文档

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

## 使用方式

### 1. MCP 服务器 (`toobit-trade-mcp`)
接入 Claude、Cursor、VS Code 或任何支持 MCP 的 AI 客户端。

### 2. CLI (`toobit-trade-cli`)
在终端直接交易，支持管道、定时任务和脚本。

### 3. Skills
即插即用模块，适用于支持 Skills 协议的 AI 客户端。详见 [agent-skills](https://github.com/toobit-docs/agent-skills)。

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

## Symbol 格式

Toobit 的现货和合约使用不同的 symbol 格式：

| 类型 | 格式 | 示例 |
|------|------|------|
| 现货 | `BASEUSDT` | `BTCUSDT`、`ETHUSDT` |
| 合约 | `BASE-SWAP-USDT` | `BTC-SWAP-USDT`、`ETH-SWAP-USDT` |

> **重要：** 合约接口（资金费率、标记价、持仓量等）必须使用合约 symbol 格式 `BTC-SWAP-USDT`。使用现货格式 `BTCUSDT` 会返回空数据或报错。

## 安全

1. **本地运行** — 密钥仅存本地 `~/.toobit/config.toml`，签名在本地完成
2. **只读模式** (`--read-only`) — 仅允许数据查询
3. **模块控制** (`--modules`) — 按需加载功能模块
4. **审计日志** — 所有调用记录到 `~/.toobit/logs/`，参数自动脱敏

> **安全提示：** 切勿将 API Key 或 Secret Key 粘贴到 AI 对话框中。建议使用子账户 API Key 并仅开启所需权限。
