# Delta Exchange Agent Trade Kit

**The official toolkit for AI agents to trade on Delta Exchange.**

Trade with natural language — from market queries to order execution. Built-in MCP Server + CLI, fully open-source, runs locally, your keys never leave your device.

## Features

| Module | Capabilities | Tools |
|--------|-------------|-------|
| **Market** | Products, assets, tickers, order book, trades, candles, indices, settlement prices | 9 |
| **Spot** | Place/cancel/amend orders, batch cancel, open orders, history, fills | 7 |
| **Futures** | Perpetuals & dated futures, leverage, bracket orders, batch ops, positions, margin | 16 |
| **Account** | Profile, wallet balances, transactions, transfer, rate-limit quota | 5 |

**Total: 37+ MCP tools**

## Usage Modes

### 1. MCP Server (`delta-trade-mcp`)
Connect to Claude, Cursor, VS Code, or any MCP-compatible AI client.

### 2. CLI (`delta-trade-cli`)
Trade directly from the terminal. Supports piping, cron jobs, and scripting.

## Quick Start

### Install

```bash
npm install -g delta-trade-mcp delta-trade-cli
```

### Configure Credentials

```bash
delta config init
```

Or manually create `~/.delta/config.toml`:

```toml
default_profile = "live"

[profiles.live]
api_key    = "your-api-key"
secret_key = "your-secret-key"
```

**Get API Key:** [Delta Exchange API Documentation](https://docs.delta.exchange)

### Connect AI Client

```bash
delta-trade-mcp setup --client <client>
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
delta market ticker --symbol BTCUSDT_PERP
delta market candles --symbol BTCUSDT_PERP --resolution 1h
delta market orderbook --symbol BTCUSDT_PERP

# Spot trading (use spot product symbols, e.g. BTCUSDT_SP)
delta spot place --product-symbol BTCUSDT_SP --side buy --order-type market_order --size 0.001

# Futures trading
delta futures place --product-symbol BTCUSDT_PERP --side buy --order-type market_order --size 1
delta futures positions
delta futures leverage --product-id 84 --leverage 10

# Account
delta account balance
```

## MCP Server

### Launch Options

| Scenario | Command |
|----------|---------|
| Market data only (no key) | `delta-trade-mcp --modules market` |
| Full access | `delta-trade-mcp --modules all` |
| Read-only monitoring | `delta-trade-mcp --read-only` |
| Spot only | `delta-trade-mcp --modules market,spot` |
| Futures only | `delta-trade-mcp --modules market,futures` |

### Tool List

<details>
<summary><b>market — Market Data (9 tools, public)</b></summary>

| Tool | Description |
|------|-------------|
| `market_get_products` | List all products/contracts with optional filters |
| `market_get_assets` | List all supported assets |
| `market_get_tickers` | Live market data for all or filtered products |
| `market_get_ticker` | Ticker for a specific product symbol |
| `market_get_orderbook` | Order book depth for a product |
| `market_get_trades` | Recent trades for a product |
| `market_get_candles` | OHLCV candlestick data |
| `market_get_indices` | Index prices |
| `market_get_settlement_prices` | Settlement prices |

</details>

<details>
<summary><b>spot — Spot Trading (7 tools)</b></summary>

| Tool | Description |
|------|-------------|
| `spot_place_order` | Place a spot limit or market order |
| `spot_cancel_order` | Cancel an open spot order |
| `spot_batch_cancel_orders` | Cancel all open spot orders for a product |
| `spot_amend_order` | Amend size or price of an open spot order |
| `spot_get_open_orders` | Query open spot orders |
| `spot_get_order_history` | Spot order history |
| `spot_get_fills` | Spot trade fills |

</details>

<details>
<summary><b>futures — Futures & Perpetuals (16 tools)</b></summary>

| Tool | Description |
|------|-------------|
| `futures_place_order` | Place a futures order |
| `futures_place_bracket_order` | Place order with TP/SL bracket |
| `futures_batch_orders` | Place up to 50 orders in one call |
| `futures_cancel_order` | Cancel a futures order |
| `futures_cancel_all_orders` | Cancel all futures orders for a product |
| `futures_batch_cancel_orders` | Cancel a batch of orders by ID |
| `futures_amend_order` | Amend a futures order |
| `futures_get_open_orders` | Query open futures orders |
| `futures_get_order_history` | Futures order history |
| `futures_get_positions` | Current open positions |
| `futures_close_position` | Close a position |
| `futures_adjust_margin` | Add or remove margin from a position |
| `futures_set_leverage` | Set leverage for a product |
| `futures_get_leverage` | Get current leverage setting |
| `futures_get_fills` | Futures trade fills |
| `futures_get_balance` | Wallet balances |

</details>

<details>
<summary><b>account — Account Management (5 tools)</b></summary>

| Tool | Description |
|------|-------------|
| `account_get_info` | Profile and account info |
| `account_get_wallet_balances` | Wallet balances per asset |
| `account_get_transactions` | Transaction history |
| `account_transfer` | Transfer between sub-accounts |
| `account_get_rate_limit` | Rate limit quota status |

</details>

## Symbol Format

Delta Exchange uses product symbols for all endpoints:

| Type | Format | Example |
|------|--------|---------|
| Spot | `<BASE><QUOTE>_SP` | `BTCUSDT_SP`, `ETHUSDT_SP` |
| Perpetual Futures | `<BASE><QUOTE>_PERP` or `<BASE>USD_PERP` | `BTCUSDT_PERP`, `ETHUSD_PERP` |
| Dated Futures | `<BASE>-<DATE>` | `BTC-28MAR25` |
| Options | `<BASE>-<DATE>-<STRIKE>-<C/P>` | `BTC-28MAR25-80000-C` |

Use `market_get_products` to look up the exact symbol or `product_id` for any contract.

## Authentication

Delta Exchange uses HMAC-SHA256 authentication:
- Signature covers: `method + timestamp + path + queryString + body`
- Timestamp is Unix seconds (not milliseconds)
- Headers: `api-key`, `timestamp`, `signature`

## Security

1. **Local execution** — Keys stored locally in `~/.delta/config.toml`, signatures computed locally
2. **Config hot-reload** — MCP server automatically detects changes to `config.toml` on every request (via file mtime check). No restart needed after rotating API keys. Invalid configs are rejected and the previous valid config stays active.
3. **Read-only mode** (`--read-only`) — Data queries only
4. **Module control** (`--modules`) — Load only the modules you need
5. **Audit logging** — All calls logged to `~/.delta/logs/` with auto-redacted parameters
6. **Input sanitization** — `client_order_id` uses whitelist `[a-zA-Z0-9_\-.]` to prevent injection attacks

> **Security tip:** Never paste your API Key or Secret Key into AI chat. Use sub-account API keys with minimum required permissions.

## Project Structure

```
agent-kit/
├── packages/
│   ├── core/          # Shared core library (@delta_agent/agent-deltakit-core)
│   ├── mcp/           # delta-trade-mcp — MCP server
│   └── cli/           # delta-trade-cli — CLI tool
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
| **npm publish** | 🔜 Planned | `delta-trade-mcp` / `delta-trade-cli` |
| **Remote MCP** | 🔜 Planned | Currently local stdio only |
| **WebSocket** | 🔜 Planned | Real-time data streams |
| **Bot strategies** | 🔜 Planned | Grid trading, DCA, etc. |
| **CI/CD** | 🔜 Planned | GitHub Actions |
