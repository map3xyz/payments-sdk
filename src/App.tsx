import { Modal } from '@map3xyz/components';
import React from 'react';

import { Map3InitConfig } from '.';
import AppWithAsset from './App.withAsset';
import AppWithAssetAndNetwork from './App.withAssetAndNetwork';
import Alerts from './components/Alerts';
import { Store } from './providers/Store';
import Map3SdkSteps from './steps';

const TRANSITION = 300;

const App: React.FC<AppProps> = ({ config, onClose }) => {
  const [network, asset] = config.slug?.split(':') ?? [];

  return (
    <div data-testid="map3-modal">
      <Modal
        className="map3 w-80"
        footerBackground
        onCancel={onClose}
        size="small"
        transition={TRANSITION}
        visible
      >
        {asset && network ? (
          <AppWithAssetAndNetwork config={config} onClose={onClose} />
        ) : asset ? (
          <AppWithAsset config={config} onClose={onClose} />
        ) : (
          <Store {...config}>
            <Alerts />
            <Map3SdkSteps onClose={onClose} />
          </Store>
        )}
      </Modal>
    </div>
  );
};

export type AppProps = {
  config: Map3InitConfig;
  onClose: () => void;
};

export default App;
