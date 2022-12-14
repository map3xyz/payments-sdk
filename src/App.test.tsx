import { mockConfig } from '~/jest/__mocks__/mockConfig';
import { render, screen } from '~/jest/test-utils';

import App from './App';

describe('App', () => {
  it('renders', async () => {
    render(<App config={mockConfig} onClose={() => {}} />);

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    const assetSelection = await screen.findByText('Select Asset');
    expect(assetSelection).toBeInTheDocument();
  });

  it('renders with an assetId', async () => {
    render(
      <App
        config={{
          ...mockConfig,
          assetId: 'satoshi123',
        }}
        onClose={() => {}}
      />
    );

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByText('Fetching Payment Methods...')
    ).toBeInTheDocument();
    const paymentMethod = await screen.findByText('Payment Method');
    expect(paymentMethod).toBeInTheDocument();
  });
  it('renders with an address and network', async () => {
    render(
      <App
        config={{
          ...mockConfig,
          address: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
          networkCode: 'ethereum',
        }}
        onClose={() => {}}
      />
    );

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByText('Fetching Payment Methods...')
    ).toBeInTheDocument();
    const paymentSelection = await screen.findByText('Payment Method');
    expect(paymentSelection).toBeInTheDocument();
  });
  it('renders with a network', async () => {
    render(
      <App
        config={{
          ...mockConfig,
          networkCode: 'bitcoin',
        }}
        onClose={() => {}}
      />
    );

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByText('Fetching Payment Methods...')
    ).toBeInTheDocument();
    const paymentSelection = await screen.findByText('Payment Method');
    expect(paymentSelection).toBeInTheDocument();
  });
  it('accepts an optional callback `authorizeTransaction`', async () => {
    render(
      <App
        config={{
          ...mockConfig,
          authorizeTransaction: async () => {
            return true;
          },
          rainbowRoad: true,
        }}
        onClose={() => {}}
      />
    );

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    const assetSelection = await screen.findByText('Select Asset');
    expect(assetSelection).toBeInTheDocument();
  });
  it('handles close', async () => {
    jest.useFakeTimers();
    const closeMock = jest.fn();

    render(<App config={mockConfig} onClose={closeMock} />);

    const closeButton = await screen.findByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
    closeButton.click();
    jest.advanceTimersByTime(1000);
    expect(closeMock).toHaveBeenCalled();
  });
});
