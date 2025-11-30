# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please do NOT open a public issue.

Instead, please report it privately by:

1. **Email**: Send details to the repository owner
2. **GitHub Security Advisories**: Use GitHub's private vulnerability reporting

### What to include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline:
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity

## Security Best Practices for Users

### API Keys
- **Never commit** `.env` files with real API keys
- Use read-only API keys when possible
- Rotate keys periodically

### Paper Trading
- Always test with `PAPER_TRADING=true` first
- Verify behavior before enabling real trading

### Docker Security
- Keep Docker and images updated
- Don't run containers as root in production
- Use Docker secrets for sensitive data

### Network Security
- Don't expose port 3001 publicly without authentication
- Use a reverse proxy (nginx) with HTTPS in production
- Consider firewall rules for API access

## Known Security Considerations

1. **No Authentication**: The dashboard has no built-in auth. Don't expose to public internet.
2. **Paper Trading Only**: Real trading is not fully implemented/tested.
3. **API Rate Limits**: Coinbase may rate-limit aggressive scanning.
