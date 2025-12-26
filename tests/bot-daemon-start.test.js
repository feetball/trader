import { jest } from '@jest/globals';
import { TradingBotDaemon } from '../bot-daemon.js';

describe('TradingBotDaemon start/stop', () => {
  beforeEach(() => jest.clearAllMocks());

  test('start calls loadPortfolio and mainLoop', async () => {
    const bot = new TradingBotDaemon();
    // stub paper.loadPortfolio and mainLoop
    bot.paper.loadPortfolio = jest.fn().mockResolvedValue();
    const mainSpy = jest.spyOn(TradingBotDaemon.prototype, 'mainLoop').mockImplementation(async () => {});

    await bot.start();
    expect(bot.isRunning).toBe(true);
    expect(bot.startTime).toBeTruthy();
    expect(bot.paper.loadPortfolio).toHaveBeenCalled();
    expect(mainSpy).toHaveBeenCalled();

    mainSpy.mockRestore();
    bot.stop('test');
    expect(bot.isRunning).toBe(false);
  });

  test('stop logs and sets running false', () => {
    const bot = new TradingBotDaemon();
    bot.isRunning = true;
    bot.cycleCount = 5;
    bot.stop('unit test');
    expect(bot.isRunning).toBe(false);
  });
});