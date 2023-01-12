import { createRoot } from 'react-dom/client';

import { initMap3Sdk } from '.';
import { CONSOLE_ANON_KEY } from './constants';

const container = document.getElementById('app');

const root = createRoot(container!);
root.render(
  <div className="p-2">
    <button
      onClick={() => {
        const map3 = initMap3Sdk({
          anonKey: process.env.CONSOLE_ANON_KEY || CONSOLE_ANON_KEY,
          generateDepositAddress: async (_coin, _network) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            return {
              address: '0x165CD37b4C644C2921454429E7F9358d18A45e14',
              memo: '0x666f',
            };
          },
          networkCode: 'goerli',
          rainbowRoad: true,
          theme: 'dark',
          userId: 'preview-user-id',
        });
        map3.open();
      }}
    >
      Open SDK
    </button>
  </div>
);
