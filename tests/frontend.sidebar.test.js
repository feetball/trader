import fs from 'fs/promises';
import path from 'path';

test('Sidebar contains dynamic exchange label and uses exchangeApiStatus', async () => {
  const file = await fs.readFile(path.join(process.cwd(), 'frontend/src/components/Sidebar.tsx'), 'utf-8');
  // Should contain ternary label checking settings.EXCHANGE
  expect(file).toMatch(/\{settings\.EXCHANGE === 'KRAKEN' \? 'Kraken API' : 'Coinbase API'\}/);
  // Should reference exchangeApiStatus variable
  expect(file).toMatch(/exchangeApiStatus/);
});
