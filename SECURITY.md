# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Delta Exchange Agent Trade Kit, please report it responsibly:

1. **GitHub Private Advisory** — Create a private security advisory on the repository
2. **Email** — Contact the repository maintainers via GitHub

### High Priority

- API key leakage through logs, error messages, or network requests
- Fund safety issues (unauthorized trades, transfers)
- Authentication bypass or signature manipulation
- Sensitive data exposure

### Attack Surface

- **Credential storage** — `~/.delta/config.toml` file permissions
- **Network requests** — HMAC-SHA256 signature integrity
- **MCP tool inputs** — Parameter validation and injection
- **Audit logs** — Sensitive data sanitization

## Security Best Practices

1. Use sub-account API keys with minimal permissions
2. Never paste API keys into AI chat windows
3. Enable `--read-only` mode for monitoring-only use cases
4. Regularly rotate API keys
5. Review audit logs in `~/.delta/logs/`
