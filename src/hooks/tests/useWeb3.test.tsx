import { generateTestingUtils } from 'eth-testing';

import { act, fireEvent, render, screen } from '~/jest/test-utils';

import App from '../../App';

describe('useWeb3', () => {
  beforeEach(async () => {
    render(
      <App
        config={{
          anonKey: process.env.CONSOLE_ANON_KEY || '',
          generateDepositAddress: async () => {
            throw 'Error generating deposit address.';
          },
          theme: 'dark',
        }}
        onClose={() => {}}
      />
    );

    await screen.findByText('Loading...');
    const elonCoin = await screen.findByText('ElonCoin');
    fireEvent.click(elonCoin);
    await screen.findByText('Fetching Networks...');
    const ethereum = await screen.findByText('Ethereum');
    fireEvent.click(ethereum);
  });

  describe('MetaMask Provider', () => {
    const testingUtils = generateTestingUtils({
      providerType: 'MetaMask',
    });
    beforeAll(() => {
      global.window.ethereum = testingUtils.getProvider();
      act(() => {
        testingUtils.lowLevel.mockRequest('eth_accounts', []);
        testingUtils.lowLevel.mockRequest('eth_requestAccounts', [
          '0x123EthReqAccounts',
        ]);
      });
    });
    afterEach(() => {
      testingUtils.clearAllMocks();
    });

    it('should connect', async () => {
      const metaMask = (await screen.findAllByText('MetaMask'))[0];
      fireEvent.click(metaMask);

      const input = await screen.findByTestId('input');
      act(() => {
        fireEvent.change(input, { target: { value: '1' } });
      });
      expect(await screen.findByText('Connecting...')).toBeInTheDocument();
      expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    });
  });
  describe('CoinbaseWallet Provider', () => {
    const testingUtils = generateTestingUtils({
      providerType: 'Coinbase',
    });
    beforeAll(() => {
      global.window.ethereum = testingUtils.getProvider();
      act(() => {
        testingUtils.lowLevel.mockRequest('eth_accounts', []);
        testingUtils.lowLevel.mockRequest('eth_requestAccounts', [
          '0x123EthReqAccounts',
        ]);
      });
    });
    afterEach(() => {
      testingUtils.clearAllMocks();
    });

    it('should connect', async () => {
      const cb = (await screen.findAllByText('Coinbase Wallet'))[0];
      fireEvent.click(cb);

      const input = await screen.findByTestId('input');
      act(() => {
        fireEvent.change(input, { target: { value: '1' } });
      });
      expect(await screen.findByText('Connecting...')).toBeInTheDocument();
      expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    });
  });
});
