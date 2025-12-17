// Simple exchange mapping utilities

const COINBASE_TO_KRAKEN = {
  'BTC': 'XBT',
  // Add any special mappings here if Kraken uses different codes
  // e.g. 'BCH': 'BCH', 'ETH': 'ETH' (same)
};

function mapProductIdToKrakenPair(productId) {
  if (!productId || typeof productId !== 'string') return productId;
  // Normalize common Coinbase form like 'BTC-USD' or 'BTC-USD' to Kraken pair 'XBTUSD'
  // Coinbase productId generally is SYMBOL-FIAT like 'BTC-USD' or 'ETH-USD'
  const cleaned = productId.replace(/\s+/g, '').toUpperCase();
  // Handle common coinbase format SYMBOL-QUOTE
  if (cleaned.includes('-')) {
    const [base, quote] = cleaned.split('-');
    const baseMapped = COINBASE_TO_KRAKEN[base] || base;
    return `${baseMapped}${quote}`;
  }

  // If already looks like Kraken pair (e.g., 'XBTUSD' or 'XBT-USD' etc.), normalize dashes
  return cleaned.replace(/-/g, '');
}

export { mapProductIdToKrakenPair };
