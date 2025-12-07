# Configuration Guide

## config.js Setup

The trading bot requires a `config.js` file for configuration. This file is automatically created from `config.default.js` during deployment.

### Automatic Creation

The deploy script automatically ensures `config.js` exists:
- On `./deploy.sh start` or `./deploy.sh update`
- If `config.js` is missing, it's copied from `config.default.js`
- If `config.js` exists as a directory (error case), it's removed and recreated as a file

### Manual Creation

If you need to create it manually:

```bash
cp config.default.js config.js
```

### Important Notes

1. **Never commit `config.js`** - It's in `.gitignore` to preserve your custom settings
2. **Always edit `config.js`**, not `config.default.js` - Your changes survive updates
3. **If you get "ERR_UNSUPPORTED_DIR_IMPORT"** - Run `./deploy.sh update` to fix it

### Customization

Edit `config.js` to customize trading parameters:
- Paper trading mode
- Price thresholds
- Profit targets
- Position sizing
- API credentials (future)

Changes are automatically applied through the dashboard Settings page or by restarting the bot.
