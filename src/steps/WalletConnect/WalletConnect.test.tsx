import { act, fireEvent, render, screen } from '~/jest/test-utils';

import App from '../../App';
import * as useWeb3Mock from '../../hooks/useWeb3';
import { wait } from '../../utils/wait';

const TIMEOUT_BEFORE_MOCK_CONNECT = 100;
const TIMEOUT_BEFORE_MOCK_DISCONNECT = 200;

const mockConnect = jest.fn((_event: string, callback: () => void) => {
  if (_event === 'connect') {
    setTimeout(() => {
      callback();
    }, TIMEOUT_BEFORE_MOCK_CONNECT);
  }
});

const defaults = {
  accounts: ['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'],
  createSession: jest.fn(),
  killSession: jest.fn(),
  on: mockConnect,
  uri: 'wc:123@1?bridge=bridge.org&key=456',
};

const mockDefault = jest.fn(() => defaults);

jest.mock('@walletconnect/client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockDefault()),
}));

const mockSendTransaction = jest.fn();
jest.spyOn(useWeb3Mock, 'useWeb3').mockImplementation(() => ({
  getChainID: jest.fn(),
  providers: {},
  sendTransaction: mockSendTransaction,
  switchChain: jest.fn(),
}));

describe('WalletConnect', () => {
  beforeEach(async () => {
    render(
      <App
        config={{
          anonKey: process.env.CONSOLE_ANON_KEY || '',
          generateDepositAddress: async (_asset, _network, memoEnabled) => {
            if (memoEnabled) {
              return {
                address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                memo: '123456',
              };
            }
            return { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' };
          },
          theme: 'dark',
        }}
        onClose={() => {}}
      />
    );

    await screen.findByText('Loading...');
    const bitcoin = await screen.findByText('Bitcoin');
    fireEvent.click(bitcoin);
    const ethereum = await screen.findByText('Ethereum');
    fireEvent.click(ethereum);
  });
  it('renders', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    expect(
      await screen.findByTestId('scan-wallet-connect')
    ).toBeInTheDocument();
  });
  it('handles connection', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    await screen.findByTestId('scan-wallet-connect');
    await act(async () => {
      await wait(TIMEOUT_BEFORE_MOCK_CONNECT);
    });
    expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    expect(await screen.findByText(/0xf6/)).toBeInTheDocument();
  });
  it('populates address AND memo if the wallet is vetted/enabled', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    await screen.findByTestId('scan-wallet-connect');
    await act(async () => {
      await wait(TIMEOUT_BEFORE_MOCK_CONNECT);
    });
    expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    expect(await screen.findByText(/0xf6/)).toBeInTheDocument();
    const input = await screen.findByTestId('input');
    act(() => {
      fireEvent.change(input, { target: { value: '1' } });
    });
    const form = await screen.findByTestId('enter-amount-form');
    await act(async () => {
      await fireEvent.submit(form);
    });
    expect(mockSendTransaction).toHaveBeenCalledWith({
      data: '123456',
      from: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
      gas: '0x5238',
      to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      value: '0x2d79883d2000',
    });
  });
  it('populates ONLY address if the wallet is not vetted/enabled', async () => {
    const walletConnect = await screen.findByText('Spot');
    fireEvent.click(walletConnect);
    await screen.findByTestId('scan-wallet-connect');
    await act(async () => {
      await wait(TIMEOUT_BEFORE_MOCK_CONNECT);
    });
    expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    expect(await screen.findByText(/0xf6/)).toBeInTheDocument();
    const input = await screen.findByTestId('input');
    act(() => {
      fireEvent.change(input, { target: { value: '1' } });
    });
    const form = await screen.findByTestId('enter-amount-form');
    await act(async () => {
      await fireEvent.submit(form);
    });
    expect(mockSendTransaction).toHaveBeenCalledWith({
      data: '0x',
      from: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
      gas: '0x5208',
      to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      value: '0x2d79883d2000',
    });
  });
  it('handles previous connection', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    mockDefault.mockImplementationOnce(() => ({
      ...defaults,
      connected: true,
      peerMeta: { name: 'Rainbow' },
    }));
    expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
  });
  it('handles connection error', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    mockConnect.mockImplementation(
      (event: string, callback: (error: Error) => void | Error) => {
        if (event === 'connect') {
          callback(new Error('Error connecting to WalletConnect.'));
        }
      }
    );
    expect(await screen.findByText('WalletConnect Error')).toBeInTheDocument();
  });
  it('handles disconnection', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    mockDefault.mockImplementationOnce(() => ({
      ...defaults,
      peerMeta: { name: 'Rainbow' },
    }));
    mockConnect.mockImplementation((event: string, callback: () => void) => {
      if (event === 'connect') {
        setTimeout(() => {
          callback();
        }, TIMEOUT_BEFORE_MOCK_CONNECT);
      }
      if (event === 'disconnect') {
        setTimeout(() => {
          callback();
        }, TIMEOUT_BEFORE_MOCK_DISCONNECT);
      }
    });
    await screen.findByTestId('scan-wallet-connect');
    await act(async () => {
      await wait(TIMEOUT_BEFORE_MOCK_CONNECT);
    });
    expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    expect(await screen.findByText(/0xf6/)).toBeInTheDocument();
    await act(async () => {
      await wait(TIMEOUT_BEFORE_MOCK_DISCONNECT);
    });
    expect(await screen.findByText('Payment Method')).toBeInTheDocument();
  });
  it('handles disconnection error', async () => {
    const walletConnect = await screen.findByText('Rainbow');
    fireEvent.click(walletConnect);
    await mockConnect.mockImplementation(
      (event: string, callback: (error: Error) => void | Error) => {
        if (event === 'disconnect') {
          callback(new Error('Error connecting to WalletConnect.'));
        }
      }
    );
    expect(await screen.findByText('WalletConnect Error')).toBeInTheDocument();
  });
});